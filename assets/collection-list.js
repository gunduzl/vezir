if (!customElements.get("m-collection-list")) {
  class MCollectionList extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.selectors = {
        slideControls: ".m-slider-controls",
        slideContainer: ".m-mixed-layout__wrapper",
        slideInner: ".m-mixed-layout__inner",
      };
      this.classes = {
        grid: 'm:grid',
        hidden: 'm:hidden',
        swiper: 'swiper-container',
        swiperWrapper: 'swiper-wrapper'
      };
      this.domNodes = queryDomNodes(this.selectors, this);

      this.slider = false;

      this.enableSlider = this.dataset.enableSlider === "true";
      this.items = this.dataset.items;
      this.total = this.dataset.total;
      this.autoplay = this.dataset.autoplay === "true";
      this.autoplaySpeed = this.dataset.autoplaySpeed;
      this.paginationType = this.dataset.paginationType;
      this.expanded = this.dataset.expanded === "true";
      this.mobileDisableSlider = this.dataset.mobileDisableSlider === "true";

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
      if (MinimogTheme.config.mqlMobile && this.mobileDisableSlider) {
        this.destroySlider();
      } else {
        this.initSlider();
      }
    }

    initSlider() {
      const { slideContainer, slideControls, slideInner } = queryDomNodes(this.selectors, this);

      const prevButton = slideControls && slideControls.querySelector(".m-slider-controls__button-prev");
      const nextButton = slideControls && slideControls.querySelector(".m-slider-controls__button-next");
      const paginationIcon = `<svg width="65px" height="65px" viewBox="0 0 72 72" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><circle class="time" stroke-width="5" fill="none" stroke-linecap="round" cx="33" cy="33" r="28"></circle></svg>`;

      this.options = {
        slidesPerView: 2,
        loop: true,
        slidesPerGroup: 1,
        showNavigation: true,
        showPagination: true,
        parallax: true,
        autoplay: this.autoplay
          ? {
            delay: parseInt(this.autoplaySpeed) * 1000,
          }
          : false,
        pagination:
          this.paginationType == "fraction"
            ? {
              el: this.querySelector(".swiper-pagination"),
              clickable: true,
              type: "fraction",
            }
            : {
              el: this.querySelector(".swiper-pagination"),
              clickable: true,
              bulletClass: "m-dot",
              bulletActiveClass: "m-dot--active",
              renderBullet: function (index, className) {
                return '<span class="' + className + '">' + paginationIcon + "</span>";
              },
            },
        navigation: nextButton || prevButton ? {
          nextEl: nextButton && nextButton,
          prevEl: prevButton && prevButton
        } : false,
        autoHeight: true,
        breakpoints: {
          480: {
            slidesPerView: 3,
          },
          768: {
            slidesPerView: parseInt(this.items) >= 3 ? 3 : parseInt(this.items),
          },
          1280: {
            slidesPerView: this.expanded && this.total > this.items ? parseInt(this.items) + 1 : parseInt(this.items),
          },
        }
      };

      if (typeof this.slider !== 'object') {
        slideContainer.classList.add(this.classes.swiper);
        slideInner.classList.remove(this.classes.grid);
        slideInner.classList.add(this.classes.swiperWrapper);
        slideControls && slideControls.classList.remove(this.classes.hidden);
        this.slider = new MinimogLibs.Swiper(slideContainer, this.options);
      }
    }

    destroySlider() {
      const { slideContainer, slideControls, slideInner } = queryDomNodes(this.selectors, this);

      slideContainer.classList.remove(this.classes.swiper);
      slideInner.classList.remove(this.classes.swiperWrapper);
      slideInner.classList.add(this.classes.grid);
      slideControls && slideControls.classList.add(this.classes.hidden);

      if (typeof this.slider === 'object') {
        this.slider.destroy();
        this.slider = false;
      }
    }
  }

  customElements.define("m-collection-list", MCollectionList);
}
