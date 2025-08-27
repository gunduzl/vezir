class FacetRemove extends HTMLElement {
  constructor() {
    super();
    const removeFilterNode = this.querySelector('a')
    removeFilterNode.addEventListener('click', (e) => {
      e.preventDefault();
      const filtersForm = this.closest('collection-filters-form') || document.querySelector('collection-filters-form');
      filtersForm.renderPage(new URL(removeFilterNode.href).searchParams.toString());
    });
  }
}

customElements.define('facet-remove', FacetRemove);