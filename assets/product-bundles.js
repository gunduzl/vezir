if (!customElements.get("m-product-bundle")) {
  class MProductBundle extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.selectors = {
        submitBundle: "[data-add-bundle]",
        errorWrapper: ".product-bundles__error",
        cartDrawer: "m-cart-drawer",
      };

      this.domNodes = queryDomNodes(this.selectors, this);

      this.rootUrl = window.Shopify.routes.root;
      this.sectionId = this.dataset.sectionId;
      this.blockId = this.dataset.blockId || this.sectionId; // Fallback for scenarios with two blocks in a custom content section
      this.section = document.getElementById(`m-product-bundles-${this.sectionId}`);
      this.ctaButton = this.querySelector('.product-bundles__cta');
      this.hotspots = this.section?.querySelectorAll('.m-product-bundles__image .product-bundles__item-index');
      this.productItems = this.querySelectorAll(`.product-bundles__item`);
      this.dropdowns = this.querySelectorAll(`.m-product-option--dropdown-select`);
      this.total = this.querySelector(`[id^="Total"] [data-total-price]`);

      this.addEventListener('change', this.onChange.bind(this));
      addEventDelegate({
        context: this,
        selector: this.selectors.submitBundle,
        handler: (e) => this._handleAddItems(e, this),
      });

      // this.hotspots && this.hotspots.forEach((hotspot) => {
      //   hotspot.addEventListener('mouseover', this.handleHover.bind(this, 'enter'));
      //   hotspot.addEventListener('mouseleave', this.handleHover.bind(this, 'leave'));
      // });
    }

    disconnectedCallback() {
      // this.hotspots && this.hotspots.forEach((hotspot) => {
      //   hotspot.removeEventListener('mouseover', this.handleHover.bind(this, 'enter'));
      //   hotspot.removeEventListener('mouseleave', this.handleHover.bind(this, 'leave'));
      // });
    }

    onChange(e) {
      const { target } = e;
      const productBunbldeItem = target.closest('.product-bundles__item');
      const quantityInput = productBunbldeItem.querySelector('m-quantity-input');
      const mainImage = productBunbldeItem.querySelector('.product-bundles__item-image .m-image');
      const { productId, blockId, productHandle } = productBunbldeItem.dataset;

      const optionIds = target.options[target.selectedIndex].dataset.optionsId;

      let totalPrice = 0;
      this.dropdowns.forEach((dropdown) => {
        const price = parseFloat(dropdown.options[dropdown.selectedIndex].dataset.price);
        totalPrice += price;
      });

      this.total.innerHTML = formatMoney(totalPrice, window.MinimogSettings.money_format);

      fetch(`${this.rootUrl}products/${productHandle}/?section_id=${this.sectionId}&option_values=${optionIds}`)
        .then(response => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');

          const updateSourceFromDestination = (id, shouldHide = (source) => false) => {
            const source = html.getElementById(`${id}-${blockId}`);
            const destination = this.querySelector(`#${id}-${blockId}`);
            if (source && destination) {
              destination.innerHTML = source.innerHTML;
              destination.classList.toggle('m:hidden', shouldHide(source));
            }
          };

          updateSourceFromDestination('QuantityRule', ({ classList }) => classList.contains('m:hidden'));
          updateSourceFromDestination('Price');
          this.updateQuantityRules(quantityInput, blockId, productId, html);

          // update media
          const selectedVariantMedia = html.querySelector(`.product-bundles__item[data-block-id=${blockId}] .selected-variant-media`);
          if (selectedVariantMedia && mainImage) {
            mainImage.innerHTML = selectedVariantMedia.innerHTML;
          }
        }).catch((error) => {
          console.error(error);
        });
    }

    _handleAddItems(e, bundle) {
      e.preventDefault();
      const products = bundle.querySelectorAll('.product-bundles__item');
      const errorWrapper = bundle.querySelector(this.selectors.errorWrapper);
      const button = bundle.querySelector(this.selectors.submitBundle);
      const cartDrawer = document.querySelector(this.selectors.cartDrawer);

      let sectionsToBundle = [];
      document.documentElement.dispatchEvent(
        new CustomEvent('cart:grouped-sections', { bubbles: true, detail: { sections: sectionsToBundle } })
      );

      const items = {
        items: [...products].filter(product => product.dataset.available === 'true').map((product) => ({
          id: product.querySelector("[name=id]").value,
          quantity: product.querySelector("m-quantity-input") ? Number(product.querySelector("m-quantity-input").input.value) : 1,
        }))
      };

      let data = {
        ...items,
        sections: sectionsToBundle,
        sections_url: window.location.pathname,
      };

      const config = fetchConfig("javascript");
      config.method = "POST";
      config.body = JSON.stringify(data);

      this._toggleLoading(true, button);
      const { MinimogSettings, MinimogStrings } = window;
      fetch(`${MinimogSettings.routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then(async (response) => {
          if (response.status) {
            this._showError(response.description || "Failed to add all items to cart!", errorWrapper);
            document.dispatchEvent(
              new CustomEvent("product-ajax:error", {
                detail: {
                  errorMessage: response.description,
                },
              })
            );
            return;
          }

          if (MinimogSettings.use_ajax_atc) {
            if (cartDrawer && MinimogSettings.enable_cart_drawer) {
              MinimogTheme.Notification.show({
                target: cartDrawer.querySelector("m-cart-items"),
                method: "prepend",
                type: "success",
                message: MinimogStrings.itemAdded,
                delay: 400,
              });
              // Open cart drawer
              cartDrawer.open();
            } else {
              window.MinimogTheme.Notification.show({
                target: errorWrapper ? errorWrapper : document.body,
                method: "appendChild",
                type: "success",
                message: MinimogStrings.itemAdded,
                last: 3000,
                sticky: !errorWrapper,
              });
            }

            window.MinimogEvents.emit(MinimogTheme.pubSubEvents.cartUpdate, { cart: response });

            document.dispatchEvent(
              new CustomEvent("product-ajax:added", {
                detail: {
                  product: response,
                },
              })
            );
          } else {
            window.location = MinimogSettings.routes.cart;
          }
        })
        .catch((err) => {
          console.error("Error adding items to cart:", err);
          this._showError("An error occurred while adding items to the cart.", errorWrapper);
        })
        .finally(() => {
          this._toggleLoading(false, button);
        });
    }

    _showError(err, errorWrapper) {
      MinimogTheme.Notification.show({
        target: errorWrapper,
        method: "appendChild",
        type: "warning",
        message: err,
      });
    }

    _toggleLoading(loading, button) {
      const method = loading ? 'add' : 'remove';
      button.classList[method]("m-spinner-loading");
    }

    updateQuantityRules(input, sectionId, productId, parsedHTML) {
      if (!input) return;

      input.updateQuantityRules(sectionId, productId, parsedHTML);

      this.setQuantityBoundries(input, sectionId, productId);
    }

    setQuantityBoundries(input, sectionId, productId) {
      input.setQuantityBoundries(sectionId, productId);
    }

    handleHover(type, e) {
      const { target } = e;
      const index = target.dataset.index;
      this.classList.toggle('is-hovering', type === 'enter');
      const selectedItem = this.querySelector(`.product-bundles__item[data-index="${index}"]`);

      if (type === 'enter') {
        selectedItem.classList.add('is-selected');
        target.classList.add('is-active')
      } else {
        this.productItems.forEach(item => item.classList.remove('is-selected'));
        this.hotspots.forEach(hotspot => hotspot.classList.remove('is-active'));
      }
    }

    scrollToTop(target, offset = 80) {
      const scrollIntoView = (selector, offset) => {
        window.scrollTo({
          behavior: 'smooth',
          top: selector.getBoundingClientRect().top - document.body.getBoundingClientRect().top - offset
        })
      }

      scrollIntoView(target, offset);
    };
  }
  customElements.define("m-product-bundle", MProductBundle);
}
