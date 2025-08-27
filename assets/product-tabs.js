if (!customElements.get("m-product-tabs")) {
  class MProductTabs extends HTMLElement {
    constructor() {
      super();
      this.selectors = {
        loadMoreBtn: "[data-load-more-product]",
        productsContainer: "[data-products-container]",
        tabContent: [".m-tab-content"],
      };
      this.tabSliders = [];
      this.sliderEnabled = this.dataset.enableSlider === "true";
      this.mobileSliderDisable = this.dataset.mobileDisableSlider === "true";
      this.buttonType = this.dataset.buttonType;
      this.domNodes = queryDomNodes(this.selectors, this);
      this.showPagination = this.dataset.showPagination === "true";
      this.showNavigation = this.dataset.showNavigation === "true";
      this.items = this.dataset.items;
    }

    connectedCallback() {
      this.init();
    }

    init() {
      if (this.sliderEnabled) {
        for (let block of this.domNodes.tabContent) {
          this.initSliderByScreenSize(block);
          document.addEventListener("matchMobile", () => {
            this.initSliderByScreenSize(block);
          });
          document.addEventListener("unmatchMobile", () => {
            this.initSliderByScreenSize(block);
          });
        }
      }
      if (!this.sliderEnabled && this.buttonType === "load") {
        this.canLoad = true;
        this.currentPage = 1;

        for (let block of this.domNodes.tabContent) {
          this.initLoadMore(block);
        }
      }
      if (MinimogTheme.config.mqlMobile && this.mobileSliderDisable && this.buttonType === "load") {
        this.canLoad = true;
        this.currentPage = 1;
        for (let block of this.domNodes.tabContent) {
          this.initLoadMore(block);
        }
      }
      document.addEventListener("matchMobile", () => {
        if (MinimogTheme.config.mqlMobile && this.mobileSliderDisable && this.buttonType === "load") {
          this.canLoad = true;
          this.currentPage = 1;
          for (let block of this.domNodes.tabContent) {
            this.initLoadMore(block);
          }
        }
      });
      this.initTabs();
      this.initMobileSelect();

      if (Shopify.designMode) {
        document.addEventListener("shopify:block:select", (event) => {
          const blockSelectedIsTab = event.target.classList.contains("m-tab-content");
          if (!blockSelectedIsTab) return;
          const dataIndex = event.target && event.target.dataset.index;
          this.tabs.setActiveTab(dataIndex);
        });
      }
    }

    initTabs() {
      this.tabs = new MinimogTheme.Tabs(this, (target) => {
        const tabId = target.getAttribute("href");
        const slider = this.querySelector(tabId + " .swiper-container");
        const controlsContainer = this.querySelector(tabId + " .m-slider-controls");
        // trigger update slider
        slider && slider.swiper && slider.swiper.update();
        const firstItem = slider && (slider.querySelector(".m-image") || slider.querySelector(".m-placeholder-svg"));
        if (firstItem && controlsContainer) {
          const itemHeight = firstItem.clientHeight;
          controlsContainer.style.setProperty("--offset-top", parseInt(itemHeight) / 2 + "px");
        }
      });
    }

    initSliderByScreenSize(sliderContainer) {
      const mobileDisableSlider = this.dataset.mobileDisableSlider === "true";
      const slider = sliderContainer.querySelector(".m-mixed-layout__wrapper");
      const controlsContainer = sliderContainer.querySelector(".m-slider-controls");

      if (MinimogTheme.config.mqlMobile && mobileDisableSlider) {
        controlsContainer && controlsContainer.classList.add("m:hidden");
        slider.classList.remove("swiper-container");
        if (slider.swiper) slider.swiper.destroy(false, true);
      } else {
        controlsContainer && controlsContainer.classList.remove("m:hidden");
        setTimeout(() => {
          this.initSlider(sliderContainer);
        });
      }
    }

    initSlider(sliderContainer) {
      const layoutWrapper = sliderContainer.querySelector(".m-product-list");
      const swiper = sliderContainer && sliderContainer.querySelector(".m-mixed-layout__wrapper");
      const controlsContainer = sliderContainer.querySelector(".m-slider-controls");
      const prevButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-prev");
      const nextButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-next");
      const slideItemsLength =
        sliderContainer &&
        sliderContainer.querySelector(".swiper-wrapper") &&
        sliderContainer.querySelector(".swiper-wrapper").childElementCount;
      if (parseInt(this.items) >= slideItemsLength) {
        controlsContainer && controlsContainer.classList.add("m:hidden");
        layoutWrapper.classList.add("m-mixed-layout--mobile-grid");
        return;
      }

      swiper && swiper.classList.add("swiper-container");

      let slider = new MinimogLibs.Swiper(swiper, {
        slidesPerView: 2,
        showPagination: this.showPagination,
        showNavigation: this.showNavigation,
        loop: this.enableFlashsale ? false : true,
        pagination: this.showPagination
          ? {
              el: sliderContainer.querySelector(".swiper-pagination"),
              clickable: true,
            }
          : false,
        breakpoints: {
          768: {
            slidesPerView: parseInt(this.items) >= 3 ? 3 : parseInt(this.items),
          },
          992: {
            slidesPerView: parseInt(this.items) >= 4 ? 4 : parseInt(this.items),
          },
          1280: {
            slidesPerView: parseInt(this.items),
          },
        },
        threshold: 2,
        on: {
          init: function () {
            setTimeout(() => {
              // Calculate controls position
              const firstItem =
                sliderContainer.querySelector(".m-image") || sliderContainer.querySelector(".m-placeholder-svg");
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

      if (slider && this.showNavigation) {
        prevButton && prevButton.addEventListener("click", () => slider.slidePrev());
        nextButton && nextButton.addEventListener("click", () => slider.slideNext());
      }
    }

    initMobileSelect() {
      this.select = this.querySelector("[data-tab-select]");
      this.select.addEventListener("change", () => {
        this.tabs.setActiveTab(parseInt(this.select.value));
        const slider = this.tabs && this.tabs.currentTab && this.tabs.currentTab.querySelector(".swiper-container");
        const controlsContainer =
          this.tabs && this.tabs.currentTab && this.tabs.currentTab.querySelector(".m-slider-controls");
        const prevButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-prev");
        const nextButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-next");
        slider && slider.swiper && slider.swiper.update();
        const firstItem = slider && slider.querySelector(".m-image");
        if (firstItem && controlsContainer) {
          const itemHeight = firstItem.clientHeight;
          controlsContainer.style.setProperty("--offset-top", parseInt(itemHeight) / 2 + "px");

          prevButton.classList.remove("m:hidden");
          nextButton.classList.remove("m:hidden");
        }
      });
    }

    initLoadMore(wrapper) {
      addEventDelegate({
        context: wrapper,
        selector: this.selectors.loadMoreBtn,
        handler: (e) => {
          e.preventDefault();
          this.handleLoadMore(wrapper);
        },
      });
    }

    handleLoadMore(wrapper) {
      const loadBtn = wrapper.querySelector(this.selectors.loadMoreBtn);
      const productsContainer = wrapper.querySelector(this.selectors.productsContainer);

      let currentPage = wrapper.dataset.page;
      currentPage = parseInt(currentPage);
      const totalPages = wrapper.dataset.totalPages;
      this.toggleLoading(loadBtn, true);

      const url = wrapper.dataset.url;
      const dataUrl = `${url}?page=${currentPage + 1}&section_id=${this.id}`;
      fetchCache(dataUrl).then((html) => {
        currentPage++;
        wrapper.dataset.page = currentPage;
        this.toggleLoading(loadBtn, false);
        const dom = generateDomFromString(html);
        const tabId = wrapper.getAttribute("id");
        const products = dom.querySelector(`#${tabId} ${this.selectors.productsContainer}`);

        if (products) {
          Array.from(products.childNodes).forEach((product) => productsContainer.appendChild(product));
        }

        if (currentPage >= parseInt(totalPages)) loadBtn && loadBtn.remove();
      });

      // Remove button focus
      loadBtn.blur();
    }

    toggleLoading(loadBtn, status) {
      if (!loadBtn) return;
      if (status) {
        loadBtn.classList.add("m-spinner-loading");
      } else {
        loadBtn.classList.remove("m-spinner-loading");
      }
    }
  }
  customElements.define("m-product-tabs", MProductTabs);
}
