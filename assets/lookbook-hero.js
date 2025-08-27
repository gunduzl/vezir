if (!customElements.get("m-lookbook-hero")) {
  class MLookbookHero extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.selectors = {
        lookbookSlider: ".m-lookbook-hero__wrapper",
        lookbookIcons: [".m-lookbook-icon"],
      };
      this.domNodes = queryDomNodes(this.selectors, this);

      this.enableSlider = this.domNodes.lookbookSlider.dataset.enableSlider === "true";
      this.showPagination = this.domNodes.lookbookSlider.dataset.showPagination === "true";
      this.showNavigation = this.domNodes.lookbookSlider.dataset.showNavigation === "true";
      this.paginationType = this.domNodes.lookbookSlider.dataset.paginationType || "bullets";
      this.items = this.domNodes.lookbookSlider.dataset.items;

      this.slideContainer = this.domNodes.lookbookSlider.querySelector(".swiper-container");

      if (this.enableSlider) this.initSlider();

      Array.from(this.domNodes.lookbookIcons).forEach((icon) => {
        icon.addEventListener("mouseover", this.onMouseOver.bind(this));
      });
    }

    disconnectedCallback() {
      Array.from(this.domNodes.lookbookIcons).forEach((icon) => {
        icon.removeEventListener("mouseover", this.onMouseOver.bind(this));
      });
    }

    initSlider() {
      const controlsContainer = this.domNodes.lookbookSlider.querySelector(".m-slider-controls");
      const prevButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-prev");
      const nextButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-next");
      const slideItemsLength = this.slideContainer.querySelector(".swiper-wrapper").childElementCount;

      let swiperOptions = {
        slidesPerView: 1,
        showPagination: this.showPagination,
        showNavigation: this.showNavigation,
        loop: true,
        pagination: this.showPagination
          ? {
              el: this.domNodes.lookbookSlider.querySelector(".swiper-pagination"),
              clickable: true,
              type: this.paginationType,
            }
          : false,
        threshold: 2,
        on: {
          init() {
            setTimeout(() => {
              window.dispatchEvent(new Event("resize"));
            }, 100);
          },
        },
      };

      if (slideItemsLength == 1) {
        swiperOptions.simulateTouch = false;
        swiperOptions.allowTouchMove = false;
      }

      this.slider = new MinimogLibs.Swiper(this.slideContainer, swiperOptions);

      if (this.slider && this.showNavigation) {
        prevButton && prevButton.addEventListener("click", () => this.slider.slidePrev());
        nextButton && nextButton.addEventListener("click", () => this.slider.slideNext());
      }
    }

    onMouseOver(event) {
      const index = Number(event.target.closest(".m-lookbook-icon").dataset.index);

      if (event.target.dataset.index && this.slider) {
        this.slider.slideToLoop(index);
      }
    }
  }

  customElements.define("m-lookbook-hero", MLookbookHero);
}
