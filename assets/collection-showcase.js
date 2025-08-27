if (!customElements.get("collection-showcase")) {
  class CollectionShowcase extends HTMLElement {
    constructor() {
      super();
      this.selectors = {
        mainContent: ".m-collection-showcase__contents",
        tabs: ".m-collection-showcase__tabs",
      };

      this.domNodes = queryDomNodes(this.selectors, this);
      this.mainContent = this.domNodes.mainContent;
      this.tabItems = this.domNodes.tabs.querySelectorAll("li a");
      this.images = this.querySelectorAll(".m-collection-showcase__image");

      this.columns = this.dataset.columns;

      this.templates = this.querySelector("template").content.cloneNode(true);
      this.currentIndex = 0;
      this.currentTab = null;
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
      let newTab, currentItem, newItem, currentImage, newImage;

      currentItem = this.tabItems && this.tabItems[this.currentIndex].parentNode;
      newItem = this.tabItems && this.tabItems[tabIndex].parentNode;
      this.tabItems && this.tabItems[this.currentIndex].classList.add("active");

      currentImage = this.images && this.images[this.currentIndex];
      newImage = this.images && this.images[tabIndex];

      this.selectedContent = this.templates.querySelector(`[data-index="${tabIndex}"]`);
      this.selectedContent && this.mainContent.appendChild(this.selectedContent);

      newTab = this.selectedContent
        ? this.selectedContent
        : this.mainContent.querySelector(`[data-index="${tabIndex}"]`);

      currentItem && currentItem.classList.remove("active");
      currentImage && currentImage.classList.remove("active");
      this.currentTab && this.currentTab.classList.remove("active");
      this.tabItems && this.tabItems[this.currentIndex].classList.remove("active");

      newItem && newItem.classList.add("active");
      newImage && newImage.classList.add("active");
      newTab && newTab.classList.add("active");
      this.tabItems && this.tabItems[tabIndex].classList.add("active");

      const sliderWrapper = newTab && newTab.querySelector(".m-collection-showcase__products");

      this.initSlider(sliderWrapper);

      this.currentIndex = tabIndex;
      this.currentTab = newTab;
    }

    handleMouseOver(e) {
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

    initSlider(container) {
      const enableSlider = container.dataset.enableSlider;
      if (!enableSlider) return;

      const sliderContainer = container.querySelector(".swiper-container");
      const controlsContainer = container.querySelector(".m-slider-controls");
      const prevButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-prev");
      const nextButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-next");
      const options = {
        slidesPerView: parseInt(this.columns),
        loop: true,
        navigation: {
          nextEl: nextButton,
          prevEl: prevButton,
        },
        pagination: false,
        threshold: 2,
        on: {
          init: () => {
            setTimeout(() => {
              // Calculate controls position
              const firstItem = container.querySelector(".m-image") || container.querySelector(".m-placeholder-svg");
              if (firstItem && controlsContainer) {
                const itemHeight = firstItem.clientHeight;
                controlsContainer.style.setProperty("--offset-top", parseInt(itemHeight) / 2 + "px");

                prevButton && prevButton.classList.remove("m:hidden");
                nextButton && nextButton.classList.remove("m:hidden");
              }
            }, 200);
          },
        },
      };

      let slider = new MinimogLibs.Swiper(sliderContainer, options);
    }
  }
  customElements.define("collection-showcase", CollectionShowcase);
}
