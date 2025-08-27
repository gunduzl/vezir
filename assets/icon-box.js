if (!customElements.get("m-icon-box")) {
  class MIconbox extends HTMLElement {
    constructor() {
      super();

      this.enableSlider = this.dataset.enableSlider === "true";
      this.items = this.dataset.items;
      this.showPagination = this.dataset.showPagination === "true";
      this.showNavigation = this.dataset.showNavigation === "true";
      this.slideContainer = this.querySelector(".swiper-container");
    }

    connectedCallback() {
      this.lastActive = null;
      if (this.enableSlider) this.initSlider();
    }

    initSlider() {
      const controlsContainer = this.querySelector(".m-slider-controls");
      const prevButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-prev");
      const nextButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-next");
      const slideItemsLength = this.querySelector(".swiper-wrapper").childElementCount;
      let __this = this;

      this.slider = new MinimogLibs.Swiper(this.slideContainer, {
        slidesPerView: 1,
        navigation: this.showNavigation,
        loop: true,
        pagination: this.showPagination
          ? {
              el: this.querySelector(".swiper-pagination"),
              clickable: true,
            }
          : false,
        breakpoints: {
          480: {
            slidesPerView: 2,
          },
          768: {
            slidesPerView: parseInt(this.items) - 1,
          },
          1280: {
            slidesPerView: parseInt(this.items),
          },
        },
        on: {
          init: function () {
            this.slideToLoop(this.lastActive);
            setTimeout(() => {
              // Calculate controls position
              const firstItem = __this.querySelector(".m-image") || __this.querySelector(".m-placeholder-svg");
              if (firstItem && controlsContainer) {
                const itemHeight = firstItem.clientHeight;
                controlsContainer.style.setProperty("--offset-top", parseInt(itemHeight) / 2 + "px");

                prevButton.classList.remove("m:hidden");
                nextButton.classList.remove("m:hidden");
              }
            }, 200);
          },
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

      if (this.slider && this.showNavigation) {
        prevButton && prevButton.addEventListener("click", () => this.slider.slidePrev());
        nextButton && nextButton.addEventListener("click", () => this.slider.slideNext());
      }
      document.addEventListener("shopify:block:select", (e) => this.onBlockSelect(e));
    }

    onBlockSelect(e) {
      const block = e.target;
      const index = Number(block.dataset.slide);
      this.lastActive = index;
      if (this.slider) {
        this.slider.slideToLoop(index);
      }
    }
  }

  customElements.define("m-icon-box", MIconbox);
}
