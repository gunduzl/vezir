if (!customElements.get("favorite-product-slider")) {
  class FavoriteProductSlider extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.selectors = {
        mainImages: ".m-favorite-product-slider__images",
        thumbs: ".m-favorite-product-slider__thumbs",
      };
      this.domNodes = queryDomNodes(this.selectors, this);
      this.mediaSize = parseInt(this.dataset.mediaSize);

      this.mainImagesContainer = this.domNodes.mainImages.querySelector(".swiper-container");
      this.thumbsContainer = this.domNodes.thumbs.querySelector(".swiper-container");

      this.initSlider();
    }

    initSlider() {
      this.initMainImagesSlider();
      this.initThumbsSlider();

      this.thumbsSlider.on("slideChange", (swiper) => {
        const { realIndex } = swiper;
        let index = realIndex - 1;
        if (index < 0) {
          index = this.mediaSize - 1;
        }
        this.mainImagesSlider.slideToLoop(index);
      });

      this.mainImagesSlider.on("slideChange", (swiper) => {
        const { slides, realIndex } = swiper;
        let index = realIndex + 1;
        if (index > this.mediaSize) {
          index = 0;
        }
        this.playActiveMedia(slides[index]);
      });
    }

    initMainImagesSlider() {
      const controlsContainer = this.domNodes.mainImages.querySelector(".m-slider-controls");
      const prevButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-prev");
      const nextButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-next");

      this.mainImagesSlider = new MinimogLibs.Swiper(this.mainImagesContainer, {
        slidesPerView: 1,
        showPagination: true,
        showNavigation: true,
        loop: true,
        pagination: {
          el: this.domNodes.mainImages.querySelector(".swiper-pagination"),
          clickable: true,
          type: "fraction",
        },
        autoplay: false,
        threshold: 2,
        effect: "fade",
        fadeEffect: {
          crossFade: true,
        },
        breakpoints: {
          768: {
            simulateTouch: false,
            allowTouchMove: false,
            showPagination: false,
            showNavigation: false,
          },
        },
        simulateTouch: true,
        allowTouchMove: true,
      });

      if (this.mainImagesSlider) {
        prevButton && prevButton.addEventListener("click", () => this.mainImagesSlider.slidePrev());
        nextButton && nextButton.addEventListener("click", () => this.mainImagesSlider.slideNext());
      }
    }

    initThumbsSlider() {
      const thumbsControlsContainer = this.domNodes.thumbs.querySelector(".m-slider-controls");
      const thumbsPrevButton =
        thumbsControlsContainer && thumbsControlsContainer.querySelector(".m-slider-controls__button-prev");
      const thumbsNextButton =
        thumbsControlsContainer && thumbsControlsContainer.querySelector(".m-slider-controls__button-next");
      const slideItemsLength = this.domNodes.thumbs.querySelector(".swiper-wrapper").childElementCount;

      this.thumbsSlider = new MinimogLibs.Swiper(this.thumbsContainer, {
        initialSlide: slideItemsLength > 1 ? 1 : 0,
        slidesPerView: slideItemsLength == 2 ? 1 : 2,
        showPagination: true,
        showNavigation: true,
        loop: true,
        autoplay: false,
        pagination: {
          el: this.domNodes.thumbs.querySelector(".swiper-pagination"),
          clickable: true,
          type: "fraction",
        },
        spaceBetween: 15,
        breakpoints: {
          1024: {
            spaceBetween: 30,
          },
        },
        threshold: 2,
        on: {
          init() {
            setTimeout(() => {
              window.dispatchEvent(new Event("resize"));
            }, 100);
          },
        },
      });

      if (this.thumbsSlider) {
        thumbsPrevButton && thumbsPrevButton.addEventListener("click", () => this.thumbsSlider.slidePrev());
        thumbsNextButton && thumbsNextButton.addEventListener("click", () => this.thumbsSlider.slideNext());
      }
    }

    playActiveMedia(selected) {
      const deferredMedia = selected.querySelector(".deferred-media");
      if (deferredMedia) {
        const autoplay = deferredMedia.dataset.autoPlay === "true";
        if (autoplay) {
          deferredMedia.loadContent(false);
        }
      }
    }
  }
  customElements.define("favorite-product-slider", FavoriteProductSlider);
}
