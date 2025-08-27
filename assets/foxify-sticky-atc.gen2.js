if (!customElements.get('x-sticky-atc-bar')) {
	customElements.define('x-sticky-atc-bar', class StickyAtcBar extends HTMLElement {
		constructor() {
			super()
			document.body.classList.add('sticky-atc-bar-enabled')
		}

		connectedCallback() {
			this.productFormActions = document.querySelector('.x-product-form')
			this.container = this.closest('.x-sticky-atc')
    
			const stickyAtcBlock = this.closest('.x-extension\\:sticky-atc-block')
			const foxifyWrapper = document.querySelector('.x-main')
			if (stickyAtcBlock && foxifyWrapper && ![...foxifyWrapper.children].includes(stickyAtcBlock)) {
				foxifyWrapper.appendChild(stickyAtcBlock)
                const content = this.querySelector('template').content?.firstElementChild?.cloneNode(true);
                this.innerHTML = content.innerHTML
				this.init()
			}
		}

		init() {
			(async () => {
				const productJson = await window.Foxify.Utils.fetchJSON(`/products/${this.dataset.productHandle}.js`);
				this.variantJson = productJson.variants
				console.log(this.variantJson, 'this.variantJson');
			})();

			this.submitButton = this.querySelector('.x-button[name="add"]')
			this.shopifyButton = this.querySelector('.shopify-payment-button')
			this.variantInput = this.querySelector('[name="id"]')
			this.productId = this.dataset.productId

			const isMobile = window.matchMedia('(max-width: 639px)')
			isMobile.addEventListener('change', this.checkDevice.bind(this))
			// Initial check
			this.checkDevice(isMobile)

			const rootMargin = `0px 0px 0px 0px`
			this.observer = new IntersectionObserver((entries) => {
				entries.forEach(entry => {
					const method = entry.intersectionRatio !== 1 ? 'add' : 'remove'
					this.container.classList[method]('x-sticky-atc--show')
				})
			}, {threshold: 1, rootMargin});

			if (this.dataset.selectedVariantAvailable !== 'true') {
				this.submitButton && this.submitButton.setAttribute('disabled', 'true')
				this.shopifyButton && this.shopifyButton.setAttribute('disabled', 'true')
			}

			this.setObserveTarget()
			this.syncWithMainProductForm()
			this.variantInput.addEventListener('change', this.onVariantChange.bind(this))

		}

		setObserveTarget = () => {
			if (this.productFormActions) {
				this.observer.observe(this.productFormActions)
				this.observeTarget = this.productFormActions
			}
		}

		checkDevice(e) {
			const sectionHeight = this.clientHeight + 'px'
			document.documentElement.style.setProperty("--x-sticky-atc-bar-height", sectionHeight)
		}

		onVariantChange(event) {
			const variantId = event.target.value
			const btnLabel = this.submitButton?.querySelector('.x-btn__label')

			this.selectedVariant = this.variantJson.find(variant => variant.id === Number(variantId))
			if (this.selectedVariant) {
				this.variantInput.value = this.selectedVariant.id
				if (this.selectedVariant.available) {
					this.submitButton && this.submitButton.removeAttribute('disabled')
					this.shopifyButton && this.shopifyButton.removeAttribute('disabled')
					btnLabel && (btnLabel.textContent = window.Foxify.Strings.addToCart)
				} else {
					this.submitButton && this.submitButton.setAttribute('disabled', 'true')
					this.shopifyButton && this.shopifyButton.setAttribute('disabled', 'true')
					btnLabel && (btnLabel.textContent = window.Foxify.Strings.soldOut)
				}
				this.updatePrice()
			}
			
		}

		updatePrice() {
			const variant = this.selectedVariant

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
			  unitPrice: '.x-price__unit',
			  saleBadge: '.x-price__badge-sale',
			  saleAmount: '[data-sale-value]'
			}
			const {money_format} = window.Foxify.Settings
			const {
			  priceWrapper,
			  salePrice,
			  compareAtPrice,
			} = window.Foxify.Utils.queryDomNodes(selectors, this)
	  
			const {compare_at_price, price} = variant
	  
			const onSale = compare_at_price && compare_at_price > price
			const soldOut = !variant.available
	  
			if (onSale) {
			  priceWrapper.classList.add(classes.onSale)
			} else {
			  priceWrapper.classList.remove(classes.onSale)
			}
	  
			if (soldOut) {
			  priceWrapper.classList.add(classes.soldOut)
			} else {
			  priceWrapper.classList.remove(classes.soldOut)
			}
	  
			if (priceWrapper) priceWrapper.classList.remove(classes.visibilityHidden)
			if (salePrice) salePrice.innerHTML = window.Foxify.Utils.formatMoney(price, money_format)
	  
			if (compareAtPrice && compareAtPrice.length && compare_at_price > price) {
			  compareAtPrice.forEach(item => item.innerHTML = window.Foxify.Utils.formatMoney(compare_at_price, money_format))
			} else {
			  compareAtPrice.forEach(item => item.innerHTML = window.Foxify.Utils.formatMoney(price, money_format))
			}
		  }

		syncWithMainProductForm() {
			const btnLabel = this.submitButton?.querySelector('.x-btn__label')
			window.Foxify.Events.subscribe(`${this.productId}__VARIANT_CHANGE`, async (variant) => {
				if (variant) {
					this.variantInput.value = variant.id
					this.variantInput.dispatchEvent(new Event('change'))
				} else {
					btnLabel && (btnLabel.textContent = window.Foxify.Strings.unavailable)
					this.submitButton && this.submitButton.setAttribute('disabled', 'true')
					this.shopifyButton && this.shopifyButton.setAttribute('disabled', 'true')
				}
			})
		}
	})
}
