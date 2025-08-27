class XTabs extends HTMLElement {
	constructor() {
		super()
		this.selectors = {
			tabHeader: '[role="tablist"]',
			tabPanels: ['[role="tabpanel"]'],
			tabNavs: ['[role="tab"]'],
			tabNavGroup: '.f-tabs__header'
		}
		this.btnClass = {
			primary: 'f:gs-primary-button',
			outline: 'f:gs-outline-button',
		}
		this.domNodes = window.Foxify.Utils.queryDomNodes(this.selectors, this)

		this.selectedIndex = 0
		this.selectedTab = this.domNodes.tabPanels[this.selectedIndex]

		this.init()
		this.setActiveTab(0)

		this.tabChange = new CustomEvent('tabChange', {
			bubbles: true,
			detail: {selectedTab: this.selectedTab}
		})
	}

	connectedCallback() {
		this.setActiveTab(0)
	}

	init = () => {
		this.domNodes.tabNavs.forEach(tab => {
			tab.addEventListener('click', e => {
				e.preventDefault()
				const index = Number(e.target?.dataset?.index)
				this.setActiveTab(index)
			})
		})

		this.domNodes.tabHeader?.addEventListener('keydown', this.handleKeyDown.bind(this))
		this.setAccessible()
	}

	setActiveTab = (tabIndex) => {
		const {tabNavs, tabPanels} = this.domNodes
		if (tabIndex !== -1) {
			const newHeader = tabNavs?.[tabIndex]
			const newTab = tabPanels?.[tabIndex]
			this.setAttribute('data-selected', tabIndex)

			tabNavs.forEach( (nav) => {
				nav.setAttribute('aria-selected', false)
				if ( this.dataset.style === 'inline-style-2' ) {
					nav.classList.remove(this.btnClass.primary)
					nav.classList.add(this.btnClass.outline)
				}
			})
			this.selectedTab?.setAttribute('hidden', '')

			newHeader?.setAttribute('aria-selected', true)
			if ( this.dataset.style === 'inline-style-2' ) {
				newHeader.classList.add(this.btnClass.primary)
				newHeader.classList.remove(this.btnClass.outline)
			}
			newTab?.removeAttribute('hidden')

			this.selectedIndex = tabIndex
			this.selectedTab = newTab

			this.dispatchEvent(new CustomEvent('tabChange', {
				bubbles: true,
				detail: {selectedIndex: tabIndex, selectedTab: newTab}
			}))

		}
	}

	setAccessible() {
		const {tabNavs, tabPanels} = this.domNodes
		tabNavs.forEach((tab, index) => {
			if (tab.id) tabPanels[index].setAttribute('aria-labelledby', tab.id)
			tab.setAttribute('aria-selected', index === 0)
			tab.setAttribute('data-index', index)
			if (index !== 0) {
				tab.setAttribute('tabindex', -1)
			}
		})
		tabPanels.forEach((panel, index) => {
			if (panel.id) tabNavs[index].setAttribute('aria-controls', panel.id)
			panel.setAttribute('tabindex', 0)
		})
	}

	handleKeyDown(e) {
		const {tabNavs} = this.domNodes
		if (e.keyCode === 39 || e.keyCode === 37) {
			tabNavs[this.selectedIndex].setAttribute('tabindex', -1)
			if (e.keyCode === 39) {
				this.selectedIndex++
				// If we're at the end, go to the start
				if (this.selectedIndex >= tabNavs.length) {
					this.selectedIndex = 0
				}
				// Move left
			} else if (e.keyCode === 37) {
				this.selectedIndex--
				// If we're at the start, move to the end
				if (this.selectedIndex < 0) {
					this.selectedIndex = tabNavs.length - 1
				}
			}

			tabNavs[this.selectedIndex].setAttribute('tabindex', 0)
			tabNavs[this.selectedIndex].focus()
		}
	}

	getSelected() {
		return {
			index: this.selectedIndex,
			element: this.selectedTab
		}
	}
}

if (!customElements.get('tabs-component')) {
	customElements.define('tabs-component', XTabs)
}

if (!customElements.get('f-tabs-component')) {
	customElements.define('f-tabs-component', class XTabsComponent extends XTabs {
	  constructor() {
		super();
	  }
	}) 
  }

if (!customElements.get('tab-selector')) {
	class TabSelector extends HTMLElement {
		constructor() {
			super()

			this.tabs = this.closest('tabs-component')

			this.querySelector('select').addEventListener('change', (e) => {
				this.tabs.setActiveTab(e.target.value)
			})
		}

	}
	customElements.define('tab-selector', TabSelector)
}
