if (!customElements.get("m-product-details-tabs")) {
  class MProductDetailsTabs extends HTMLElement {
    constructor() {
      super();
      this.tabs = new MinimogTheme.Tabs(this);

      if (Shopify.designMode) {
        document.addEventListener("shopify:block:select", (event) => {
          const tabHeader = event && event.target;
          const index = (tabHeader && Number(tabHeader.dataset.index)) || 0;
          this.tabs && this.tabs.setActiveTab(index);
        });
      }
    }
  }
  customElements.define("m-product-details-tabs", MProductDetailsTabs);
}
