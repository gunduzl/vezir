function _validateOptionsArray(options) {
  if (Array.isArray(options) && typeof options[0] === "object") {
    throw new Error(options + "is not a valid array of options.");
  }
}

function _validateProductStructure(product) {
  if (typeof product !== "object") {
    throw new TypeError(product + " is not an object.");
  }

  if (Object.keys(product).length === 0 && product.constructor === Object) {
    throw new Error(product + " is empty.");
  }
}

function getVariantFromOptionArray(product, options) {
  _validateProductStructure(product);
  _validateOptionsArray(options);

  var result = product.variants.filter(function (variant) {
    return options.every(function (option, index) {
      return variant.options[index] === option;
    });
  });

  return result[0] || null;
}

if (!customElements.get('x-variant-picker')) {
  class VariantPicker extends HTMLElement {
    constructor() {
      super();

      this.selectors = {
        productSku: '[data-product-sku]',
        productAvailability: '[data-product-availability]',
        selectedValues: ['.x-variant-picker__selected-value'],
        pickerFields: ['.x-variant-picker__input']
      }

      this.section = this.closest('.x-section')
      this.productContainer = this.closest('.x-product-form')

      this.waitForUtils(() => {
        this.Utils = window.Foxify.Utils;
        this.Extensions = window.Foxify.Extensions;
        this.optionsSwatches = window.Foxify.Extensions ? window.Foxify.Extensions.optionsSwatches : {};
        this.productId = this.dataset.productId;
        this.sectionId = this.dataset.sectionId;
        this.hideUnavailableOptions = this.dataset.hideUnavailableOptions === 'true';
        this.buyButtons = this.productContainer ? this.productContainer.querySelectorAll('x-buy-button') : [];
        this.domNodes = this.Utils.queryDomNodes(this.selectors, this.productContainer);

        this.getVariantData()
        const currentVariantId = this.dataset.currentVariantId;
        this.currentVariant = this.variantData ? this.variantData.find((variant) => variant.id === Number(currentVariantId)) : null;
        
        if (this.currentVariant && window.location.search.includes('?variant=')) {
          setTimeout(() => {
            this.updateMedia(0);
          }, 500);
        }

        this.hideSoldOutAndUnavailableOptions();
        
        this.addEventListener('change', this.onVariantChange);

        if (this.optionsSwatches && this.optionsSwatches.enabled) {
          this.initOptionSwatches();
        }
        
      });
    }

    waitForUtils(callback) {
      if (window.Foxify && window.Foxify.Utils) {
        callback();
      } else {
        setTimeout(() => this.waitForUtils(callback), 100);
      }
    }

    onVariantChange() {
      this.updateOptions();
      this.getSelectedVariant()
      this.updateMasterId();
      this.toggleAddButton(true, '', false);
      this.updatePickupAvailability();
      this.removeErrorMessage();
      this.updateSelectedValue()

      if (!this.currentVariant) {
        this.toggleAddButton(true, '', true);
        this.setUnavailable();
      } else {
        this.updateMedia();
        this.updateURL();
        this.updateVariantInput();
        this.renderProductInfo();
        this.updateProductMeta();
        this.hideSoldOutAndUnavailableOptions();
      }
      window.Foxify.Events.emit(`${this.productId}__VARIANT_CHANGE`, this.currentVariant, this)
      if (window.Foxify && typeof window.Foxify.onVariantChange === 'function') {
        window.Foxify.onVariantChange(this.currentVariant, this.productContainer)
      }
    }

    getSelectedVariant() {
			let variant = getVariantFromOptionArray({variants: this.variantData}, this.options)
			let options = [...this.options]
			if (!variant) {
				options.pop()
				variant = getVariantFromOptionArray({variants: this.variantData}, options)
				if (!variant) {
					options.pop()
					variant = getVariantFromOptionArray({variants: this.variantData}, options)
				}
				if (variant && variant.options) {
					this.options = [...variant.options]
				}
				this.updateSelectedOptions()
			}
			this.currentVariant = variant
		}

    updateOptions() {
      const fields = Array.from(this.querySelectorAll('.x-variant-picker__input'));
      this.options = fields.map((field) => {
        const fieldType = field.dataset.fieldType
        if (fieldType === 'button') return Array.from(field.querySelectorAll('input')).find((radio) => radio.checked).value
        return field.querySelector('select') ? field.querySelector('select').value : '';
      });
    }

    updateMasterId() {
      this.currentVariant = this.getVariantData().find((variant) => {
        return !variant.options.map((option, index) => {
          return this.options[index] === option;
        }).includes(false);
      });
    }

    updateSelectedValue() {
      if (this.options && this.domNodes.pickerFields?.length) {
        this.domNodes.pickerFields.map(((pickerField, index) => {
          pickerField.dataset.selectedValue = this.options[index]
          const labelValue = pickerField.querySelector(this.selectors.selectedValues[0])
          if (labelValue) {
            labelValue.textContent = this.options[index]
          }
        }))
      }
    }

    updateSelectedOptions() {
			this.domNodes.pickerFields.forEach((field, index) => {
				const selectedValue = field.dataset.selectedValue
				if (selectedValue !== this.options[index]) {
					const input = field.querySelector(`input[value="${this.options[index]}"]`)  
          const select = field.querySelector('select')
					if (input) {
						input.checked = true
					}
          if (select) {
            select.value = this.options[index]
          }
          field.dataset.selectedValue = this.options[index]
				}
			})
		}

    updateMedia(transition = 300) {
      if (!this.currentVariant?.featured_media) return;

      const mediaGallery = this.productContainer?.querySelector('x-media-gallery')

      if (mediaGallery) mediaGallery.setActiveMedia(this.currentVariant.featured_media.id, transition)
    }

    updateURL() {
      if (!this.currentVariant || Foxify.Settings.template !== 'product') return;
      window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
    }

    updateVariantInput() {
      const productForms = this.closest('form[action*="/cart/add"]') ? [this.closest('form[action*="/cart/add"]')] : document.querySelectorAll(`#product-form-${this.sectionId}, #product-form-installment-${this.sectionId}`);
      productForms.forEach(form => {
        const inputs = form.querySelectorAll('[name="id"]');
        inputs.length && inputs.forEach(input => {
          input.value = this.currentVariant.id;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        })
      })
    }

    updatePickupAvailability() {
      const pickUpAvailability = document.querySelector('pickup-availability');
      if (!pickUpAvailability) return;

      if (this.currentVariant && this.currentVariant.available) {
        pickUpAvailability.fetchAvailability(this.currentVariant.id);
      } else {
        pickUpAvailability.removeAttribute('available');
        pickUpAvailability.innerHTML = '';
      }
    }

    removeErrorMessage() {
      this.buyButtons.forEach((button) => {
        button.handleErrorMessage();
      })
    }

    renderProductInfo() {
      const classes = {
        onSale: 'x-price--on-sale',
        soldOut: 'x-price--sold-out',
        hide: 'x-hidden',
        visibilityHidden: 'x-visibility-hidden'
      }
      const selectors = {
        priceWrapper: '.x-price',
        salePrice: '.x-price-item--sale',
        compareAtPrice: ['.x-price-item--regular'],
        unitPrice: '.x-price__unit-wrapper',
        saleBadge: '.x-price__badge-sale',
        saleAmount: '.x-badge--sale'
      }
      const {money_format} = window.Foxify.Settings
      const {
        priceWrapper,
        salePrice,
        unitPrice,
        compareAtPrice,
        saleBadge,
        saleAmount
      } = this.Utils.queryDomNodes(selectors, this.productContainer)

      const {compare_at_price, price, unit_price_measurement} = this.currentVariant

      this.toggleAddButton(!this.currentVariant.available, window.Foxify.Strings.soldOut);

      const onSale = compare_at_price && compare_at_price > price
      const soldOut = !this.currentVariant.available

      if (priceWrapper) {
        priceWrapper.classList.toggle(classes.onSale, onSale);
        priceWrapper.classList.toggle(classes.soldOut, soldOut);
        priceWrapper.classList.remove(classes.visibilityHidden)
      }

      if (salePrice) salePrice.innerHTML = this.Utils.formatMoney(price, money_format)

      if (compareAtPrice?.length) {
        const priceToShow = compare_at_price > price ? compare_at_price : price;
        compareAtPrice.forEach(item => item.innerHTML = this.Utils.formatMoney(priceToShow, money_format));
      }

      if (unit_price_measurement && unitPrice) {
        unitPrice.classList.remove(classes.hide)
        const unitPriceContent = `<span>${this.Utils.formatMoney(this.currentVariant.unit_price, money_format)}</span>/<span data-unit-price-base-unit>${this._getBaseUnit()}</span>`
        unitPrice.innerHTML = unitPriceContent
      } else {
        unitPrice?.classList.add(classes.hide)
      }

      if (saleBadge && compare_at_price > price) {
        const type = saleBadge.dataset.type
        if (type === 'text') return
        let value
        if (type === 'percentage') {
          const saving = (compare_at_price - price) * 100 / compare_at_price
          value = Math.round(saving) + '%'
        }
        if (type === 'fixed_amount') {
          value = this.Utils.formatMoney(compare_at_price - price, money_format)
        }

        saleAmount.innerHTML = window.Foxify.Strings.savePriceHtml?.replace(/\{\{\s*amount\s*\}\}/g, value)
      }

    }

    _getBaseUnit = () => {
      return this.currentVariant.unit_price_measurement.reference_value === 1
        ? this.currentVariant.unit_price_measurement.reference_unit
        : this.currentVariant.unit_price_measurement.reference_value +
        this.currentVariant.unit_price_measurement.reference_unit
    }

    updateProductMeta() {
      const {available, sku, noSku} = this.currentVariant
      const {inStock, outOfStock} = window.Foxify.Strings
      const {productAvailability, productSku} = this.domNodes;

      if (productSku) {
        if (sku) {
          productSku.textContent = sku
        } else {
          productSku.textContent = noSku
        }
      }

      if (productAvailability) {
        if (available) {
          productAvailability.textContent = inStock
          productAvailability.classList.remove('out-of-stock')
        } else {
          productAvailability.textContent = outOfStock
          productAvailability.classList.add('out-of-stock')
        }
      }
    }

    toggleAddButton(disable = true, text, modifyClass = true) {
      this.buyButtons.forEach(button => {
        const btnLabel = button.querySelector('.x-btn__label')
        if (disable) {
          button.setAttribute('disabled', 'true')
          if (text && btnLabel) btnLabel.textContent = text
        } else {
          button.removeAttribute('disabled')
          btnLabel && (btnLabel.innerHTML = window.Foxify.Strings.addToCart)
        }
      })
      // if (!modifyClass) return;
    }

    setUnavailable() {
      const priceWrapper = this.productContainer?.querySelector('.x-price')
      if (priceWrapper) priceWrapper.classList.add('x-visibility-hidden')
      this.toggleAddButton(true, window.Foxify.Strings.unavailable)
    }

    initOptionSwatches() {
      const {optionsSwatches} = window.Foxify.Extensions
      const optionNodes = this.querySelectorAll('.x-variant-picker__option')
      optionNodes.length && optionNodes.forEach(optNode => {
        let customImage, customColor_1, customColor_2
        const {value, fallbackValue, optionType} = optNode.dataset
        if (optionType === 'color') {
          const check = optionsSwatches.options.find(c => c.title.toLowerCase() === value.toLowerCase())
          customColor_1 = check ? check.color_1 : ''
          customColor_2 = check ? check.color_2 : ''
          customImage = check ? check.image : ''

          if (customColor_1) {
            optNode.style.setProperty('--option-color-1', `${customColor_1}`)
          }
          if (customColor_2) {
            optNode.style.setProperty('--option-color-2', `${customColor_2}`)
          }

          if (!customColor_1 && !customColor_2 && window.Foxify.Utils.isValidColor(fallbackValue)) {
            optNode.style.setProperty('--option-color-1', `${fallbackValue}`)
          }

          if (customImage) {
            optNode.querySelector('label').classList.add('has-image')
            optNode.querySelector('label').style.backgroundImage = `url(${window.Foxify.Utils.getSizedImageUrl(customImage, '100x100')})`
          }
          return false;
        }
      })
    }

    hideSoldOutAndUnavailableOptions = () => {
      if (!this.hideUnavailableOptions || !this.currentVariant) return;

      const classes = {
        soldOut: "x-variant-picker__option--soldout",
        unavailable: "x-variant-picker__option--unavailable",
      };
      const optionNodes = this.querySelectorAll('.x-variant-picker__option')

      const maxOptions = parseInt(this.dataset.maxOptions)

      console.log(maxOptions, 'this.dataset.maxOptions');

      optionNodes.forEach((optNode) => {
        const { optionPosition, value } = optNode.dataset;
        const optPos = Number(optionPosition);
        const isSelectOption = optNode.tagName === "OPTION";

        let matchVariants = [];
        if (optPos === maxOptions) {
          const optionsArray = Array.from(this.currentVariant?.options || []);
          optionsArray[maxOptions - 1] = value;
          matchVariants.push(getVariantFromOptionArray({variants: this.variantData}, optionsArray));
        } else {
          matchVariants = this.variantData.filter(
            (v) => v.options[optPos - 1] === value && v.options[optPos - 2] === this.currentVariant[`option${optPos - 1}`]
          );
        }

        matchVariants = matchVariants.filter(Boolean);

        console.log(matchVariants, 'matchVariants');
        
        if (matchVariants.length) {
          optNode.classList.remove(classes.unavailable);
          isSelectOption && optNode.removeAttribute("disabled");
          const isSoldOut = matchVariants.every((v) => v.available === false);
          const method = isSoldOut ? "add" : "remove";
          optNode.classList[method](classes.soldOut);
        } else {
          optNode.classList.add(classes.unavailable);
          isSelectOption && optNode.setAttribute("disabled", "true");
        }
      });
    };

    getVariantData() {
      this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent?.trim());
      return this.variantData;
    }
  }
  customElements.define('x-variant-picker', VariantPicker);
}
