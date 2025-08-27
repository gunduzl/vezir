if (!customElements.get("f-collection-tabs")) {
  class CollectionTabs extends HTMLElement {
    constructor() {
      super();
      this.selectors = {
        images: [".f\\:collection-tabs__image"],
        tabs: ["f-collapsible-tab"],
        content: ".f\\:collection-tabs__content",
        links: [".f\\:collection-tabs__link"],
      };
    }

    init() {
      this.domNodes = window.Foxify.Utils.queryDomNodes(this.selectors, this);
      this.isPausing = true;
      this.autoplay = this.dataset.autoplay === "true";
      this.autoplayDuration = this.dataset.autoplayDuration
        ? parseInt(this.dataset.autoplayDuration)
        : 5;
      this.autoplayTimer = null;
      this.activeIndex = 0;
      this.triggerOpen = this.dataset.trigger;
      this.canHover = window.matchMedia("(hover: hover)").matches;

      if (this.autoplay) {
        this.observer = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.initAutoplay();
            } else {
              this.resetAutoplay();
            }
          });
        });
        this.observer.observe(this);

        if (this.canHover) {
          this.domNodes.content.addEventListener(
            "mouseover",
            this.resetAutoplay.bind(this)
          );
          this.domNodes.content.addEventListener(
            "mouseleave",
            this.initAutoplay.bind(this)
          );
        }
      }
    }

    connectedCallback() {
      this.init();

      this.domNodes.tabs.forEach((tab) => {
        tab.on("tabOpened", this.onSelected.bind(this));
      });

      if (this.triggerOpen === "hover" && this.canHover) {
        this.domNodes.tabs.forEach((tab) => {
          tab.addEventListener("mouseenter", this.handleChange.bind(this));
        });
      }

      this.domNodes.links.forEach((link) => {
        link.addEventListener("click", (e) => e.stopPropagation());
      });
    }

    handleChange(event) {
      !event.target.selected && event.target.toggle(event);
    }

    onSelected(tab) {
      this.activeIndex = Number(tab.dataset.index);
      this.domNodes.images.forEach((image, index) =>
        image.classList.remove("is-active")
      );
      this.domNodes.images[this.activeIndex].classList.add("is-active");
    }

    initAutoplay() {
      this.autoplayTimer = setInterval(
        this.openNextTab.bind(this),
        this.autoplayDuration * 1000
      );
      this.isPausing = false;
      this.classList.remove("is-paused");
    }

    resetAutoplay() {
      clearInterval(this.autoplayTimer);
      this.isPausing = true;
      this.classList.add("is-paused");
    }

    openNextTab() {
      this.activeIndex = (this.activeIndex + 1) % this.domNodes.tabs.length;
      this.domNodes.tabs[this.activeIndex] &&
      this.domNodes.tabs[this.activeIndex].toggle();
    }

    disconnectedCallback() {
      this.observer && this.observer.disconnect();
      if (this.hoverToOpen) {
        this.domNodes.tabs.forEach((tab) => {
          tab.removeEventListener("mouseenter", this.handleChange.bind(this));
        });
      }
    }
  }
  customElements.define("f-collection-tabs", CollectionTabs);
}
