if (!customElements.get('x-related-products')) {
  class XRelatedProducts extends HTMLElement {
    constructor() {
      super();
      this.container = this.closest('.x-related-products')
    }

    connectedCallback() {
      fetch(this.dataset.url)
      .then((response) => response.text())
      .then((text) => {
        const html = window.Foxify.Utils.generateDomFromString(text);
        const recommendations = html.querySelector(`x-related-products#${this.id}`);

        if (recommendations && recommendations.innerHTML.trim().length) {
          this.innerHTML = recommendations.innerHTML;
        }

        if (html.querySelector(".x-product-card")) {
          this.classList.add("x-related-products--loaded");
        } else {
          this.classList.add("!x-hidden");
        }
      })
      .catch((e) => {
        console.error(e);
      });
    }
  }
  customElements.define("x-related-products", XRelatedProducts);
}