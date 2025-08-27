if (!customElements.get("m-lookbook-slider")) {
  class MLookbookSlider extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.selectors = {
        lookbookSlider: ".m-lookbook-slider__inner",
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
        icon.addEventListener("mouseleave", this.onMouseLeave.bind(this));
      });
    }

    disconnectedCallback() {
      Array.from(this.domNodes.lookbookIcons).forEach((icon) => {
        icon.removeEventListener("mouseover", this.onMouseOver.bind(this));
        icon.removeEventListener("mouseleave", this.onMouseLeave.bind(this));
      });
    }

    calcControlsPosition(container, next, prev) {
      // Calculate controls position
      const firstItem =
        this.domNodes.lookbookSlider.querySelector(".m-image") ||
        this.querySelector(".m-product-card .m-placeholder-svg");
      if (firstItem && container) {
        const itemHeight = firstItem.clientHeight;
        container.style.setProperty("--offset-top", parseInt(itemHeight) / 2 + "px");

        prev && prev.classList.remove("m:hidden");
        next && next.classList.remove("m:hidden");
      }
    }

    initSlider() {
      const controlsContainer = this.domNodes.lookbookSlider.querySelector(".m-slider-controls");
      const prevButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-prev");
      const nextButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-next");
      const slideItemsLength = this.slideContainer.querySelector(".swiper-wrapper").childElementCount;

      let swiperOptions = {
        slidesPerView: slideItemsLength < this.items ? slideItemsLength : parseInt(this.items),
        showPagination: this.showPagination,
        showNavigation: this.showNavigation,
        spaceBetween: 15,
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
          slideChange: (swiper) => {
            const activeIndex = swiper.realIndex;

            Array.from(this.domNodes.lookbookIcons).forEach((icon) => icon.classList.remove("is-active"));
            if (this.domNodes.lookbookIcons[activeIndex])
              this.domNodes.lookbookIcons[activeIndex].classList.add("is-active");
          },
          init: () => {
            setTimeout(() => {
              window.dispatchEvent(new Event("resize"));
              this.calcControlsPosition(controlsContainer, nextButton, prevButton);
            }, 200);
          },
        },
        breakpoints: {
          768: {
            spaceBetween: 30,
          },
        },
      };

      if (slideItemsLength < this.items) {
        swiperOptions.simulateTouch = false;
        swiperOptions.allowTouchMove = false;
      }

      this.slider = new MinimogLibs.Swiper(this.slideContainer, swiperOptions);

      if (this.slider && this.showNavigation) {
        prevButton && prevButton.addEventListener("click", () => this.slider.slidePrev());
        nextButton && nextButton.addEventListener("click", () => this.slider.slideNext());
      }

      window.addEventListener("resize", () => {
        this.calcControlsPosition(controlsContainer, nextButton, prevButton);
      });
    }

    onMouseOver(event) {
      const index = Number(event.target.closest(".m-lookbook-icon").dataset.index);

      if (event.target.dataset.index && this.slider) {
        this.slider.slideToLoop(index);
      }

      const activeItems = this.domNodes.lookbookSlider.querySelectorAll(`[data-swiper-slide-index="${index}"]`);
      Array.from(activeItems).forEach((slide) => slide.querySelector(".m-product-card").classList.add("is-active"));
      event.target.classList.add("is-active");

      this.classList.add("is-hovering");
    }

    onMouseLeave(event) {
      Array.from(this.slider.slides).forEach((slide) =>
        slide.querySelector(".m-product-card").classList.remove("is-active")
      );
      Array.from(this.domNodes.lookbookIcons).forEach((icon) => icon.classList.remove("is-active"));
      this.classList.remove("is-hovering");
    }
  }

  customElements.define("m-lookbook-slider", MLookbookSlider);
}
