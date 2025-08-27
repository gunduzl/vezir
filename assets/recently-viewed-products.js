if (!customElements.get("m-recently-viewed")) {
  class MRecentlyViewed extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.selectors = {
        slideControls: ".m-slider-controls",
        slideContainer: ".m-mixed-layout__wrapper", // slideContainer
      };
      this.domNodes = queryDomNodes(this.selectors, this);

      this.enableSlider = this.dataset.enableSlider === "true";
      this.showPagination = this.dataset.showPagination === "true";
      this.showNavigation = this.dataset.showNavigation === "true";
      this.items = this.dataset.productsPerRow;
      this.mobileDisableSlider = this.dataset.mobileDisableSlider === "true";
      this.productsToshow = parseInt(this.dataset.productsToShow);

      this.init();
    }

    init() {
      fetch(this.dataset.url + this.getQueryString())
        .then((response) => response.text())
        .then((text) => {
          const html = document.createElement("div");
          html.innerHTML = text;
          const recommendations = html.querySelector("m-recently-viewed");
          this.products = recommendations.querySelectorAll(".m-product-card").length;
          if (this.products > 0) {
            this.classList.remove("m:hidden");
          }
          if (recommendations && recommendations.innerHTML.trim().length) {
            this.innerHTML = recommendations.innerHTML;
            this.initByScreenSize();
            document.addEventListener("matchMobile", () => {
              this.initByScreenSize();
            });
            document.addEventListener("unmatchMobile", () => {
              this.initByScreenSize();
            });

            MinimogTheme.CompareProduct?.setCompareButtonsState();
            MinimogTheme.Wishlist?.setWishlistButtonsState();
          }
        })
        .catch((e) => {
          console.error(e);
        });
    }

    initByScreenSize() {
      if (!this.enableSlider) return;
      const { slideContainer, slideControls } = queryDomNodes(this.selectors, this);

      if (MinimogTheme.config.mqlMobile && this.mobileDisableSlider) {
        slideControls && slideControls.classList.add("m:hidden");
        slideContainer && slideContainer.classList.remove("swiper-container");
        if (this.swiper) this.swiper.destroy(false, true);
      } else {
        slideControls && slideControls.classList.remove("m:hidden");
        this.initSlider();
      }

      if (this.products <= parseInt(this.items)) {
        slideControls && slideControls.classList.add("m:hidden");
      }
    }

    initSlider() {
      const { slideContainer } = queryDomNodes(this.selectors, this);
      const controlsContainer = this.querySelector(".m-slider-controls");
      const prevButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-prev");
      const nextButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-next");
      const slideItemsLength = slideContainer.querySelector(".swiper-wrapper").childElementCount;

      slideContainer && slideContainer.classList.add("swiper-container");

      this.slider = new MinimogLibs.Swiper(slideContainer, {
        slidesPerView: 2,
        showPagination: this.showPagination,
        showNavigation: this.showNavigation,
        loop: this.products <= parseInt(this.items) ? false : true,
        pagination: this.showPagination
          ? {
            el: this.querySelector(".swiper-pagination"),
            clickable: true,
          }
          : false,
        breakpoints: {
          768: {
            slidesPerView: parseInt(this.items) >= 3 ? 3 : parseInt(this.items),
          },
          1024: {
            slidesPerView: parseInt(this.items) >= 4 ? 4 : parseInt(this.items),
          },
          1280: {
            slidesPerView: parseInt(this.items),
          },
        },
        threshold: 2,
        on: {
          init: () => {
            setTimeout(() => {
              // Calculate controls position
              const firstItem = this.querySelector(".m-image") || this.querySelector(".m-placeholder-svg");
              if (firstItem && controlsContainer) {
                const itemHeight = firstItem.clientHeight;
                controlsContainer.style.setProperty("--offset-top", parseInt(itemHeight) / 2 + "px");

                prevButton && prevButton.classList.remove("m:hidden");
                nextButton && nextButton.classList.remove("m:hidden");
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

      this.swiper = slideContainer && slideContainer.swiper;
    }

    getQueryString() {
      const cookieName = "minimog-recently-viewed";
      const items = JSON.parse(window.localStorage.getItem(cookieName) || "[]");
      if (this.dataset.productId && items.includes(parseInt(this.dataset.productId))) {
        items.splice(items.indexOf(parseInt(this.dataset.productId)), 1);
      }
      return items
        .map((item) => "id:" + item)
        .slice(0, this.productsToshow)
        .join(" OR ");
    }
  }
  customElements.define("m-recently-viewed", MRecentlyViewed);
}
