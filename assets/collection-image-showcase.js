if (!customElements.get("collection-image-showcase")) {
  class CollectionImageShowcase extends HTMLElement {
    constructor() {
      super();
      this.selectors = {
        media: ".m-collection-image-showcase__media",
        tabs: ".m-collection-image-showcase__collections",
      };

      this.domNodes = queryDomNodes(this.selectors, this);
      this.tabItems = this.domNodes.tabs.querySelectorAll("li a");
      this.media = this.domNodes.media;

      this.templates = this.querySelector("template").content.cloneNode(true);

      this.currentIndex = 0;
      this.currentMedia = null;

      this.sectionId = this.dataset.sectionId;

      this.init();
    }

    init() {
      this.setActiveTab(0);

      this.tabItems.forEach((item) => {
        item.addEventListener("mouseover", (e) => this.handleMouseOver(e));
        item.addEventListener("touchstart", (e) => this.handleTouchChange(e));
      });

      if (Shopify.designMode) {
        document.addEventListener("shopify:block:select", (e) => {
          if (e.detail.sectionId != this.sectionId) return;
          let { target } = e;
          const index = Number(target.dataset.index);
          this.setActiveTab(index);
        });
      }
    }

    setActiveTab(tabIndex) {
      let newMedia, currentItem, newItem;

      currentItem = this.tabItems && this.tabItems[this.currentIndex].parentNode;
      newItem = this.tabItems && this.tabItems[tabIndex].parentNode;
      this.tabItems && this.tabItems[this.currentIndex].classList.add("active");

      this.selectedContent = this.templates.querySelector(`[data-index="${tabIndex}"]`);
      this.selectedContent && this.media.appendChild(this.selectedContent);

      newMedia = this.selectedContent ? this.selectedContent : this.media.querySelector(`[data-index="${tabIndex}"]`);

      currentItem && currentItem.classList.remove("active");
      this.currentMedia && this.currentMedia.classList.remove("active");
      this.tabItems && this.tabItems[this.currentIndex].classList.remove("active");

      newItem && newItem.classList.add("active");
      newMedia && newMedia.classList.add("active");
      this.tabItems && this.tabItems[tabIndex].classList.add("active");

      this.currentIndex = tabIndex;
      this.currentMedia = newMedia;
    }

    handleMouseOver(e) {
      e.preventDefault;
      let { target } = e;
      const index = Number(target.dataset.index);
      if (target.classList.contains("active")) return;

      this.setActiveTab(index);
    }

    handleTouchChange(e) {
      let { target } = e;
      if (!target.classList.contains("active")) {
        e.preventDefault();
        const index = Number(target.dataset.index);
        if (target.classList.contains("active")) return;
        this.setActiveTab(index);
      }
    }
  }
  customElements.define("collection-image-showcase", CollectionImageShowcase);
}
