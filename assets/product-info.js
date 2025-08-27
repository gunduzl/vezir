if (!customElements.get("product-info")) {
  class ProductInfo extends HTMLElement {
    abortController = undefined;
    onVariantChangeUnsubscriber = undefined;
    pendingRequestUrl = null;
    preProcessHtmlCallbacks = [];
    postProcessHtmlCallbacks = [];

    constructor() {
      super();

      this.onWindowLoad = this.onWindowLoad.bind(this);
    }

    get productId() {
      return this.getAttribute('data-product-id');
    }

    get sectionId() {
      return this.dataset.originalSection || this.dataset.sectionId;
    }

    get disableSelectedVariantDefault() {
      return this.dataset.disableSelectedVariantDefault === "true" || false;
    }

    get enableVariantGroupImages() {
      return this.dataset.enableVariantGroupImages === "true" || false;
    }

    get enableHistoryState() {
      return this.dataset.enableHistoryState === "true" || false;
    }

    get viewMode() {
      return this.dataset.viewMode || 'main-product'
    }

    get pickupAvailability() {
      return this.querySelector(`pickup-availability`);
    }

    get productForm() {
      return this.querySelector('product-form'); // fallback: product-form.m-product-form--main
    }

    get productMedia() {
      return this.querySelector(`[id^="MediaGallery-${this.dataset.sectionId}"]`);
    }

    get variantPicker() {
      return this.querySelector('variant-picker');
    }

    get quantityInput() {
      return this.querySelector(`m-quantity-input input`);
    }
    get quantityInputStickyAtc() {
      return this.querySelector(`.m-sticky-addtocart m-quantity-input input`);
    }

    get stickyAtc() {
      return this.querySelector('sticky-atc');
    }

    connectedCallback() {
      if (this.viewMode === "main-product") {
        window.addEventListener("load", this.onWindowLoad);
      }

      this.init();
    }

    disconnectedCallback() {
      window.removeEventListener("load", this.onWindowLoad);
      this.onVariantChangeUnsubscriber();
      this.cartUpdateUnsubscriber?.();
    }

    init() {
      this.currentVariant = this.getSelectedVariant(this);
      this.quantityInputs = [];

      if (this.quantityInput) {
        this.quantityInputs.push(this.quantityInput);
      }
      if (this.quantityInputStickyAtc) {
        this.quantityInputs.push(this.quantityInputStickyAtc);
      }

      if (this.disableSelectedVariantDefault) {
        this.handleDisableSelectedVariantDefault();
      }

      this.onVariantChangeUnsubscriber = MinimogEvents.subscribe(
        MinimogTheme.pubSubEvents.optionValueSelectionChange,
        this.handleOptionValueChange.bind(this)
      );

      this.showFeaturedMedia = this.dataset.showFeaturedMedia === "true" || false;

      this.initialMedias = this.productMedia ? this.productMedia.querySelectorAll('.m-product-media--item') : null;
      this.initialThumbs = this.productMedia ? this.productMedia.querySelectorAll(".m-product-media--slider__thumbnails [data-media-type]") : null;

      if (this.enableVariantGroupImages) {
        this.variantGroupImagesData = this.getVariantGroupImagesData();
        this.showFeaturedMedia = false;
      };

      this.initQuantityHandlers();

      if (this.currentVariant && !this.showFeaturedMedia) {
        this.updateMedia(this.currentVariant);
      }
    }

    getVariantGroupImagesData() {
      return (
        JSON.parse(
          this.querySelector('#variantGroup[type="application/json"]')
            .textContent
        ) || {}
      );
    }

    handleOptionValueChange({ data: { event, target, selectedOptionValues } }) {
      if (!this.contains(event.target)) return;

      const productUrl = target.dataset.productUrl || this.pendingRequestUrl || this.dataset.url;
      const shouldSwapProduct = this.dataset.url !== productUrl;
      // this.pendingRequestUrl = productUrl;
      const shouldFetchFullPage = this.dataset.updateUrl === 'true' && shouldSwapProduct;

      this.renderProductInfo({
        requestUrl: this.buildRequestUrlWithParams(productUrl, selectedOptionValues, shouldFetchFullPage),
        targetId: target.id,
        callback: shouldSwapProduct
          ? this.handleSwapProduct(productUrl, shouldFetchFullPage, this.viewMode)
          : this.handleUpdateProductInfo(productUrl, this.viewMode),
      });
    }

    renderProductInfo({ requestUrl, targetId, callback }) {
      this.abortController?.abort();
      this.abortController = new AbortController();

      fetch(requestUrl, { signal: this.abortController.signal })
        .then((response) => response.text())
        .then((responseText) => {
          this.pendingRequestUrl = null;
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          callback(html);
        })
        .then(() => {
          // set focus to last clicked option value
          document.querySelector(`#${targetId}`)?.focus();
        })
        .catch((error) => {
          if (error.name === 'AbortError') {
            console.log('Fetch aborted by user');
          } else {
            console.error(error);
          }
        });
    }

    buildRequestUrlWithParams(url, optionValues, shouldFetchFullPage = false) {
      const params = [];

      !shouldFetchFullPage && params.push(`section_id=${this.sectionId}`);

      if (optionValues.length) {
        params.push(`option_values=${optionValues.join(',')}`);
      }

      return `${url}?${params.join('&')}`;
    }

    handleUpdateProductInfo(productUrl, viewMode) {
      return (html) => {
        const quickView = html.querySelector('#MainProduct-quick-view__content');
        if (quickView && viewMode === 'quick-view') {
          html = new DOMParser().parseFromString(quickView.innerHTML, "text/html");
        }

        const variant = this.getSelectedVariant(html);

        this.pickupAvailability?.update(variant);
        this.updateOptionValues(html);
        this.updateURL(productUrl, variant?.id);
        this.updateVariantInputs(variant?.id);

        if (!variant) {
          this.setUnavailable();
          return;
        }

        this.updateMedia(variant);

        const updateSourceFromDestination = (id, shouldHide = (source) => false) => {
          const source = html.getElementById(`${id}-${this.sectionId}`);
          const destination = this.querySelector(`#${id}-${this.dataset.sectionId}`);
          if (source && destination) {
            destination.innerHTML = source.innerHTML;
            destination.classList.toggle('m:hidden', shouldHide(source));
          }
        };

        updateSourceFromDestination('Price');
        updateSourceFromDestination("Inventory");
        updateSourceFromDestination("Sku");
        updateSourceFromDestination("Availability");
        updateSourceFromDestination("Volume");
        updateSourceFromDestination('PricePerItem');

        this.updateQuantityRules(this.sectionId, this.productId, html);
        this.querySelector(`#QuantityRules-${this.dataset.section}`)?.classList.remove('m:hidden');
        this.querySelector(`#VolumeNote-${this.dataset.section}`)?.classList.remove('m:hidden');

        const addButtonUpdated = html.getElementById(`ProductSubmitButton-${this.sectionId}`);
        this.toggleAddButton(
          addButtonUpdated ? addButtonUpdated.hasAttribute('disabled') : true,
          window.MinimogStrings.soldOut
        );

        this.currentVariant = variant;

        MinimogEvents.emit(MinimogTheme.pubSubEvents.variantChange, {
          data: { variant, sectionId: this.sectionId, html },
        });

        document.dispatchEvent(
          new CustomEvent('variant:changed', {
            detail: {
              variant: this.currentVariant,
            },
          })
        );
      };
    }

    handleSwapProduct(productUrl, updateFullPage, viewMode) {
      return (html) => {
        const quickView = html.querySelector('#MainProduct-quick-view__content');
        if (quickView && viewMode === 'quick-view') {
          html = new DOMParser().parseFromString(quickView.innerHTML, "text/html");
        }

        const selector = updateFullPage ? "product-info[id^='MainProduct']" : 'product-info';
        const productInfo = html.querySelector(selector);
        const variant = this.getSelectedVariant(productInfo);
        productInfo.dataset.disableSelectedVariantDefault = false;

        this.updateURL(productUrl, variant?.id);

        if (updateFullPage) {
          document.querySelector('head title').innerHTML = html.querySelector('head title').innerHTML;
          HTMLUpdateUtility.viewTransition(
            document.querySelector('main'),
            html.querySelector('main'),
            this.preProcessHtmlCallbacks,
            this.postProcessHtmlCallbacks
          );
        } else {
          HTMLUpdateUtility.viewTransition(
            this,
            productInfo,
            this.preProcessHtmlCallbacks,
            this.postProcessHtmlCallbacks
          );
        }

        this.currentVariant = variant;
      };
    }

    getSelectedVariant(productInfoNode) {
      const selectedVariant = productInfoNode.querySelector('variant-picker [data-selected-variant]')?.innerHTML;
      return !!selectedVariant ? JSON.parse(selectedVariant) : null;
    }

    updateURL(url, variantId) {
      if (this.dataset.updateUrl === 'false') return;
      window.history.replaceState({}, '', `${url}${this.enableHistoryState && variantId ? `?variant=${variantId}` : ''}`);
    }

    updateVariantInputs(variantId) {
      document
        .querySelectorAll(`#product-form-${this.dataset.sectionId}, #product-form-installment-${this.dataset.sectionId}`)
        .forEach((productForm) => {
          const input = productForm.querySelector('input[name="id"]');
          input.value = variantId ?? '';
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    updateOptionValues(html) {
      const variantPicker = html.querySelector('variant-picker');
      if (variantPicker) {
        HTMLUpdateUtility.viewTransition(this.variantPicker, variantPicker, this.preProcessHtmlCallbacks);
      }
    }

    setUnavailable() {
      const productForm = document.getElementById(
        `product-form-${this.sectionId}`
      );
      const addButton = productForm.querySelector('[name="add"]');

      if (addButton) {
        this.toggleAddButton(true, window.MinimogStrings.unavailable);
      }

      const selectors = [
        "Price",
        "Inventory",
        "Sku",
        "Availability"
      ]
        .map((id) => `#${id}-${this.sectionId}`)
        .join(", ");
      document
        .querySelectorAll(selectors)
        .forEach((selector) => selector.classList.add('m:hidden'));
    }

    toggleAddButton(disable = true, text, modifyClass = true) {
      const productForm = document.getElementById(`product-form-${this.dataset.sectionId}`);
      if (!productForm) return;
      const addButton = productForm.querySelector('[name="add"]');
      const addButtonText = productForm.querySelector('[name="add"] > span.m-add-to-cart--text');
      if (!addButton) return;

      if (disable) {
        addButton.setAttribute('disabled', 'disabled');
        if (text) addButtonText.textContent = text;
      } else {
        addButton.removeAttribute('disabled');
        addButtonText.innerHTML = window.MinimogStrings.addToCart;
      }

      if (!modifyClass) return;
    }

    updateMedia(variant) {
      if (!this.productMedia) return;
      if (this.enableVariantGroupImages && this.variantGroupImagesData.enable) {
        this.handleVariantGroupImage(variant);

        if (this.productMedia.slider) {
          this.productMedia.slider.updateSlides();
          this.productMedia.navSlider.updateSlides();

          this.productMedia.slider.slideTo(0);
          this.productMedia.navSlider.slideTo(0);

          this.productMedia.handleSlideChange();
        }
        if (this.productMedia.enableImageZoom) {
          this.productMedia.handlePhotoswipe();
        }
      } else {
        const setActiveMedia = () => {
          if (typeof this.productMedia.setActiveMedia === 'function') {
            this.productMedia.init();
            this.productMedia.setActiveMedia(variant);
            return true; // Indicate success
          }
          return false; // Indicate failure
        };

        if (!setActiveMedia()) {
          this.timer = setInterval(() => {
            if (setActiveMedia()) {
              clearInterval(this.timer);
            }
          }, 100);
        }
      }
    }

    handleDisableSelectedVariantDefault() {
      let urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("variant")) return;

      this.pickerFields = this.querySelectorAll("[data-picker-field]");

      this.pickerFields && this.pickerFields.forEach((field) => {
        let pickerType = field.dataset.pickerField;
        switch (pickerType) {
          case "select":
            let selectBox = field.querySelector("select");
            let option = document.createElement("option");
            option.text = this.dataset.variantOptionNoneText;
            option.setAttribute("disabled", "");
            option.setAttribute("selected", "");

            selectBox.add(option, 0);
            break;
          default:
            let checkedInputs = field.querySelectorAll("input:checked");
            checkedInputs &&
              checkedInputs.forEach(function (input) {
                input.removeAttribute("checked");
              });
            break;
        }

        field.dataset.selectedValue = "";
        if (field.querySelector(".option-label--selected")) field.querySelector(".option-label--selected").textContent = "";
      });

      this.setUnavailable();
      this.currentVariant = null;
    }

    handleVariantGroupImage(variant) {
      const selectedVariantData = this.variantGroupImagesData.mapping.find(
        (item) => Number(item.id) === variant.id
      );

      const selectedMedias = (initialItems) => {
        const selectedVariantMedias = Array.from(initialItems)
          .map((media) => {
            const index = selectedVariantData.media.indexOf(media.dataset.mediaId);
            const mediaType = media.dataset.mediaType;
            if (index !== -1 || mediaType !== 'image') {
              return media;
            }
            return null;
          })
          .filter(Boolean);

        if (selectedVariantMedias.length <= 0) {
          return Array.from(initialItems).map((media, index) => {
            media.dataset.index = index;

            media.removeAttribute('style'); // Avoid style of swipe slide item
            media.querySelector('.m-product-media').setAttribute("style", `--animation-order: ${index + 1};`);

            return media;
          });
        }

        const orderedMedias = Object.values(selectedVariantData.media)
          .map(id => selectedVariantMedias.find(media => media.dataset.mediaId === id))
          .filter(Boolean);

        const remainingMedias = selectedVariantMedias.filter(media => !Object.values(selectedVariantData.media).includes(media.dataset.mediaId));

        return Array.from([...orderedMedias, ...remainingMedias]).map((media, index) => {
          media.dataset.index = index;

          media.removeAttribute('style'); // Avoid style of swipe slide item
          media.querySelector('.m-product-media').setAttribute("style", `--animation-order: ${index + 1};`);

          return media;
        });
      }

      const mediaWrapper = this.productMedia.querySelector(".m-media-gallery__list");
      const thumbWrapper = this.productMedia.querySelector(".m-product-media--slider__thumbnails .swiper-wrapper");

      const layout = this.productMedia.dataset.layout;

      mediaWrapper.innerHTML = "";
      thumbWrapper.innerHTML = "";

      selectedMedias(this.initialMedias).forEach((media, index) => {
        if (layout === "layout-2") {
          media.classList.remove("m-col-span-2");
          if (index % 3 === 0) {
            media.classList.add("m-col-span-2");
          }
        }
        mediaWrapper.append(media);
      });
      selectedMedias(this.initialThumbs).forEach((media) => {
        media.classList.toggle("swiper-slide-thumb-active", media.dataset.index === "0");
        thumbWrapper.append(media);
      });
    }

    initQuantityHandlers() {
      if (this.quantityInputs.length <= 0) return;

      this.setQuantityBoundries();
      if (!this.hasAttribute("data-original-section-id")) {
        this.cartUpdateUnsubscriber = MinimogEvents.subscribe(
          MinimogTheme.pubSubEvents.cartUpdate,
          this.fetchQuantityRules.bind(this)
        );
      }
    }

    setQuantityBoundries() {
      this.quantityInputs.forEach((input) => {
        const quantityInputWrapper = input.closest('m-quantity-input');
        quantityInputWrapper.setQuantityBoundries(this.sectionId, this.productId);
      });
    }

    fetchQuantityRules() {
      const currentVariantId = this.productForm?.variantIdInput?.value;
      if (!currentVariantId) return;

      this.querySelector('.quantity__rules-cart')?.classList.add('loading');

      fetch(
        `${this.getAttribute(
          "data-url"
        )}?variant=${currentVariantId}&section_id=${this.sectionId}`
      )
        .then((response) => response.text())
        .then((responseText) => {
          const parsedHTML = new DOMParser().parseFromString(
            responseText,
            "text/html"
          );
          this.updateQuantityRules(
            this.sectionId,
            this.productId,
            parsedHTML
          );
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          this.querySelector('.quantity__rules-cart')?.classList.remove('loading');
        });
    }

    updateQuantityRules(sectionId, productId, parsedHTML) {
      if (this.quantityInputs.length <= 0) return;

      this.quantityInputs.forEach((input) => {
        const quantityInputWrapper = input.closest('m-quantity-input');
        quantityInputWrapper.updateQuantityRules(sectionId, productId, parsedHTML);
      });

      this.setQuantityBoundries();
    }

    addRecentViewedProduct() {
      const cookies = getCookie('m-recent-viewed-products')
      let products = cookies ? JSON.parse(cookies) : []
      if (products.indexOf(MinimogSettings.productHandle) === -1) {
        products.unshift(MinimogSettings.productHandle)
        products = products.slice(0, 20)
        setCookie('m-recent-viewed-products', JSON.stringify(products));
      }
    }

    onWindowLoad() {
      this.acc = [];
      MinimogTheme.CompareProduct && MinimogTheme.CompareProduct.setCompareButtonsState();
      MinimogTheme.Wishlist && MinimogTheme.Wishlist.setWishlistButtonsState();
      this.addRecentViewedProduct();

      addEventDelegate({
        context: this,
        selector: (window.__minimog_review_selector || '') + '.m-product-collapsible .jdgm-widget-actions-wrapper, .m-product-collapsible .spr-summary-actions-newreview',
        handler: (e) => {
          const index = e.target.closest('.m-product-collapsible').dataset.index
          setTimeout(() => {
            this.acc[Number(index)].setContentHeight()
          }, 300)
        },
        capture: true
      })
    }
  }

  customElements.define("product-info", ProductInfo);
}