if (!customElements.get("iwt-carousel")) {
  class IWTCarousel extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.selectors = {
        slideInner: ".m-iwt-carousel__wrapper"
      };
      this.classes = {
        grid: 'm:display-grid',
        hidden: 'm:hidden',
        swiper: 'swiper-container',
        swiperWrapper: 'swiper-wrapper'
      };
      this.domNodes = queryDomNodes(this.selectors, this);

      this.slider = false;

      this.enableSlider = this.dataset.enableSlider === "true";
      this.autoplay = this.dataset.autoplay === "true";
      this.showNavigation = this.dataset.showNavigation === "true";
      this.showPagination = this.dataset.showPagination === "true";
      this.autoplaySpeed = this.dataset.autoplaySpeed;
      this.defaultGap = parseInt(this.dataset.gap);
      this.gaps = {
        desktop: this.defaultGap,
        tablet: this.defaultGap > 40 ? 40 : this.defaultGap
      };

      this.section = this.closest('.m-section');
      this.slideControls = this.section.querySelector('.m-slider-controls');

      this.init();
      document.addEventListener("matchMobile", () => {
        this.init();
      });
      document.addEventListener("unmatchMobile", () => {
        this.init();
      });
    }

    init() {
      if (!this.enableSlider) return;
      if (MinimogTheme.config.mqlMobile) {
        this.destroySlider();
      } else {
        this.initSlider();
      }
    }

    initSlider() {
      const { slideInner } = queryDomNodes(this.selectors, this);
      const nextEl = this.slideControls.querySelector('.m-slider-controls__button-next');
      const prevEl = this.slideControls.querySelector('.m-slider-controls__button-prev');

      this.options = {
        slidesPerView: 2,
        loop: true,
        spaceBetween: this.gaps.tablet,
        slidesPerGroup: 1,
        showNavigation: true,
        showPagination: true,
        autoplay: this.autoplay
          ? {
            delay: parseInt(this.autoplaySpeed) * 1000,
          }
          : false,
        pagination:
          this.showPagination
            ? {
              el: this.slideControls.querySelector(".swiper-pagination"),
              clickable: true,
              bulletClass: "m-dot",
              bulletActiveClass: "m-dot--active",
              renderBullet: function (index, className) {
                return '<span class="' + className + '"></span>';
              }
            }
            : false,
        navigation: this.showNavigation ? {
          nextEl: nextEl && nextEl,
          prevEl: prevEl && prevEl
        } : false,
        breakpoints: {
          1280: {
            spaceBetween: this.gaps.desktop
          }
        }
      };

      if (typeof this.slider !== 'object') {
        this.classList.add(this.classes.swiper);
        slideInner.classList.remove(this.classes.grid);
        slideInner.classList.add(this.classes.swiperWrapper);
        this.slideControls.classList.remove(this.classes.hidden);
        this.slider = new MinimogLibs.Swiper(this, this.options);
      }
    }

    destroySlider() {
      const { slideInner } = queryDomNodes(this.selectors, this);

      this.classList.remove(this.classes.swiper);
      slideInner.classList.remove(this.classes.swiperWrapper);
      slideInner.classList.add(this.classes.grid);
      this.slideControls.classList.add(this.classes.hidden);

      if (typeof this.slider === 'object') {
        this.slider.destroy();
        this.slider = false;
      }
    }
  }

  customElements.define("iwt-carousel", IWTCarousel);
}
