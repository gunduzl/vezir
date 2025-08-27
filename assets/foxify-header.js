class FStickyHeader extends HTMLElement {
	constructor() {
		super()
	}

  static get observedAttributes() { return ['data-header-sticky', 'data-header-transparent']; }
	connectedCallback() {
    this.classes = {
      headerSection: '.foxify-header',
      sticky: 'f:header--sticky',
      hidden: 'f:header--hidden',
      animate: 'f:header--animate',
      transparent: 'f:header--transparent',
      headerTransparent: 'foxify-header--transparent',
      bodyEnabled: 'f:header-sticky-enabled',
      bodyVisible: 'f:header-sticky--visible',
    }

		this.stickyEnabled = this.dataset.headerSticky === 'true'
		this.headerTransparent = this.dataset.headerTransparent === 'true'
    this.designMode = this.dataset.designMode && this.dataset.designMode === 'true'
		this.hideOnScroll = true
    this.header = this.querySelector('header') || this.closest('header')
    this.headerSection = this.closest(this.classes.headerSection)
		if (this.stickyEnabled) this.initStickyHeader()
	}

	disconnectedCallback() {
    this.removeEventListener('preventHeaderReveal', this._hideHeaderOnScrollUp)
    window.removeEventListener('scroll', this.onScrollHandler)
    this.headerSection.classList.remove(this.classes.headerTransparent)
    this._reset()
	}

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data-header-transparent' && this.headerSection) {
      this.headerTransparent = this.dataset.headerTransparent === 'true'
      if (!this.headerTransparent) {
        this.headerSection.classList.remove(this.classes.headerTransparent)
      } else {
        this.headerSection.classList.add(this.classes.headerTransparent)
      }
    }
  }
	initStickyHeader() {
		this.headerBounds = {}
		this.currentScrollTop = 0
		this.preventReveal = false

		this.onScrollHandler = this._onScroll.bind(this)
		this._hideHeaderOnScrollUp = () => this.preventReveal = true

    this.addEventListener('preventHeaderReveal', this._hideHeaderOnScrollUp)
    window.addEventListener('scroll', this.onScrollHandler, false)

		this._createObserver()

    if (this.headerTransparent) {
      this.headerSection.classList.add(this.classes.headerTransparent)
    }

		document.body.classList.add(this.classes.bodyEnabled)
	}

	_onScroll() {
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop

		if (scrollTop > this.currentScrollTop && scrollTop > this.offset) {
			requestAnimationFrame(this._hide.bind(this))
		} else if (scrollTop < this.currentScrollTop && scrollTop > this.offset) {
			if (!this.preventReveal) {
				requestAnimationFrame(this._reveal.bind(this))
			} else {
				window.clearTimeout(this.isScrolling)

				this.isScrolling = setTimeout(() => {
					this.preventReveal = false
				}, 66)

				requestAnimationFrame(this._hide.bind(this))
			}
		} else if (scrollTop <= this.headerBounds.top + 1) {
			requestAnimationFrame(this._reset.bind(this))
		}

		this.currentScrollTop = scrollTop
	}

	_createObserver() {
		let observer = new IntersectionObserver((entries, observer) => {
			this.headerBounds = entries[0].intersectionRect
			this.offset =  this.headerBounds.bottom
			observer.disconnect()
		})

		observer.observe(this.header)
	}

	_hide() {
		this.headerSection.classList.add(this.classes.sticky, this.classes.hidden)
		document.body.classList.remove(this.classes.bodyVisible)
	}

	_reveal() {
		this.headerSection.classList.add(this.classes.sticky, this.classes.animate)
		this.headerSection.classList.remove(this.classes.hidden)
		document.body.classList.add(this.classes.bodyVisible)
	}

	_reset() {
		this.headerSection.classList.remove(this.classes.hidden, this.classes.sticky, this.classes.animate)
	}
}

customElements.define('f-sticky-header', FStickyHeader)
