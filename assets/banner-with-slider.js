if (!customElements.get("m-banner-with-slide")) {
  class MBannerWithSlide extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.lastActive = null;
      this.initSlider();
    }

    initSlider() {
      const __this = this;
      this.slider = new MinimogLibs.Swiper(`.m-slider-${this.dataset.id}`, {
        autoplay:
          this.dataset.autoplay === "true" ? { delay: this.dataset.timeout, disableOnInteraction: true } : false,
        slidesPerView: 1,
        loop: true,
        fadeEffect: {
          crossFade: true,
        },
        pagination: {
          el: this.querySelector(".swiper-pagination"),
          clickable: true,
          bulletClass: "m-dot",
          bulletActiveClass: "m-dot--active",
        },
        on: {
          init: function (swiper) {
            this.slideToLoop(this.lastActive);
            __this.handleChange(swiper);
            setTimeout(() => {
              window.dispatchEvent(new Event("resize"));
            }, 100);
          },
        },
      });
      this.slider && this.slider.on("slideChange", this.handleChange.bind(this));
      document.addEventListener("shopify:block:select", (e) => this.onBlockSelect(e));
    }

    handleChange(swiper) {
      const currentSlide = swiper.slides[swiper.activeIndex];
      if (currentSlide) {
        const currentColor = window.getComputedStyle(currentSlide).getPropertyValue("color");
        currentColor && this.style.setProperty("--swiper-controls-color", currentColor);
      }
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

  customElements.define("m-banner-with-slide", MBannerWithSlide);
}
