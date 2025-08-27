class MCartDrawer extends HTMLElement {
  constructor() {
    super();
    this.getSectionToRenderListener = this.getSectionToRender.bind(this);
  }

  get sectionName() {
    return 'cart-drawer';
  }

  get cartDrawerInner() {
    return this.querySelector(".m-cart-drawer__inner");
  }

  get cartDrawerCloseIcon() {
    return this.querySelector(".m-cart-drawer__close");
  }

  getSectionToRender(event) {
    event.detail.sections.push(this.sectionName);
  }

  connectedCallback() {
    document.addEventListener('cart:grouped-sections', this.getSectionToRenderListener);

    this.setHeaderCartIconAccessibility();
    this.addEventListener("click", (event) => {
      if (event.target.closest(".m-cart-drawer__inner") !== this.cartDrawerInner || event.target === this.cartDrawerCloseIcon) {
        this.close();
      }
    });
  }

  disconnectedCallback() {
    document.removeEventListener('cart:grouped-sections', this.getSectionToRenderListener);
  }

  setHeaderCartIconAccessibility() {
    const cartLinks = document.querySelectorAll(".m-cart-icon-bubble");
    cartLinks.forEach((cartLink) => {
      cartLink.setAttribute("role", "button");
      cartLink.setAttribute("aria-haspopup", "dialog");
      cartLink.addEventListener("click", (event) => {
        if (MinimogSettings.enable_cart_drawer) {
          event.preventDefault();
          this.open(cartLink);
        }
      });
    });
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    this.classList.add("m-cart-drawer--active");
    document.documentElement.classList.add("prevent-scroll");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.style.setProperty("--m-bg-opacity", "0.5");
        this.style.setProperty("--translate-x", "0");
        window.MinimogEvents.emit(MinimogTheme.pubSubEvents.openCartDrawer);
      });
    });
  }

  close() {
    this.style.setProperty("--m-bg-opacity", "0");
    this.style.setProperty("--translate-x", "100%");
    setTimeout(() => {
      this.classList.remove("m-cart-drawer--active");
      document.documentElement.classList.remove("prevent-scroll");
    }, 300);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define("m-cart-drawer", MCartDrawer);

class MCartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener("click", (event) => {
      event.preventDefault();
      const cartItems = this.closest("m-cart-items");
      cartItems.updateQuantity(this.dataset.index, 0);
    });
  }
}

customElements.define("m-cart-remove-button", MCartRemoveButton);

class MCartTemplate extends HTMLElement {
  constructor() {
    super();
    document.addEventListener('cart:grouped-sections', this.getSectionToRender.bind(this));
  }

  get sectionName() {
    return 'cart-template';
  }

  getSectionToRender(event) {
    event.detail.sections.push(this.sectionName);
  }
}

customElements.define("m-cart", MCartTemplate);

class MCartItems extends HTMLElement {
  cartUpdateUnsubscriber = undefined;

  constructor() {
    super();

    window.FoxKitSections = [this.sectionName, this.cartCountSectionName];
    this.rootUrl = window.Shopify.routes.root;

    this.onCartRefreshListener = this.onCartRefresh.bind(this);
    document.addEventListener("cart:refresh", this.onCartRefreshListener);

    this.addEventListener('change', debounce(this.onChange.bind(this), 300));
    this.cartUpdateUnsubscriber = MinimogEvents.subscribe(MinimogTheme.pubSubEvents.cartUpdate, this.onCartUpdate.bind(this));
  }

  connectedCallback() {
    this.isCartPage = MinimogSettings.templateName === "cart";
    this.cartDrawerInner = document.querySelector(".m-cart-drawer__inner");
    let loadingTarget = this.cartDrawerInner;
    if (this.isCartPage) loadingTarget = document.body;
    this.loading = new MinimogLibs.AnimateLoading(loadingTarget, { overlay: loadingTarget });
  }

  get sectionName() {
    return this.dataset.sectionName || 'cart-template';
  }

  get cartCountSectionName() {
    return 'cart-count';
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }

    document.removeEventListener("cart:refresh", this.onCartRefreshListener);
  }

  onChange(event) {
    const { target } = event;
    if (target.closest('m-quantity-input')) {
      this.updateQuantity(
        target.dataset.index,
        target.value,
        document.activeElement.getAttribute('name'),
        target
      );
    }
  }

  onCartError(errors, target, line) {
    if (target) {
      const quantityInput = target.closest('m-quantity-input');
      quantityInput.setValidity(errors);
    } else {
      window.location.href = MinimogSettings.routes.cart;
    }

    this.updateLiveRegions(line, errors);
  }

  async onCartRefresh(event) {
    const cartSelector = this.isCartPage ? 'm-cart' : 'm-cart-drawer';
    const cartElement = document.querySelector(cartSelector);
    const cartCount = document.querySelectorAll('m-cart-count');
    try {
      await fetch(`${this.rootUrl}?sections[]=${this.sectionName}&sections[]=${this.cartCountSectionName}`)
        .then((response) => response.text())
        .then((responseText) => {
          const parseJSON = JSON.parse(responseText);

          // Refresh Cart
          this.getSectionsToRender().forEach((section) => {
            const elementToReplace =
              document.getElementById(section.id)?.querySelector(section.selector) || document.getElementById(section.id);
            if (elementToReplace) elementToReplace.innerHTML = this.getSectionInnerHTML(parseJSON[this.sectionName], section.selector);
          });

          // Update cart count
          const responseCartCount = parseJSON[this.cartCountSectionName];
          const newCartCount = new DOMParser().parseFromString(responseCartCount, "text/html");
          cartCount.forEach(cart => cart.onUpdate(newCartCount));
        });

      if (event.detail?.open === true) {
        if (!this.isCartPage) cartElement.open();
      }
    } catch (error) {
      console.error("Error refreshing cart:", error);
    }
  }

  onCartUpdate(event) {
    this.getSectionsToRender().forEach((section) => {
      const elementToReplace = document.getElementById(section.id)?.querySelector(section.selector);
      if (elementToReplace) elementToReplace.innerHTML = this.getSectionInnerHTML(event.cart.sections[this.sectionName], section.selector);
    });

    document.dispatchEvent(
      new CustomEvent('cart:updated', {
        detail: {
          cart: event.cart,
        },
      })
    );
  }

  updateQuantity(line, quantity, name, target) {
    this.loading.start();

    const { routes } = window.MinimogSettings;

    let sectionsToBundle = [];
    document.documentElement.dispatchEvent(
      new CustomEvent('cart:grouped-sections', { bubbles: true, detail: { sections: sectionsToBundle } })
    );

    const body = JSON.stringify({
      line,
      quantity,
      sections: sectionsToBundle,
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => response.json())
      .then((response) => {

        if (response.errors) {
          this.loading.finish();
          this.onCartError(response.errors, target, line);
          return;
        }

        window.MinimogEvents.emit(MinimogTheme.pubSubEvents.cartUpdate, { cart: response });
      })
      .catch((error) => {
        console.log(error);
      }).finally(() => {
        this.loading.finish();
      });
  }

  updateLiveRegions(line, message) {
    let lineItemNode = document.getElementById(`MinimogCart-Item-${line}`);
    if (message !== "" && lineItemNode) {
      MinimogTheme.Notification.show({
        target: lineItemNode,
        type: "warning",
        message: message,
      });
    }
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'MinimogCartDrawer',
        selector: '#MinimogCartDrawerHeader',
      },
      {
        id: 'MinimogCartDrawer',
        selector: '#MinimogCartDrawerBody',
      },
      {
        id: 'MinimogCartDrawer',
        selector: '#MinimogCartDrawerFooter',
      },
      {
        id: 'MinimogCart',
        selector: '#MinimogCartHeader',
      },
      {
        id: 'MinimogCart',
        selector: '#MinimogCartBody',
      },
      {
        id: 'MinimogCart',
        selector: '#MinimogCartFooter',
      },
    ];
  }
}

customElements.define("m-cart-items", MCartItems);


/* Cart Addons */
if (!customElements.get("m-cart-addons")) {
  class MCartAddons extends HTMLElement {
    constructor() {
      super();
      this.selectors = {
        zipCode: '[name="address[zip]"]',
        province: '[name="address[province]"]',
        country: '[name="address[country]"]',
        addressForm: '[data-address="root"]',
        shippingMessage: ".m-cart-addon__shipping-rate",
        cartDiscountCode: '[name="discount"]',
        cartDiscountCodeNoti: "[data-discount-noti]",
        cartNote: '[name="note"]',
        saveAddonButton: ".m-cart-addon--save",
        closeAddonButton: ".m-cart-addon--close",
        calcShippingButton: ".m-cart-addon--calculate",
        triggerAddonButton: ".m-cart-addon--trigger-button",
        devliveryTime: '[name="attributes[Delivery time]"]',
      };
    }

    connectedCallback() {
      this.cartWrapper = document.querySelector(".m-cart-drawer");
      this.isCartPage = MinimogSettings.templateName === "cart";
      if (this.isCartPage) {
        this.cartWrapper = document.querySelector(".m-cart__footer--wrapper");
      }
      this.initAddress = false;
      this.cartOverlay = this.cartWrapper.querySelector(".m-cart__overlay");
      this.domNodes = queryDomNodes(this.selectors, this);
      this.rootUrl = window.Shopify.routes.root;
      this.discountCodeKey = "minimog-discount-code";
      this.deliveryCodeKey = "minimog-delivery-code";
      this.init();
    }

    disconnectedCallback() {
      if (this._removeCloseAddonButton) this._removeCloseAddonButton();
      if (this._removeCalcShippingButton) this._removeCalcShippingButton();
      this.querySelectorAll(this.selectors.triggerAddonButton).forEach((button) => {
        button.removeEventListener('click', this.handleOpenAddon.bind(this));
      });
      this.querySelectorAll(this.selectors.saveAddonButton).forEach((button) => {
        button.removeEventListener('click', this.handleSaveAddonValue.bind(this));
      });
    }

    init() {
      const { cartDiscountCode, cartDiscountCodeNoti, devliveryTime } = this.domNodes;

      this.querySelectorAll(this.selectors.triggerAddonButton).forEach((button) => {
        button.addEventListener('click', this.handleOpenAddon.bind(this));
      });

      this.querySelectorAll(this.selectors.saveAddonButton).forEach((button) => {
        button.addEventListener('click', this.handleSaveAddonValue.bind(this));
      });

      this._removeCloseAddonButton = addEventDelegate({
        selector: this.selectors.closeAddonButton,
        context: this.cartWrapper,
        handler: this.close.bind(this),
      });

      this._removeCalcShippingButton = addEventDelegate({
        selector: this.selectors.calcShippingButton,
        context: this.cartWrapper,
        handler: this.calcShipping.bind(this),
      });
      if (cartDiscountCode) {
        const code = localStorage.getItem(this.discountCodeKey);
        if (code) {
          cartDiscountCode.value = code;
          if (cartDiscountCodeNoti) {
            cartDiscountCodeNoti.style.display = "inline";
          }
        }
      }
      if (devliveryTime) {
        const code = localStorage.getItem(this.deliveryCodeKey);
        if (code) devliveryTime.value = code;
      }

      const today = new Date().toISOString().slice(0, 16);
      const deliveryTimeElm = this.querySelector("#delivery-time");
      if (deliveryTimeElm) deliveryTimeElm.min = today;
    }

    handleOpenAddon(e) {
      e.preventDefault();
      const { target } = e;

      if (this.isCartPage) {
        const addonCurrentActive = document.querySelector(".m-cart-addon__body.open");
        if (addonCurrentActive) addonCurrentActive.classList.remove("open");
      }
      const { open: addonTarget } = target.dataset;
      const addonNode = this.cartWrapper.querySelector(`#m-addons-${addonTarget}`);
      this.removeActiveAllButton();
      target.classList.add("active");
      addonNode && addonNode.classList.add("open");
      this.cartOverlay && this.cartOverlay.classList.add("open");
      this.openAddon = addonNode;

      if (addonTarget === "shipping") {
        fetchSection("country-options", { url: window.MinimogSettings.base_url })
          .then((html) => {
            const select = html.querySelector("#AddressCountry");
            const options = select && select.querySelectorAll("option");
            const defaultSelect = addonNode.querySelector("#MadrressCountry select");
            options &&
              options.forEach((option) => {
                defaultSelect && defaultSelect.appendChild(option);
              });
            this.setupCountries();
            defaultSelect.value = defaultSelect && defaultSelect.dataset.default;
          })
          .catch(console.error);
      }
    }

    removeActiveAllButton() {
      const triggerButtons = this.querySelectorAll(this.selectors.triggerAddonButton);
      triggerButtons && triggerButtons.forEach((button) => button.classList.remove("active"));
    }

    setupCountries() {
      if (this.initAddress) return;
      if (Shopify && Shopify.CountryProvinceSelector) {
        new Shopify.CountryProvinceSelector("AddressCountry", "AddressProvince", {
          hideElement: "AddressProvinceContainer",
        });
        this.initAddress = true;
      }
    }

    close(event) {
      event.preventDefault();
      this.openAddon.classList.remove("open");
      this.cartOverlay && this.cartOverlay.classList.remove("open");
      this.removeActiveAllButton();
      this.openAddon = null;
    }

    calcShipping(event) {
      event.preventDefault();
      const actionsWrapper = event.target.closest(".m-cart-addon__action");
      actionsWrapper.classList.add("m-spinner-loading");
      const zipCode = this.domNodes.zipCode && this.domNodes.zipCode.value && this.domNodes.zipCode.value.trim();
      const country = this.domNodes.country.value;
      const province = this.domNodes.province.value;
      this.domNodes.shippingMessage.classList.remove("error");
      this.domNodes.shippingMessage.innerHTML = "";
      const showDeliveryDays = actionsWrapper.dataset.showDeliveryDays === "true";
      fetch(
        `${this.rootUrl}cart/shipping_rates.json?shipping_address%5Bzip%5D=${zipCode}&shipping_address%5Bcountry%5D=${country}&shipping_address%5Bprovince%5D=${province}`
      )
        .then((res) => res.json())
        .then((res) => {
          if (res && res.shipping_rates) {
            const { shipping_rates } = res;
            const { shippingRatesResult, noShippingRate } = MinimogStrings;
            if (shipping_rates.length > 0) {
              actionsWrapper.classList.remove("m-spinner-loading");
              const shippingLabel = document.createElement("P");
              shippingLabel.classList.add("m-cart-addon__shipping-rate--label");
              shippingLabel.innerHTML = `${shippingRatesResult.replace("{{count}}", shipping_rates.length)}:`;
              this.domNodes.shippingMessage.appendChild(shippingLabel);
              shipping_rates.map((rate) => {
                const { deliveryOne = "Day", deliveryOther = "Days" } = actionsWrapper.dataset;
                let deliveryDays = "";
                if (rate.delivery_days.length > 0 && showDeliveryDays) {
                  let textDay = deliveryOne;
                  const firstDeliveryDay = rate.delivery_days[0];
                  const lastDeliveryDay = rate.delivery_days.at(-1);
                  if (firstDeliveryDay > 1) textDay = deliveryOther;
                  if (firstDeliveryDay === lastDeliveryDay) {
                    deliveryDays = `(${firstDeliveryDay} ${textDay})`;
                  } else {
                    deliveryDays = `(${firstDeliveryDay} - ${lastDeliveryDay} ${textDay})`;
                  }
                }
                const shippingRateItem = document.createElement("P");
                shippingRateItem.classList.add("m-cart-addon__shipping-rate--item");
                shippingRateItem.innerHTML = `${rate.name}: <span>${rate.price} ${Shopify.currency.active}</span> ${deliveryDays}`;
                this.domNodes.shippingMessage.appendChild(shippingRateItem);
              });
            } else {
              actionsWrapper.classList.remove("m-spinner-loading");
              this.domNodes.shippingMessage.innerHTML = `<p>${noShippingRate}</p>`;
            }
          } else {
            actionsWrapper.classList.remove("m-spinner-loading");
            Object.entries(res).map((error) => {
              this.domNodes.shippingMessage.classList.add(error[0] && error[0].toLowerCase());
              const message = `${error[1][0]}`;
              const shippingRateError = document.createElement("P");
              shippingRateError.classList.add("m-cart-addon__shipping-rate--error");
              shippingRateError.innerHTML = `${message}<sup>*</sup>`;
              this.domNodes.shippingMessage.appendChild(shippingRateError);
            });
          }
        })
        .catch(console.error);
    }

    handleSaveAddonValue(e) {
      e.preventDefault();
      const { target } = e;

      const { cartDiscountCode, cartDiscountCodeNoti, devliveryTime } = this.domNodes;
      if (target.dataset.action === "coupon" && cartDiscountCode) {
        const code = cartDiscountCode.value;
        localStorage.setItem(this.discountCodeKey, code);
        if (code !== "" && cartDiscountCodeNoti) {
          cartDiscountCodeNoti.style.display = "inline";
        } else {
          cartDiscountCodeNoti.style.display = "none";
        }
        this.close(e);
      }
      if (target.dataset.action === "note") {
        this.updateCartNote();
        this.close(e);
      }
      if (target.dataset.action === "delivery") {
        const code = devliveryTime.value;
        const isValidDate = Date.parse(code);
        if (isValidDate > Date.now()) {
          localStorage.setItem(this.deliveryCodeKey, code);
          this.close(e);
        } else {
          localStorage.setItem(this.deliveryCodeKey, "");
          devliveryTime.value = "";
          window.MinimogTheme.Notification.show({
            target: this.querySelector(".m-cart-addon-message-error"),
            method: "appendChild",
            type: "error",
            message: window.MinimogStrings.valideDateTimeDelivery,
            last: 3000,
            sticky: false,
          });
        }
      }
    }

    updateCartNote() {
      const cartNoteValue = this.domNodes.cartNote.value;
      const body = JSON.stringify({ note: cartNoteValue });
      fetch(`${window.MinimogSettings.routes.cart_update_url}`, { ...fetchConfig(), ...{ body } });
    }
  }
  customElements.define("m-cart-addons", MCartAddons);
}