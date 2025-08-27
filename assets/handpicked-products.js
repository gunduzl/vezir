if (!customElements.get("m-handpicked-products")) {
  class MHandpickedProducts extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.selectors = {
        products: [".m-product-card"],
        slideContainer: "[data-products-container]",
        sliderControls: ".m-slider-controls",
      };
      this.domNodes = queryDomNodes(this.selectors, this);

      this.enableSlider = this.dataset.enableSlider === "true";
      this.showPagination = this.dataset.showPagination === "true";
      this.showNavigation = this.dataset.showNavigation === "true";
      this.paginationType = this.dataset.paginationType || "bullets";
      this.useScrollMobile = this.dataset.useScrollMobile === "true";
      this.items = this.dataset.items;

      if (!this.enableSlider) return;

      if (this.useScrollMobile) {
        if (!MinimogTheme.config.mqlMobile) {
          this.domNodes.slideContainer.classList.add("swiper-container");
          this.domNodes.sliderControls.classList.remove("m:hidden");
          this.initSlider();
        } else {
          this.slider && this.slider.destroy(true, true);
          this.domNodes.slideContainer.classList.remove("swiper-container");
          this.domNodes.sliderControls.classList.add("m:hidden");
        }

        document.addEventListener("matchMobile", () => {
          this.slider && this.slider.destroy(true, true);
          this.domNodes.slideContainer.classList.remove("swiper-container");
          this.domNodes.sliderControls.classList.add("m:hidden");
        });

        document.addEventListener("unmatchMobile", () => {
          this.domNodes.slideContainer.classList.add("swiper-container");
          this.domNodes.sliderControls.classList.remove("m:hidden");
          this.initSlider();
        });
      } else {
        this.initSlider();
      }
    }

    initSlider() {
      const controlsContainer = this.querySelector(".m-slider-controls");
      const prevButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-prev");
      const nextButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-next");
      const slideItemsLength = this.domNodes.slideContainer.querySelector(".swiper-wrapper").childElementCount;

      this.slider = new MinimogLibs.Swiper(this.domNodes.slideContainer, {
        slidesPerView: 2,
        showPagination: this.showPagination,
        showNavigation: this.showNavigation,
        loop: false,
        pagination: this.showPagination
          ? {
              el: this.querySelector(".swiper-pagination"),
              clickable: true,
              type: this.paginationType,
            }
          : false,
        navigation: {
          nextEl: nextButton && nextButton,
          prevEl: prevButton && prevButton,
        },
        breakpoints: {
          480: {
            slidesPerView: parseInt(this.items) >= 3 ? 3 : parseInt(this.items),
          },
          768: {
            slidesPerView: parseInt(this.items) >= 4 ? 4 : parseInt(this.items),
          },
          1280: {
            slidesPerView: parseInt(this.items),
          },
        },
        threshold: 2,
        on: {
          breakpoint: (swiper, breakpointParams) => {
            if (controlsContainer) {
              const { slidesPerView } = breakpointParams;
              if (slideItemsLength > slidesPerView) {
                controlsContainer.classList.remove("m:hidden");
                swiper.allowTouchMove = true;
              } else {
                controlsContainer.classList.add("m:hidden");
                swiper.allowTouchMove = false;
              }
            }
          },
        },
      });
    }
  }

  customElements.define("m-handpicked-products", MHandpickedProducts);
}
