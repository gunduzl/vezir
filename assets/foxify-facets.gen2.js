const xSelectors = {productContainer: '#X-ProductGridContainer', productCount: '#X-ProductCount', facetFiltersForm: 'x-facet-filters-form', facetRemove: 'x-facet-remove', priceRange: 'x-price-range', showMoreButton: 'x-show-more-button', facetSubmit: 'x-facet-submit'};

class XFacetFiltersForm extends HTMLElement {
	constructor() {
		super();

    this.sectionId = this.dataset.sectionId;
		this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

		this.debouncedOnSubmit = window.Foxify.Utils.debounce((event) => {
			this.onSubmitHandler(event);
		}, 500);

		const facetForm = this.querySelector('form');
		facetForm.addEventListener('input', this.debouncedOnSubmit.bind(this));

	}

	static setListeners() {
		const onHistoryChange = (event) => {
			const searchParams = event.state ? event.state.searchParams : XFacetFiltersForm.searchParamsInitial;
			if (searchParams === XFacetFiltersForm.searchParamsPrev) return;
			XFacetFiltersForm.renderPage(searchParams, null, false);
		}
		window.addEventListener('popstate', onHistoryChange);
	}

	static toggleActiveFacets(disable = true) {
		document.querySelectorAll('.js-facet-remove').forEach((element) => {
			element.classList.toggle('disabled', disable);
		});
	}

	static renderPage(searchParams, event, updateURLHash = true) {
		XFacetFiltersForm.searchParamsPrev = searchParams;
		const sections = XFacetFiltersForm.getSections();
		const countContainer = document.querySelector(xSelectors.productCount);
		document.querySelector(xSelectors.productContainer).classList.add('loading');
		if (countContainer){
			countContainer.classList.add('loading');
		}
		sections.forEach((section) => {
			const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
			const filterDataUrl = element => element.url === url;

			XFacetFiltersForm.filterData.some(filterDataUrl) ?
				XFacetFiltersForm.renderSectionFromCache(filterDataUrl, event) :
				XFacetFiltersForm.renderSectionFromFetch(url, event);
		});

    console.log(searchParams, 'searchParams')

		if (updateURLHash) XFacetFiltersForm.updateURLHash(searchParams);
	}

	static renderSectionFromFetch(url, event) {
		fetch(url)
			.then(response => response.text())
			.then((responseText) => {
				const html = responseText;
				XFacetFiltersForm.filterData = [...XFacetFiltersForm.filterData, { html, url }];
				XFacetFiltersForm.renderFilters(html, event);
				XFacetFiltersForm.renderProductGridContainer(html);
				XFacetFiltersForm.renderProductCount(html);
			});
	}

	static renderSectionFromCache(filterDataUrl, event) {
		const html = XFacetFiltersForm.filterData.find(filterDataUrl).html;
		XFacetFiltersForm.renderFilters(html, event);
		XFacetFiltersForm.renderProductGridContainer(html);
		XFacetFiltersForm.renderProductCount(html);
	}

	static renderProductGridContainer(html) {
		const ProductGridContainer = document.querySelector(xSelectors.productContainer)
		ProductGridContainer.innerHTML = new DOMParser().parseFromString(html, 'text/html').querySelector(xSelectors.productContainer).innerHTML;
		ProductGridContainer.classList.remove('loading');
	}

	static renderProductCount(html) {
		const count = new DOMParser().parseFromString(html, 'text/html').querySelector(xSelectors.productCount).innerHTML
		const container = document.querySelector(xSelectors.productCount);
		container.innerHTML = count;
		container.classList.remove('loading');
	}

	static renderFilters(html, event) {
		const parsedHTML = new DOMParser().parseFromString(html, 'text/html');

		const facetDetailsElements =
			parsedHTML.querySelectorAll('#X-FacetFiltersForm .js-filter');
		const matchesIndex = (element) => {
			const jsFilter = event ? event.target.closest('.js-filter') : undefined;
			return jsFilter ? element.dataset.index === jsFilter.dataset.index : false;
		}
		const facetsToRender = Array.from(facetDetailsElements).filter(element => !matchesIndex(element));
		const countsToRender = Array.from(facetDetailsElements).find(matchesIndex);

		facetsToRender.forEach((element) => {
			document.querySelector(`.js-filter[data-index="${element.dataset.index}"]`).innerHTML = element.innerHTML;
		});

		XFacetFiltersForm.renderActiveFacets(parsedHTML);

		if (countsToRender) XFacetFiltersForm.renderCounts(countsToRender, event.target.closest('.js-filter'));
	}

	static renderActiveFacets(html) {
		const activeFacetElementSelectors = ['.x-active-facets'];

		activeFacetElementSelectors.forEach((selector) => {
			const activeFacetsElement = html.querySelector(selector);
			if (!activeFacetsElement) return;
			document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
		})

		XFacetFiltersForm.toggleActiveFacets(false);
	}

	static renderCounts(source, target) {
		const targetElement = target.querySelector('.x-facets__selected');
		const sourceElement = source.querySelector('.x-facets__selected');

		const targetElementAccessibility = target.querySelector('.x-facets__summary');
		const sourceElementAccessibility = source.querySelector('.x-facets__summary');

		if (sourceElement && targetElement) {
			target.querySelector('.x-facets__selected').outerHTML = source.querySelector('.x-facets__selected').outerHTML;
		}

		if (targetElementAccessibility && sourceElementAccessibility) {
			target.querySelector('.x-facets__summary').outerHTML = source.querySelector('.x-facets__summary').outerHTML;
		}
	}

	static updateURLHash(searchParams) {
		history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
	}

	static getSections() {
    const sectionId = document.querySelector(xSelectors.facetFiltersForm)?.sectionId;
		return [
			{
				section: sectionId
			}
		]
	}

	createSearchParams(form) {
		const formData = new FormData(form);
		return new URLSearchParams(formData).toString();
	}

	onSubmitForm(searchParams, event) {
		XFacetFiltersForm.renderPage(searchParams, event);
	}

	onSubmitHandler(event) {
		const sortFilterForms = document.querySelectorAll('x-facet-filters-form form');
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
		XFacetFiltersForm.toggleActiveFacets();
		const url = event.currentTarget.href.indexOf('?') === -1 ? '' : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);
		XFacetFiltersForm.renderPage(url);
	}
}

XFacetFiltersForm.filterData = [];
XFacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
XFacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('x-facet-filters-form', XFacetFiltersForm);
XFacetFiltersForm.setListeners();

class XPriceRange extends HTMLElement {
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

customElements.define('x-price-range', XPriceRange);

class FacetRemove extends HTMLElement {
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
		const form = this.closest('x-facet-filters-form') || document.querySelector('x-facet-filters-form');
		form.onActiveFilterClick(event);
	}
}

customElements.define('x-facet-remove', FacetRemove);

class FacetSubmit extends HTMLElement {
	constructor() {
		super()
		const drawer = this.closest('x-drawer-component')
		if (!drawer) return;
		this.querySelector('button').addEventListener('click', e => {
			e.preventDefault()
			drawer.closeDrawer(false)
		})
	}
}

customElements.define('x-facet-submit', FacetSubmit)

class ShowMoreButton extends HTMLElement {
	constructor() {
		super();
		const button = this.querySelector('button');
		button.addEventListener('click', (event) => {
			this.expandShowMore(event);
			const nextElementToFocus = event.target.closest('.x-facets__blocks').querySelector('.x-show-more-item')
			if (nextElementToFocus && !nextElementToFocus.classList.contains('f:hidden')) {
				nextElementToFocus.querySelector('input').focus()
			}
		});
	}
	expandShowMore(event) {
		const parentDisplay = event.target.closest('[id^="Show-More-"]').closest('.x-facets__block');
		this.querySelectorAll('.label-text').forEach(element => element.classList.toggle('f:hidden'));
		parentDisplay.querySelectorAll('.x-show-more-item').forEach(item => item.classList.toggle('f:hidden'))
	}
}

customElements.define('x-show-more-button', ShowMoreButton);
