if (!customElements.get("m-featured-collection")) {
  class MFeaturedCollection extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.selectors = {
        loadMoreBtn: "[data-load-more]",
        loadMoreBtnWrapper: ".m-featured-collection__button",
        productsContainer: "[data-products-container]",
        products: [".m-product-card"],
        soldNumber: ["[data-sold-number]"],
        availableNumber: ["[data-available-number]"],
        countDown: "[data-flashsale-countdown]",
        slideControls: ".m-slider-controls",
        slideContainer: ".m-mixed-layout__wrapper", // slideContainer
      };
      this.domNodes = queryDomNodes(this.selectors, this);

      this.buttonType = this.dataset.buttonType;
      this.infiniteLoad = this.dataset.infiniteLoad;
      this.enableSlider = this.dataset.enableSlider === "true";
      this.showPagination = this.dataset.showPagination === "true";
      this.showNavigation = this.dataset.showNavigation === "true";
      this.enableFlashsale = this.dataset.enableFlashsale === "true";
      this.enableCountdown = this.dataset.enableCountdown === "true";
      this.id = this.dataset.id;
      this.items = this.dataset.items;
      this.mobileDisableSlider = this.dataset.mobileDisableSlider === "true";

      this.initByScreenSize();
      document.addEventListener("matchMobile", () => {
        this.initByScreenSize();
      });
      document.addEventListener("unmatchMobile", () => {
        this.initByScreenSize();
      });

      if (this.enableFlashsale) this.initFlashSale();

      this.canLoad = true;
      this.currentPage = 1;
      this.spinner = spinner();

      if (!this.enableSlider && this.buttonType === "load" && this.infiniteLoad === "true") {
        this.initInfiniteLoad();
      }
      if (!this.enableSlider && this.buttonType === "load") {
        this.initLoadMore();
      }
      if (
        MinimogTheme.config.mqlMobile &&
        this.mobileDisableSlider &&
        this.buttonType === "load" &&
        this.infiniteLoad === "true"
      ) {
        this.initInfiniteLoad();
      }
      if (MinimogTheme.config.mqlMobile && this.mobileDisableSlider && this.buttonType === "load") {
        this.initLoadMore();
      }

      document.addEventListener("matchMobile", () => {
        if (MinimogTheme.config.mqlMobile && this.mobileDisableSlider && this.buttonType === "load") {
          this.initLoadMore();
        }
        if (
          MinimogTheme.config.mqlMobile &&
          this.mobileDisableSlider &&
          this.buttonType === "load" &&
          this.infiniteLoad === "true"
        ) {
          this.initInfiniteLoad();
        }
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
        loop: this.enableFlashsale ? false : true,
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

    initLoadMore() {
      this.triggerLoad = false;
      this.totalPages = parseInt(this.dataset.totalPages);

      addEventDelegate({
        context: this.container,
        selector: this.selectors.loadMoreBtn,
        handler: (e) => {
          e.preventDefault();
          this.handleLoadMore();
        },
      });
    }

    initInfiniteLoad() {
      const maxPages = this.dataset.maxPages;

      window.addEventListener("scroll", (e) => {
        this.canLoad = this.currentPage < parseInt(maxPages);

        if (!this.canLoad) return;
        if (this.offsetTop + this.clientHeight - window.innerHeight < window.scrollY && !this.triggerLoad) {
          this.triggerLoad = true;
          this.handleLoadMore();
        }
      });
    }

    async handleLoadMore() {
      this.currentPage++;
      this.canLoad = this.currentPage < this.totalPages;
      this.toggleLoading(true);
      const collectionID = this.dataset.collectionId;
      const res = await fetchCountDown(collectionID);

      const url = this.dataset.url;
      const dataUrl = `${url}?page=${this.currentPage}&section_id=${this.id}`;
      fetchCache(dataUrl).then((html) => {
        this.toggleLoading(false);
        const dom = generateDomFromString(html);
        const products = dom.querySelector(this.selectors.productsContainer);
        const oldCards = this.domNodes.productsContainer.childElementCount;
        let isAppended = false;

        if (products) {
          Array.from(products.childNodes).forEach((product) => {
            this.domNodes.productsContainer.appendChild(product);
            const check = setInterval(() => {
              if (this.domNodes.productsContainer.childElementCount > oldCards) {
                clearInterval(check);
                isAppended = true;
              }
            }, 50);
          });
        }

        if (this.enableFlashsale && res.ok && res.payload && res.payload.length) {
          const { expires_date } = res.payload[0];
          this.expires_date = expires_date;
          const check = setInterval(() => {
            if (isAppended) {
              clearInterval(check);
              const cards = this.domNodes.productsContainer.querySelectorAll(".m-product-card");
              cards.forEach((card) => {
                const content = card.querySelector(".m-product-card__content");
                const progress = card.querySelector(".m-product-sale-progress");
                if (!progress) {
                  let soldNumber;
                  if (card.dataset.soldNumber) {
                    soldNumber = card.dataset.soldNumber;
                  }
                  const component = saleProgress(res.payload[0], card.dataset.productId, soldNumber);
                  const newComponent = generateDomFromString(component);
                  content.appendChild(newComponent);
                }
              });
            }
          }, 50);
        }

        this.triggerLoad = false;

        if (!this.canLoad) {
          this.domNodes.loadMoreBtn && this.domNodes.loadMoreBtn.classList.add("m:hidden");
        }
      });
    }

    toggleLoading(status) {
      if (!this.domNodes.loadMoreBtn) return;
      if (status) {
        this.domNodes.loadMoreBtn.classList.add("m-spinner-loading");
      } else {
        this.domNodes.loadMoreBtn.classList.remove("m-spinner-loading");
      }
    }

    async initFlashSale() {
      const collectionID = this.dataset.collectionId;
      const res = await fetchCountDown(collectionID);
      if (res.ok && res.payload && res.payload.length) {
        const { expires_date } = res.payload[0];
        this.expires_date = expires_date;
        this.domNodes.products.forEach((card) => {
          const content = card.querySelector(".m-product-card__content");
          const pcardSale = card.querySelector(".m-product-sale-progress");
          let soldNumber;
          if (card.dataset.soldNumber) {
            soldNumber = card.dataset.soldNumber;
          }
          const component = saleProgress(res.payload[0], card.dataset.productId, soldNumber);
          const newComponent = generateDomFromString(component);
          if (!pcardSale) {
            content.appendChild(newComponent);
          }
        });
        this.initCountDown();
      }
    }

    initCountDown() {
      const endTime = new Date(this.expires_date).getTime();
      this.countDownTimer = new CountdownTimer(this.domNodes.countDown, Date.now(), endTime, {
        loop: true,
      });
    }
  }

  customElements.define("m-featured-collection", MFeaturedCollection);
}
