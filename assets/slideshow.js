if (!customElements.get("m-slideshow")) {
  class MSlideshow extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.autoplay = this.dataset.autoplay === "true";
      this.autoplaySpeed = parseInt(this.dataset.autoplaySpeed);
      this.showArrows = this.dataset.enableArrows === "true";
      this.showDots = this.dataset.enableDots === "true";
      this.adaptHeight = this.dataset.slideHeight === "adapt";
      this.id = this.dataset.id;
      this.sliderContainer = this.querySelector(".swiper-container");

      this.lastVideo = null;
      this.lastActive = null;
      this.timeout = null;
      this.initSlider();
    }

    initSlider() {
      this.slider = new MinimogLibs.Swiper(this.sliderContainer, {
        init: false,
        autoplay: this.autoplay
          ? {
              delay: this.autoplaySpeed * 1000,
              disableOnInteraction: true,
            }
          : false,
        slidesPerView: 1,
        slidesPerGroup: 1,
        loop: true,
        effect: "fade",
        fadeEffect: {
          crossFade: true,
        },
        speed: 1000,
        navigation: this.showArrows
          ? {
              nextEl: this.querySelector(".m-slider-controls__button-next"),
              prevEl: this.querySelector(".m-slider-controls__button-prev"),
            }
          : false,
        pagination: this.showDots
          ? {
              el: this.querySelector(".swiper-pagination"),
              clickable: true,
              bulletClass: "m-dot",
              bulletActiveClass: "m-dot--active",
            }
          : false,
        breakpoints: {
          992: {
            threshold: 2,
          },
        },
        on: {
          init() {
            setTimeout(() => {
              window.dispatchEvent(new Event("resize"));
            }, 100);
          },
        },
      });

      this.lastSlide = null;
      this.currentSlide = null;
      this.slider && this.slider.on("init", this.handleChange.bind(this));
      this.slider && this.slider.on("slideChange", this.handleChange.bind(this));
      this.slider.init();

      if (Shopify.designMode) {
        document.addEventListener("shopify:block:select", (e) => this.onBlockSelect(e));
      }
    }

    handleChange(swiper) {
      const { activeIndex, slides } = swiper;
      const slideType = slides[activeIndex] && slides[activeIndex].dataset.slideType;
      this.lastActive && this.slider.slideToLoop(this.lastActive);
      if (slideType === "video_slide") {
        const video = slides[activeIndex] && slides[activeIndex].querySelector("video");

        if (video) {
          let playPromise = video.play();
          this.lastVideo && this.lastVideo.pause();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              this.lastVideo = video;
            });
          }
        }
      } else {
        this.lastVideo && this.lastVideo.pause();
        this.lastVideo = null;
      }
    }

    onBlockSelect(ev) {
      const block = ev.target;
      const index = Number(block.dataset.slide);
      this.lastActive = index;
      if (this.slider) {
        this.slider.slideToLoop(index);
      }
    }
  }

  customElements.define("m-slideshow", MSlideshow);
}
