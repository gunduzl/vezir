if (!customElements.get('f-sticky-atc-bar')) {
	customElements.define('f-sticky-atc-bar', class StickyAtcBar extends HTMLElement {
		constructor() {
			super()
			document.body.classList.add('sticky-atc-bar-enabled')
		}

		connectedCallback() {
			this.productFormActions = document.querySelector('.f\\:product-single__block-buy-buttons, .f\\:main-product-form, .f\\:product-form')
			this.container = this.closest('.f\\:sticky-atc')

			const stickyAtcBlock = this.closest('.f\\:product-single__block')
			const foxifyWrapper = document.querySelector('.f-app')
			if (stickyAtcBlock && foxifyWrapper && ![...foxifyWrapper.children].includes(stickyAtcBlock)) {
				const formElement = document.createElement('form');
        formElement.method = 'post'
        formElement.action = '/cart/add'
        formElement.classList.add('sticky-atc-form')
        const stickyForm = this.querySelector('f-product-form')
        formElement.innerHTML = stickyForm.innerHTML
        stickyForm.innerHTML = ''
        stickyForm.appendChild(formElement)
				foxifyWrapper.appendChild(stickyAtcBlock);
				this.init();
			}
		}

		init() {
			this.productId = this.dataset.productId
      this.variantData = this.querySelector('[type="application/json"]') ? JSON.parse(this.querySelector('[type="application/json"]').textContent) : [];
      const variantSelect = this.querySelector('.f\\:sticky-atc__variant-select')

			const isMobile = window.matchMedia('(max-width: 639px)')
			isMobile.addEventListener('change', this.checkDevice.bind(this))
			// Initial check
			this.checkDevice(isMobile)

      variantSelect && variantSelect.addEventListener('change', this.onVariantChange.bind(this))

			// const headerHeight = window.FoxThemeSettings.headerHeight || 80
			const rootMargin = `0px 0px 0px 0px`
			this.observer = new IntersectionObserver((entries) => {
				entries.forEach(entry => {
					const method = entry.intersectionRatio !== 1 ? 'add' : 'remove'
					this.container.classList[method]('f:sticky-atc--show')
				})
			}, {threshold: 1, rootMargin})
			this.setObserveTarget()
			this.syncWithMainProductForm()
		}

    onVariantChange(event) {
      const variantId = event.target.value
      const variant = this.variantData.find(v => v.id === Number(variantId))
      this.updatePrice(variant)
    }

		setObserveTarget = () => {
      if (this.productFormActions) {
        this.observer.observe(this.productFormActions)
        this.observeTarget = this.productFormActions
      }
		}

		checkDevice(e) {
			const sectionHeight = this.clientHeight + 'px'
			document.documentElement.style.setProperty("--f-sticky-atc-bar-height", sectionHeight)
		}

		syncWithMainProductForm() {
			const variantInput = this.querySelector('[name="id"]')
			window.Foxify.Events.subscribe(`${this.productId}__VARIANT_CHANGE`, async (variant) => {
				variantInput.value = variant.id
        this.updatePrice(variant)
			})
		}

    updatePrice(variant) {
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
	})
}
