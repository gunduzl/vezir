if (!customElements.get("tabs-component")) {
  class Tabs extends HTMLElement {
    constructor() {
      super();
      this.selectors = {
        tabWrapper: ".m-collage-tabs__wrapper",
      };
      this.domNodes = queryDomNodes(this.selectors, this);
      this.init();
    }

    connectedCallback() {
      this.tabs.setActiveTab(0);
    }

    init = () => {
      this.tabs = new MinimogTheme.Tabs(this.domNodes.tabWrapper);
      if (Shopify.designMode) {
        document.addEventListener("shopify:block:select", (event) => {
          const blockSelectedIsTab = event.target.classList.contains("m-tab-content");
          if (!blockSelectedIsTab) return;
          const dataIndex = event.target && event.target.dataset.index;
          this.tabs.setActiveTab(dataIndex);
        });
      }
    };
  }

  customElements.define("tabs-component", Tabs);
}
