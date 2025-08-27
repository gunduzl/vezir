if (!customElements.get("m-press")) {
  class MPress extends HTMLElement {
    constructor() {
      super();
      this.prevSlideIndex = 0;
    }

    connectedCallback() {
      this.initSlider();
    }

    initSlider() {
      const contentWrapper = this.querySelector(".m-press__content");
      const navWrapper = this.querySelector(".m-press__list .swiper-container");
      const autoplay = this.dataset.autoplay === "true";

      this.items = parseInt(this.dataset.items);

      this.contentSlider = new MinimogLibs.Swiper(contentWrapper, {
        slidesPerView: 1,
        allowTouchMove: false,
        loop: true,
        effect: "fade",
        fadeEffect: {
          crossFade: true,
        },
        on: {
          init: function () {
            setTimeout(() => {
              window.dispatchEvent(new Event("resize"));
            }, 100);
          },
        },
      });

      this.navSlider = new MinimogLibs.Swiper(navWrapper, {
        autoplay: autoplay
          ? {
              delay: 3000,
            }
          : false,
        items: 1,
        loop: true,
        centeredSlides: true,
        threshold: 2,
        pagination: {
          el: this.querySelector(".swiper-pagination"),
          clickable: true,
        },
        navigation: {
          nextEl: this.querySelector(".m-slider-controls__button-next"),
          prevEl: this.querySelector(".m-slider-controls__button-prev"),
        },
        slideToClickedSlide: true,
        breakpoints: {
          768: {
            slidesPerView: this.items > 2 ? 3 : 1,
            navigation: false,
          },
          1280: {
            slidesPerView: this.items >= 5 ? 5 : this.items > 2 ? 3 : 1,
            navigation: false,
          },
        },
        on: {
          init: function (swiper) {
            const firstSlide = swiper.slides[swiper.activeIndex];
            firstSlide && firstSlide.classList.add("m-press__logo--is-active");
            setTimeout(() => {
              window.dispatchEvent(new Event("resize"));
            }, 100);
          },
        },
      });

      this.navSlider.on("slideChange", this._handleChange.bind(this));
      if (Shopify.designMode) {
        document.addEventListener("shopify:block:select", (e) => this.onBlockSelect(e));
      }
    }

    _handleChange(swiper) {
      const { realIndex, activeIndex, slides } = swiper || {};

      const prevSlide = this.querySelector('.m-press__logo--is-active[data-index="' + this.prevSlideIndex + '"]');
      const currentSlide = slides[activeIndex];

      currentSlide && currentSlide.classList.add("m-press__logo--is-active");
      prevSlide && prevSlide.classList.remove("m-press__logo--is-active");

      // Change content slide
      this.contentSlider.slideToLoop(realIndex);
      // Set prev slide index
      this.prevSlideIndex = realIndex;
    }

    onBlockSelect(evt) {
      const block = evt.target;
      const index = Number(block.dataset.index);
      if (this.contentSlider) {
        this.contentSlider.slideToLoop(index);
      }
      if (this.navSlider) {
        this.navSlider.slideToLoop(index);
      }
    }
  }

  customElements.define("m-press", MPress);
}
