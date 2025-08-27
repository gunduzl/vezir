if (!customElements.get('x-facet-filters-form') && !customElements.get('f-facet-filters-form')) {
	class FoxifyFacetFiltersForm extends HTMLElement {
		static {
			this.selectors = {
				productContainer: '#ProductGridContainer',
				productCount: '#ProductCount',
				sortFilterForm: 'f-facet-filters-form form',
				productGrid: '#product-grid',
				jsFacetRemove: '.js-facet-remove',
				facetDetailsElements: '#FoxifyFacetFiltersForm .js-filter',
				activeFacetElement: '.f\\:active-facets',
				facetFiltersFormMobile: 'FoxifyFacetFiltersFormMobile',
				facetSelected: '.f\\:facets__selected',
				facetSummary: '.f\\:facets__summary',
				mobileElementSelectors: ['.mobile-f\\:facets__open', '.mobile-f\\:facets__count', '.sorting']
			};
			this.filterData = [];
			this.searchParamsInitial = window.location.search.slice(1);
			this.searchParamsPrev = window.location.search.slice(1);
		}

		constructor() {
			super();
			this.onActiveFilterClick = this.onActiveFilterClick.bind(this);
			this.debouncedOnSubmit = window.Foxify.Utils.debounce((event) => {
				this.onSubmitHandler(event);
			}, 500);
			const facetForm = this.querySelector('form');
			facetForm.addEventListener('input', this.debouncedOnSubmit.bind(this));
		}

		static setListeners() {
			const onHistoryChange = (event) => {
				const searchParams = event.state ? event.state.searchParams : this.searchParamsInitial;
				if (searchParams === this.searchParamsPrev) return;
				this.renderPage(searchParams, null, false);
			}
			window.addEventListener('popstate', onHistoryChange);
		}

		static toggleActiveFacets(disable = true) {
			document.querySelectorAll(this.selectors.jsFacetRemove).forEach((element) => {
				element.classList.toggle('disabled', disable);
			});
		}

		static renderPage(searchParams, event, updateURLHash = true) {
			this.searchParamsPrev = searchParams;
			const sections = this.getSections();
			const countContainer = document.querySelector(this.selectors.productCount);
			document.querySelector(this.selectors.productContainer).classList.add('loading');
			if (countContainer){
				countContainer.classList.add('loading');
			}
			sections.forEach((section) => {
				const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
				const filterDataUrl = element => element.url === url;

				this.filterData.some(filterDataUrl) ?
					this.renderSectionFromCache(filterDataUrl, event) :
					this.renderSectionFromFetch(url, event);
			});

			if (updateURLHash) this.updateURLHash(searchParams);
		}

		static renderSectionFromFetch(url, event) {
			fetch(url)
				.then(response => response.text())
				.then((responseText) => {
					const html = responseText;
					this.filterData = [...this.filterData, { html, url }];
					this.renderFilters(html, event);
					this.renderProductGridContainer(html);
					this.renderProductCount(html);
				});
		}

		static renderSectionFromCache(filterDataUrl, event) {
			const html = this.filterData.find(filterDataUrl).html;
			this.renderFilters(html, event);
			this.renderProductGridContainer(html);
			this.renderProductCount(html);
		}

		static renderProductGridContainer(html) {
			const ProductGridContainer = document.querySelector(this.selectors.productContainer)
			ProductGridContainer.innerHTML = new DOMParser().parseFromString(html, 'text/html').querySelector(this.selectors.productContainer).innerHTML;
			ProductGridContainer.classList.remove('loading');
		}

		static renderProductCount(html) {
			const container = document.querySelector(this.selectors.productCount);
			if (container){
				const count = new DOMParser().parseFromString(html, 'text/html').querySelector(this.selectors.productCount).innerHTML
				container.innerHTML = count;
				container.classList.remove('loading');
			}
		}

		static renderFilters(html, event) {
			const parsedHTML = new DOMParser().parseFromString(html, 'text/html');

			const facetDetailsElements =
				parsedHTML.querySelectorAll(this.selectors.facetDetailsElements);
			const matchesIndex = (element) => {
				const jsFilter = event ? event.target.closest('.js-filter') : undefined;
				return jsFilter ? element.dataset.index === jsFilter.dataset.index : false;
			}
			const facetsToRender = Array.from(facetDetailsElements).filter(element => !matchesIndex(element));
			const countsToRender = Array.from(facetDetailsElements).find(matchesIndex);

			facetsToRender.forEach((element) => {
				document.querySelector(`.js-filter[data-index="${element.dataset.index}"]`).innerHTML = element.innerHTML;
			});

			this.renderActiveFacets(parsedHTML);

			if (countsToRender) this.renderCounts(countsToRender, event.target.closest('.js-filter'));
		}

		static renderActiveFacets(html) {
			const activeFacetElementSelectors = [this.selectors.activeFacetElement];

			activeFacetElementSelectors.forEach((selector) => {
				const activeFacetsElement = html.querySelector(selector);
				if (!activeFacetsElement) return;
				document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
			})

			this.toggleActiveFacets(false);
		}

		static renderAdditionalElements(html) {
			this.selectors.mobileElementSelectors.forEach((selector) => {
				if (!html.querySelector(selector)) return;
				document.querySelector(selector).innerHTML = html.querySelector(selector).innerHTML;
			});

			document.getElementById(this.selectors.facetFiltersFormMobile).closest('menu-drawer').bindEvents();
		}

		static renderCounts(source, target) {
			const targetElement = target.querySelector(this.selectors.facetSelected);
			const sourceElement = source.querySelector(this.selectors.facetSelected);

			const targetElementAccessibility = target.querySelector(this.selectors.facetSummary);
			const sourceElementAccessibility = source.querySelector(this.selectors.facetSummary);

			if (sourceElement && targetElement) {
				target.querySelector(this.selectors.facetSelected).outerHTML = source.querySelector(this.selectors.facetSelected).outerHTML;
			}

			if (targetElementAccessibility && sourceElementAccessibility) {
				target.querySelector(this.selectors.facetSummary).outerHTML = source.querySelector(this.selectors.facetSummary).outerHTML;
			}
		}

		static updateURLHash(searchParams) {
			history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
		}

		static getSections() {
			return [
				{
					section: document.querySelector(this.selectors.productGrid).dataset.id,
				}
			]
		}

		createSearchParams(form) {
			const formData = new FormData(form);
			return new URLSearchParams(formData).toString();
		}

		onSubmitForm(searchParams, event) {
			this.constructor.renderPage(searchParams, event);
		}

		onSubmitHandler(event) {
			const sortFilterForms = document.querySelectorAll(this.constructor.selectors.sortFilterForm);
			if (event.srcElement.className === 'mobile-facets__checkbox') {
				const searchParams = this.createSearchParams(event.target.closest('form'))
				this.onSubmitForm(searchParams, event)
			} else {
				const forms = [];
				sortFilterForms.forEach((form) => {
					forms.push(this.createSearchParams(form));
				});
				this.onSubmitForm(forms.join('&'), event)
			}
		}

		onActiveFilterClick(event) {
			event.preventDefault();
			this.constructor.toggleActiveFacets();
			const url = event.currentTarget.href.indexOf('?') === -1 ? '' : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);
			this.constructor.renderPage(url);
		}
	}
	customElements.define('f-facet-filters-form', FoxifyFacetFiltersForm);
	FoxifyFacetFiltersForm.setListeners();

	// Extend Gen2 
	class XFacetFiltersForm extends FoxifyFacetFiltersForm {
		static {
			this.selectors = {
				productContainer: '#X-ProductGridContainer',
				productCount: '#X-ProductCount',
				sortFilterForm: 'x-facet-filters-form form',
				jsFacetRemove: '.js-facet-remove',
				facetDetailsElements: '#FoxifyFacetFiltersForm .js-filter',
				activeFacetElement: '.x-active-facets',
				facetSelected: '.x-facets__selected',
				facetSummary: '.x-facets__summary',
				mobileElementSelectors: ['.mobile-f\\:facets__open', '.mobile-f\\:facets__count', '.sorting']
			};
			this.filterData = [];
			this.searchParamsInitial = window.location.search.slice(1);
			this.searchParamsPrev = window.location.search.slice(1);
		}

		static getSections() {
			return [
				{
					section: document.querySelector(this.selectors.productContainer).dataset.id,
				}
			]
		}
	}
	customElements.define('x-facet-filters-form', XFacetFiltersForm);
	XFacetFiltersForm.setListeners();
}


if (!customElements.get('f-price-range') && !customElements.get('x-price-range')) {
	class PriceRange extends HTMLElement {
		constructor() {
			super();
			this.querySelectorAll('input')
				.forEach(element => element.addEventListener('change', this.onRangeChange.bind(this)));
			this.setMinAndMaxValues();
		}

		onRangeChange(event) {
			this.adjustToValidValues(event.currentTarget);
			this.setMinAndMaxValues();
		}

		setMinAndMaxValues() {
			const inputs = this.querySelectorAll('input');
			const minInput = inputs[0];
			const maxInput = inputs[1];
			if (maxInput.value) minInput.setAttribute('max', maxInput.value);
			if (minInput.value) maxInput.setAttribute('min', minInput.value);
			if (minInput.value === '') maxInput.setAttribute('min', 0);
			if (maxInput.value === '') minInput.setAttribute('max', maxInput.getAttribute('max'));
		}

		adjustToValidValues(input) {
			const value = Number(input.value);
			const min = Number(input.getAttribute('min'));
			const max = Number(input.getAttribute('max'));

			if (value < min) input.value = min;
			if (value > max) input.value = max;
		}
	}
	customElements.define('f-price-range', PriceRange);

	// Extend Gen2 
	class XPriceRange extends PriceRange {
		constructor() {
			super();
		}
	}
	customElements.define('x-price-range', XPriceRange);
}


if (!customElements.get('f-facet-remove') && !customElements.get('x-facet-remove')) {
	class FacetRemove extends HTMLElement {
		static {
			this.selectors = {
				filterForm: 'f-facet-filters-form', 
			};
		}
		constructor() {
			super();
			const facetLink = this.querySelector('a');
			facetLink.setAttribute('role', 'button');
			facetLink.addEventListener('click', this.closeFilter.bind(this));
			facetLink.addEventListener('keyup', (event) => {
				event.preventDefault();
				if (event.code.toUpperCase() === 'SPACE') this.closeFilter(event);
			});
		}

		closeFilter(event) {
			event.preventDefault();
			const form = this.closest(this.constructor.selectors.filterForm) || document.querySelector(this.constructor.selectors.filterForm);
			form.onActiveFilterClick(event);
		}
	}
	customElements.define('f-facet-remove', FacetRemove);

	// Extend Gen2 
	class XFacetRemove extends FacetRemove {
		static {
			this.selectors = {
				filterForm: 'x-facet-filters-form', 
			};
		}
	}
	customElements.define('x-facet-remove', XFacetRemove);
}


if (!customElements.get('f-facet-submit') && !customElements.get('x-facet-submit')) {
	class FacetSubmit extends HTMLElement {
		static {
			this.selectors = {
				drawer: 'f-drawer-component', 
			};
		}
		constructor() {
			super()
			const drawer = this.closest(this.constructor.selectors.drawer)
			if (!drawer) return;
			this.querySelector('button').addEventListener('click', e => {
				e.preventDefault()
				drawer.closeDrawer(false)
			})
		}
	}
	customElements.define('f-facet-submit', FacetSubmit)

	// Extend Gen2 
	class XFacetSubmit extends FacetSubmit {
		static {
			this.selectors = {
				drawer: 'x-drawer-component', 
			};
		}
	}
	customElements.define('x-facet-submit', XFacetSubmit)
}


if (!customElements.get('f-show-more-button') && !customElements.get('x-show-more-button')) {
	class ShowMoreButton extends HTMLElement {
		static {
			this.selectors = {
				facetsBlock: '.f\\:facets__block',
				showmoreItem: '.f\\:show-more-item',
				hidden: 'f:hidden',
				label: '.label-text',
			};
		}
		constructor() {
			super();
			const button = this.querySelector('button');
			button.addEventListener('click', (event) => {
				this.expandShowMore(event);
				const nextElementToFocus = event.target.closest(this.constructor.selectors.facetsBlock).querySelector(this.constructor.selectors.showmoreItem)
				if (nextElementToFocus && !nextElementToFocus.classList.contains(this.constructor.selectors.hidden)) {
					nextElementToFocus.querySelector('input').focus()
				}
			});
		}
		expandShowMore(event) {
			const parentDisplay = event.target.closest('[id^="Show-More-"]').closest(this.constructor.selectors.facetsBlock);
			this.querySelectorAll(this.constructor.selectors.label).forEach(element => element.classList.toggle(this.constructor.selectors.hidden));
			parentDisplay.querySelectorAll(this.constructor.selectors.showmoreItem).forEach(item => item.classList.toggle(this.constructor.selectors.hidden))
		}
	}
	customElements.define('f-show-more-button', ShowMoreButton);

	// Extend Gen2 
	class XShowMoreButton extends ShowMoreButton {
		static {
			this.selectors = {
				facetsBlock: '.x-facets__block',
				showmoreItem: '.x-show-more-item',
				hidden: 'x-hidden',
				label: '.label-text',
			};
		}
	}
	customElements.define('x-show-more-button', XShowMoreButton);
}
