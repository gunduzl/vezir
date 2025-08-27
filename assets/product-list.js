class ProductList {
  constructor(container, productHandles = []) {
    this.selectors = {
      productList: "[data-product-list]",
      gridContainer: "[data-grid-container]",
      sliderControl: ".m-slider-controls",
    };
    this.swiper;
    this.currentScreen;
    if (!container || !productHandles.length) return;
    this.container = container;
    this.enableSlider = container.dataset.enableSlider === "true";
    this.productsToShow = Number(container.dataset.productsToShow) || 20;
    this.productsPerRow = Number(container.dataset.productsPerRow);
    this.productHandles = productHandles.slice(0, this.productsToShow);
    this.domNodes = queryDomNodes(this.selectors, container);

    this.init().catch(console.error);
  }

  init = async () => {
    const productNodes = {};

    await Promise.all(
      this.productHandles.map(async (hdl) => {
        const url = formatUrl("products", hdl, "view=grid-card-item");
        try {
          const prodHTML = await fetchCache(url);
          const prodNode = document.createElement("DIV");
          prodNode.classList.add("swiper-slide", "m:column");
          prodNode.innerHTML = prodHTML;
          if (prodNode.querySelector('[data-view="card"]')) {
            productNodes[hdl] = prodNode;
          }
        } catch (error) {
          console.error(`Error fetching data for handle ${hdl}:`, error);
        }
      })
    );

    // Render in order
    const { productList, gridContainer } = this.domNodes;

    this.productHandles.forEach((hdl) => {
      const node = productNodes[hdl];
      if (node) {
        if (productList.parentNode.classList.contains("foxkit-related-products__grid")) {
          if (this.productHandles && this.productHandles.length > this.productsPerRow) {
            productList && productList.appendChild(node);
          } else {
            productList && productList.style.setProperty("display", "none");
            node.classList.remove("m:column");
            gridContainer && gridContainer.appendChild(node);
          }
        } else {
          if (!this.enableSlider) productList.classList.remove("swiper-wrapper");
          productList && productList.appendChild(node);
        }
      }
    });

    MinimogTheme.CompareProduct && MinimogTheme.CompareProduct.setCompareButtonsState();
    MinimogTheme.Wishlist && MinimogTheme.Wishlist.setWishlistButtonsState();

    setTimeout(() => {
      this.initByScreenSize();
    }, 300);

    this.container.classList.remove("m:hidden", "hidden");
    window.addEventListener("resize", debounce(this.initByScreenSize, 300));
    refreshProductReview();
  };

  initByScreenSize = () => {
    const { productList, gridContainer, sliderControl } = this.domNodes;

    const screen = window.innerWidth > 767 ? "desktop" : "mobile";
    if (screen === this.currentScreen) return;
    this.currentScreen = screen;

    if (screen === "desktop") {
      gridContainer && gridContainer.parentNode.classList.remove("m-mixed-layout--mobile-scroll");

      if (this.enableSlider && this.productHandles && this.productHandles.length > this.productsPerRow) {
        gridContainer && gridContainer.classList.add("swiper-container");
        sliderControl && sliderControl.classList.remove("m:hidden", "hidden");
        const _container = this.container;
        const controlsContainer = this.container.querySelector(".m-slider-controls");
        const prevButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-prev");
        const nextButton = controlsContainer && controlsContainer.querySelector(".m-slider-controls__button-next");
        const slideItemsLength = gridContainer.querySelector(".swiper-wrapper").childElementCount;

        this.slider = new MinimogLibs.Swiper(gridContainer, {
          slidesPerView: 2,
          showPagination: false,
          showNavigation: true,
          loop: true,
          threshold: 2,
          pagination: false,
          breakpoints: {
            768: {
              slidesPerView: 3,
            },
            1280: {
              slidesPerView: parseInt(this.productsPerRow),
            },
          },
          on: {
            init: function () {
              setTimeout(() => {
                // Calculate controls position
                const firstItem = _container.querySelector(".m-image");
                if (firstItem && controlsContainer) {
                  const itemHeight = firstItem.clientHeight;
                  controlsContainer.style.setProperty("--offset-top", parseInt(itemHeight) / 2 + "px");
                }
              }, 200);
            },
            breakpoint: (swiper, breakpointParams) => {
              if (controlsContainer) {
                const { slidesPerView } = breakpointParams;
                if (slideItemsLength > slidesPerView) {
                  controlsContainer.classList.remove("m:hidden", "hidden");
                  swiper.allowTouchMove = true;
                } else {
                  controlsContainer.classList.add("m:hidden", "hidden");
                  swiper.allowTouchMove = false;
                }
              }
            },
          },
        });

        if (this.slider) {
          prevButton && prevButton.addEventListener("click", () => this.slider.slidePrev());
          nextButton && nextButton.addEventListener("click", () => this.slider.slideNext());
        }
        this.swiper = gridContainer && gridContainer.swiper;
      }
    } else {
      if (this.swiper) this.swiper.destroy(false, true);
      gridContainer.classList.remove("swiper-container");
      gridContainer.parentNode.classList.add("m-mixed-layout", "m-mixed-layout--mobile-scroll");
      sliderControl && sliderControl.classList.add("m:hidden", "hidden");
      productList.classList.add("m-mixed-layout__inner");
    }
  };
}

MinimogTheme.ProductList = ProductList;
