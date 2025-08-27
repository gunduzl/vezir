if (!customElements.get("m-testimonials")) {
  class MTestimonials extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      let containerType, autoplay;
      if (this.dataset.design) {
        this.design = this.dataset.design;
      }
      if (this.dataset.container) {
        containerType = this.dataset.container;
      }
      if (this.dataset.autoplay) {
        autoplay = this.dataset.autoplay === "true";
      }
      this.container = this.closest(".m-testimonials");

      if (!this.design) {
        return console.warn("Failed to init Testimonials: design not found!!");
      }

      this.sliderContainer = this.querySelector(".swiper-container");
      if (!this.sliderContainer) {
        this.classList.add("opacity-100");
        return;
      }

      this.defaultSettings = {
        pagination: {
          el: this.container.querySelector(".swiper-pagination"),
          clickable: true,
        },
        navigation: {
          nextEl: this.container.querySelector(".m-slider-controls__button-next"),
          prevEl: this.container.querySelector(".m-slider-controls__button-prev"),
        },
        autoplay: autoplay
          ? {
            delay: 5000,
            pauseOnMouseEnter: false,
          }
          : false,
        loop: true,
        slidesPerView: 1,
      };

      this.settings = {};
      let gutter = 400;
      switch (this.design) {
        case "testimonials-1":
          this.settings = {
            centeredSlides: true,
            slidesPerView: 1,
            slidesPerGroup: 1,
            spaceBetween: 20,
            speed: 300,
            slideToClickedSlide: true,
            loop: true,
            breakpoints: {
              768: {
                slidesPerView: 3,
                slidesPerGroup: 3,
                spaceBetween: 20,
                speed: 1000,
              },
              1280: {
                slidesPerView: 5,
                slidesPerGroup: 3,
                spaceBetween: 30,
              },
              2560: {
                slidesPerView: 7,
                slidesPerGroup: 3,
              },
            },
          };
          break;
        case "testimonials-2":
          this.settings = {
            slidesPerView: 1,
            spaceBetween: 30,
            breakpoints: {
              768: { slidesPerView: 3, slidesPerGroup: 3 },
            },
          };
          break;
        case "testimonials-3":
          this.settings = {
            slidesPerView: 1,
            spaceBetween: 30,
            breakpoints: {
              768: { slidesPerView: containerType === "w-full" ? 3 : 2 },
            },
          };
          break;
        case "testimonials-4":
          if (containerType === "container-fluid") gutter = 200;
          if (containerType === "container") gutter = 150;
          this.settings = {
            slidesPerView: 1,
            centeredSlides: true,
            slideToClickedSlide: true,
            breakpoints: {
              768: { spaceBetween: parseInt(gutter / 4), slidesPerView: 3 },
              992: { spaceBetween: gutter / 2, slidesPerView: 3 },
              1920: { spaceBetween: gutter, slidesPerView: 3 },
            },
          };
          break;
        case "testimonials-6":
          this.settings = {
            slidesPerView: 1,
            loop: true,
            pagination:
              this.dataset.paginationType == "fraction"
                ? {
                  el: this.container.querySelector(".swiper-pagination"),
                  clickable: true,
                  type: "fraction",
                }
                : {
                  el: this.container.querySelector(".swiper-pagination"),
                  clickable: true,
                },
            breakpoints: {
              768: { slidesPerView: 2 },
              1366: { slidesPerView: containerType === "container" ? 2 : 3 },
              1600: { slidesPerView: containerType === "container-fluid" ? 3 : 4 },
            },
          };
          break;
        case "testimonials-7":
          this.settings = {
            slidesPerView: 2,
            spaceBetween: 16,
            loop: true,
            pagination:
              this.dataset.paginationType == "fraction"
                ? {
                  el: this.container.querySelector(".swiper-pagination"),
                  clickable: true,
                  type: "fraction",
                }
                : {
                  el: this.container.querySelector(".swiper-pagination"),
                  clickable: true,
                }
          };
          break;
        case "testimonials-8":
          this.settings = {
            fade: {
              crossFade: true,
            },
            pagination:
              this.dataset.paginationType == "fraction"
                ? {
                  el: this.container.querySelector(".swiper-pagination"),
                  clickable: true,
                  type: "fraction",
                }
                : {
                  el: this.container.querySelector(".swiper-pagination"),
                  clickable: true,
                },
          };
          break;
        case "testimonials-5":
          this.settings = {
            fade: {
              crossFade: true,
            },
          };
          break;
      }

      // Testimonials 5
      const images = this.querySelector(".m-tabs");
      if (images) {
        const interval = setInterval(() => {
          if (MinimogTheme.Tabs) {
            clearInterval(interval);
            this.imagesTab = new MinimogTheme.Tabs(images);
          }
        }, 50);
      }

      this.initSlider();
    }

    initSlider() {
      this.slider = new MinimogLibs.Swiper(this.sliderContainer, {
        ...this.defaultSettings,
        ...this.settings,
        on: {
          init: () => {
            setTimeout(() => {
              window.dispatchEvent(new Event("resize"));
            }, 100);
          },
        },
      });
      if (this.design === "testimonials-4") {
        this.slider.on("activeIndexChange", (swiper) => {
          const { realIndex } = swiper;
          this.querySelector(".m-testimonial-index").innerHTML = parseInt(realIndex) + 1;
        });
      }
      if ((this.design === "testimonials-5") | (this.design === "testimonials-8")) {
        this.slider.on("slideChange", (swiper) => {
          const { realIndex } = swiper;
          this.imagesTab.setActiveTab(realIndex);
        });
      }
      document.addEventListener("shopify:block:select", (e) => this.onBlockSelect(e));
    }

    onBlockSelect(ev) {
      const block = ev.target;
      const index = Number(block.dataset.index);
      if (this.slider) {
        this.slider.slideToLoop(index);
      }
    }
  }

  customElements.define("m-testimonials", MTestimonials);
}
