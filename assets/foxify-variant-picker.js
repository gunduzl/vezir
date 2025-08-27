if (!customElements.get('f-variant-picker')) {
	class VariantPicker extends HTMLElement {
		constructor() {
			super();
			this.selectors = {
				productSku: '[data-product-sku]',
				productAvailability: '[data-product-availability]',
        		selectedValues: ['.f\\:variant-picker__selected-value']
			}

			this.Utils = window.Foxify.Utils
			this.Extensions = window.Foxify.Extensions
			this.optionsSwatches = window.Foxify.Extensions ? window.Foxify.Extensions.optionsSwatches : {}
			this.productId = this.dataset.productId
			this.sectionId = this.dataset.sectionId
			this.section = document.querySelector(`.f-${this.sectionId}`)
			this.xForm = this.section && this.section.querySelectorAll('f-product-form')
			this.domNodes = this.Utils.queryDomNodes(this.selectors, this.section)
			this.addEventListener('change', this.onVariantChange);

			if (this.optionsSwatches && this.optionsSwatches.enabled) {
				this.initOptionSwatches()
			}
      this.getVariantData()

			const currentVariantId = this.dataset.currentVariantId;
      if (currentVariantId && window.location.search.includes('?variant=')) {
				this.currentVariant = this.variantData.find((variant) => variant.id === Number(currentVariantId));
				setTimeout(() => {
					this.updateMedia(0);
				}, 300);
			}
		}

		onVariantChange() {
			this.updateOptions();
			this.updateMasterId();
			this.updateSelectedValue();
			this.toggleAddButton(true, '', false);
			this.updatePickupAvailability();
			this.removeErrorMessage();

			if (!this.currentVariant) {
				this.toggleAddButton(true, '', true);
				this.setUnavailable();
			} else {
				this.updateMedia();
				this.updateURL();
				this.updateVariantInput();
				this.renderProductInfo();
				this.updateProductMeta();
			}
			window.Foxify.Events.emit(`${this.productId}__VARIANT_CHANGE`, this.currentVariant, this)
		}

		updateOptions() {
			const fields = Array.from(this.querySelectorAll('.f\\:variant-picker__input'));
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
      if (this.options && this.domNodes.selectedValues.length) {
        this.domNodes.selectedValues.map(((op, index) => {
          op.textContent = this.options[index]
        }))
      }
		}

		updateMedia(transition = 300) {
			if (!this.currentVariant?.featured_media) return;

			const mediaGallery = this.section.querySelector('f-media-gallery')

			if (mediaGallery) mediaGallery.setActiveMedia(this.currentVariant.featured_media.id, transition)
		}

		updateURL() {
			if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
			window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
		}

		updateVariantInput() {
      const productForms = this.closest('form[action*="/cart/add"]') ? [this.closest('form[action*="/cart/add"]')] : document.querySelectorAll(`#product-form-${this.sectionId}, #product-form-f-${this.sectionId}, #product-form-installment-${this.sectionId}`);
      productForms.forEach((productForm) => {
        const inputs = productForm?.querySelectorAll('[name="id"]');
        inputs.length && inputs.forEach(input => {
          input.value = this.currentVariant.id;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        })
      });
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
			if (this.xForm) {
				this.xForm.forEach((form) => {
					form.handleErrorMessage && form.handleErrorMessage();
				})
			}
		}

		renderProductInfo() {
			const classes = {
				onSale: 'f:price--on-sale',
				soldOut: 'f:price--sold-out',
				hide: 'f:hidden',
				visibilityHidden: 'f:visibility-hidden'
			}
			const selectors = {
				priceWrapper: '.f\\:price',
				salePrice: '.f\\:price-item--sale',
				compareAtPrice: ['.f\\:price-item--regular'],
				unitPrice: '.f\\:price__unit',
				saleBadge: '.f\\:price__badge-sale',
        saleAmount: '.f\\:badge--sale'
			}
			const {money_format} = window.Foxify.Settings
			const {
				priceWrapper,
				salePrice,
				unitPrice,
				compareAtPrice,
				saleBadge,
				saleAmount
			} = this.Utils.queryDomNodes(selectors, this.section)

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

			if (unit_price_measurement && unitPrice) {
				unitPrice.classList.remove(classes.hide)
				const unitPriceContent = `<span>${this.Utils.formatMoney(this.currentVariant.unit_price, money_format)}</span>/<span data-unit-price-base-unit>${this._getBaseUnit()}</span>`
				unitPrice.innerHTML = unitPriceContent
			} else {
				unitPrice?.classList.add(classes.hide)
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
			if (!this.xForm) return;

			this.xForm.forEach(form => {
				const addButton = form.querySelector('[name="add"]')
				if (!addButton) return;

				const addButtonText = addButton.querySelector('.f\\:btn__label')
				if (disable) {
					addButton.setAttribute('disabled', 'disabled')
					if (text && addButtonText) addButtonText.innerHTML = text
				} else {
					addButton.removeAttribute('disabled')
					addButtonText && (addButtonText.innerHTML = window.Foxify.Strings.addToCart)
				}

				if (!modifyClass) return;
			})

		}

		setUnavailable() {
			this.xForm.forEach(form => {
				const addButton = form.querySelector('[name="add"]')
				if (addButton) {
					const addButtonText = addButton.querySelector('.f\\:btn__label')
					addButtonText && (addButtonText.innerHTML = window.Foxify.Strings.unavailable)
				}

				const priceWrapper = this.section.querySelector('.f\\:price')
				if (priceWrapper) priceWrapper.classList.add('f:visibility-hidden')
			})
		}

		initOptionSwatches() {
			const {optionsSwatches} = window.Foxify.Extensions
			const optionNodes = this.querySelectorAll('.f\\:variant-picker__option')
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


		getVariantData() {
			this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent?.trim());
			return this.variantData;
		}
	}
	customElements.define('f-variant-picker', VariantPicker);
}
