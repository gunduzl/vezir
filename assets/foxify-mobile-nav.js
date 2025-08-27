class MobileNavToggle extends HTMLElement {
	constructor() {
		super()
		this.menuDrawer = document.querySelector('.f-drawer-mobile-nav')
		this.addEventListener('click', this.openNav.bind(this))

		this.menuDrawer?.addEventListener('close', () => {
			this.setAttribute('aria-expanded', 'false')
		})
	}

	disconnectedCallback() {
		this.removeEventListener('click', this.openNav.bind(this))
	}

	openNav() {
		if (this.menuDrawer) {
			this.menuDrawer.openDrawer()
			this.setAttribute('aria-expanded', 'true')
		}
	}
}
customElements.define('mobile-nav-toggle', MobileNavToggle)
