if (!customElements.get("media-gallery")) {
  customElements.define(
    "media-gallery",
    class MediaGallery extends HTMLElement {
      constructor() {
        super();
        this.selectors = {
          container: ".m-main-product--wrapper",
          slider: ".m-media-gallery__inner",
          sliderPagination: ".swiper-pagination",
          sliderPrevEl: ".swiper-button-prev",
          sliderNextEl: ".swiper-button-next",
          navSlider: ".nav-swiper-container",
          medias: [".m-product-media--item"],
          mediaWrapper: ".m-product-media--wrapper",
          mediaZoomIns: [".m-product-media__zoom-in"],
          videos: [".media-video"],
          featuredImage: ".m-product-media",
          galleryList: ".m-media-gallery__list",
          galleryInner: ".m-media-gallery__inner",
        };

        this.navSlider = false;
        this.slider = false;
      }

      get context() {
        return this.dataset.context;
      }

      get layout() {
        return this.dataset.layout;
      }

      connectedCallback() {
        this.init();
      }

      init() {
        this.section = this.closest('product-info');
        this.domNodes = queryDomNodes(this.selectors, this);
        this.enableVideoAutoplay = this.dataset.enableVideoAutoplay === "true";
        this.enableImageZoom = this.dataset.enableImageZoom === "true";
        this.enableVariantGroupImages = this.dataset.enableVariantGroupImages === "true";
        this.onlyMedia = this.dataset.onlyMedia === "true";
        this.enableDesktopSlider = this.dataset.enableDesktopSlider === 'true';
        this.variantPicker = this.section.querySelector("variant-picker");

        this.setSliderOptions();

        const mql = window.matchMedia(MinimogTheme.config.mediaQueryMobile);
        mql.onchange = this.updateMediaLayout.bind(this);
        this.updateMediaLayout();

        if (this.enableImageZoom) {
          this.handlePhotoswipe();
        };

        this.handleAutoplayVideo();

        this.removeAttribute("data-media-loading");
        this.domNodes.galleryInner.style.opacity = 1;
      }

      updateMediaLayout() {
        if (MinimogTheme.config.mqlMobile) {
          this.initSlider();
        } else {
          if (this.enableDesktopSlider) {
            this.initSlider();
          } else {
            this.destroySlider();
          }
        }
      }

      setSliderOptions() {
        const { sliderPagination, sliderNextEl: nextEl, sliderPrevEl: prevEl } = this.domNodes;

        this.sliderOptions = {
          autoHeight: true,
          navigation: { nextEl, prevEl },
          threshold: 2,
          loop: !this.enableVariantGroupImages,
          pagination: {
            el: sliderPagination,
            clickable: true,
            type: "bullets",
          },
          on: {
            init: () => {
              this.domNodes.slider.style.opacity = 1;
              this.domNodes = queryDomNodes(this.selectors, this.section);
              requestAnimationFrame(() => {
                window.dispatchEvent(new Event("resize"));
              });
            }
          }
        };

        this.thumbsOptions = {
          loop: false,
          slidesPerView: 5,
          freeMode: true,
          spaceBetween: 10,
          threshold: 2,
          watchSlidesVisibility: true,
          watchSlidesProgress: true,
          on: {
            init: () => {
              this.domNodes.navSlider.style.opacity = 1
            }
          }
        };

        switch (this.layout) {
          case 'layout-4':
            break;
          case 'layout-5':
            this.sliderOptions = {
              ...this.sliderOptions,
              watchSlidesProgress: true,
              watchSlidesVisibility: true,
              breakpoints: {
                768: {
                  slidesPerView: 2,
                  slidesPerGroup: 1,
                  spaceBetween: 10,
                },
              }
            }
            break;
          case 'layout-6':
            this.thumbsOptions = {
              ...this.thumbsOptions,
              breakpoints: {
                1024: {
                  direction: 'vertical',
                  slidesPerView: 'auto',
                  spaceBetween: 5,
                }
              }
            }
            break;
          case 'layout-7':
            this.sliderOptions = {
              ...this.sliderOptions,
              speed: 500,
              centeredSlides: true,
              breakpoints: {
                768: {
                  slidesPerView: 3
                }
              }
            }
        }
      }

      initSlider() {
        if (typeof this.slider !== 'object') {
          const { slider, navSlider, galleryList } = this.domNodes;

          // Initialize navigation slider if navSlider exists
          this.navSlider = navSlider ? new MinimogLibs.Swiper(navSlider, this.thumbsOptions) : false;

          if (navSlider) {
            this.sliderOptions.thumbs = {
              swiper: this.navSlider
            };
          }

          // Initialize the main slider
          slider.classList.add('swiper-container');
          galleryList.classList.remove('m:grid');
          galleryList.classList.add('swiper-wrapper');

          this.slider = new MinimogLibs.Swiper(slider, this.sliderOptions);

          // Handle slide change for variant group images
          if (!this.enableVariantGroupImages) this.handleSlideChange();
        }
      }

      destroySlider() {
        const { slider, galleryList } = this.domNodes;

        slider.classList.remove('swiper-container');
        galleryList.classList.add('m:grid');
        galleryList.classList.remove('swiper-wrapper');

        if (typeof this.slider === 'object') {
          this.slider.destroy();
          this.slider = false;
        }
      }

      handleSlideChange() {
        if (!this.slider) return;

        this.slider.on("slideChange", (swiper) => {
          window.pauseAllMedia(this);

          const { slides, activeIndex } = swiper;
          const activeSlide = slides[activeIndex];
          if (activeSlide) this.playActiveMedia(activeSlide);

          // Determine visible slides based on layout
          const visibleSlides = [activeIndex];
          if (["layout-5", "layout-7"].includes(this.layout)) {
            visibleSlides.push(activeIndex + 1);
          }

          // Check if any of the visible slides have a model media type
          const hasModelMediaType = visibleSlides.some((index) => {
            const slide = slides[index];
            return slide && slide.dataset.mediaType === "model";
          });

          // Toggle slider's draggable state based on media type
          this.toggleSliderDraggableState(!hasModelMediaType);
        });
      }

      toggleSliderDraggableState(isDraggable) {
        if (this.slider.allowTouchMove !== isDraggable) {
          this.slider.allowTouchMove = isDraggable;
        }
      }

      handleAutoplayVideo() {
        const playVideo = (mediaElement) => {
          const mediaType = mediaElement.dataset.mediaType;
          if (mediaType === "video" || mediaType === "external_video") {
            const deferredMedia = mediaElement.querySelector("deferred-media");
            const autoplay = deferredMedia && deferredMedia.dataset.autoPlay === "true";
            if (autoplay) deferredMedia.loadContent(false);
          }
        };

        if (this.slider) {
          const { slides, activeIndex } = this.slider;
          const activeSlide = slides[activeIndex];
          if (activeSlide) playVideo(activeSlide);
        } else {
          this.domNodes.medias.forEach(playVideo);
        }
      }

      playActiveMedia(selected) {
        const deferredMedia = selected.querySelector("deferred-media");
        if (!deferredMedia || deferredMedia.dataset.autoPlay !== "true") return;

        const playMedia = (element) => {
          if (element.classList.contains("js-youtube") || element.classList.contains("js-vimeo")) {
            const platform = element.classList.contains("js-youtube") ? "youtube" : "vimeo";
            const param = platform === "youtube" ? "mute=1" : "muted=1";
            const symbol = element.src.includes("?") ? "&" : "?";
            element.src += `${symbol}autoplay=1&${param}`;
          } else {
            element.play();
          }
        };

        if (!deferredMedia.hasAttribute("loaded")) {
          deferredMedia.loadContent(false);
        }

        const deferredElement = deferredMedia.querySelector("video, model-viewer, iframe");
        playMedia(deferredElement);
      }

      handlePhotoswipe() {
        const medias = [...this.querySelectorAll(".m-product-media--item:not(.swiper-slide-duplicate)")];

        const data = medias.map((media) => {
          const { mediaType, index: id } = media.dataset;

          if (mediaType === "image") {
            const {
              mediaSrc: src,
              mediaWidth,
              mediaHeight,
              mediaAlt: alt,
            } = media.querySelector(".m-product-media").dataset;
            return {
              src,
              width: parseInt(mediaWidth),
              height: parseInt(mediaHeight),
              alt,
              id,
            };
          } else {
            return {
              html: `<div class="pswp__${mediaType}">${media.innerHTML}</div>`,
              type: mediaType,
              id,
            };
          }
        });

        const options = {
          dataSource: data,
          bgOpacity: 1,
          close: false,
          zoom: false,
          arrowNext: false,
          arrowPrev: false,
          counter: false,
          preloader: false,
          pswpModule: MinimogLibs.PhotoSwipeLightbox.PhotoSwipe,
        };
        this.lightbox = new MinimogLibs.PhotoSwipeLightbox(options);

        this.lightbox.addFilter("thumbEl", (thumbEl, { id }, index) => {
          return this.querySelector(`[data-index="${id}"]:not(.swiper-slide-duplicate) img`) || thumbEl;
        });

        this.lightbox.addFilter("placeholderSrc", (placeholderSrc, { data: { id } }) => {
          const el = this.querySelector(`[data-index="${id}"]:not(.swiper-slide-duplicate) img`);
          return el ? el.src : placeholderSrc;
        });

        this.lightbox.on("change", () => {
          window.pauseAllMedia(this);
          if (this.slider) {
            const { currIndex } = this.lightbox.pswp;
            const slideMethod = this.enableVariantGroupImages ? "slideTo" : "slideToLoop";
            this.slider[slideMethod](currIndex, 100, false);
          }
        });

        this.lightbox.on("pointerDown", (e) => {
          if (this.lightbox.pswp.currSlide.data.type === "model") {
            e.preventDefault();
          }
        });

        // UI elements
        const uiElements = [
          {
            name: "m-close",
            order: 11,
            isButton: true,
            html: '<svg class="m-svg-icon--large" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
            onClick: (event, el, pswp) => pswp.close(),
          },
          {
            name: "m-arrowNext",
            order: 12,
            isButton: true,
            html: '<svg fill="currentColor" width="14px" height="14px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M218.101 38.101L198.302 57.9c-4.686 4.686-4.686 12.284 0 16.971L353.432 230H12c-6.627 0-12 5.373-12 12v28c0 6.627 5.373 12 12 12h341.432l-155.13 155.13c-4.686 4.686-4.686 12.284 0 16.971l19.799 19.799c4.686 4.686 12.284 4.686 16.971 0l209.414-209.414c4.686-4.686 4.686-12.284 0-16.971L235.071 38.101c-4.686-4.687-12.284-4.687-16.97 0z"></path></svg>',
            onClick: (event, el, pswp) => pswp.next(),
          },
          {
            name: "m-arrowPrev",
            order: 10,
            isButton: true,
            html: '<svg width="14px" height="14px" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M229.9 473.899l19.799-19.799c4.686-4.686 4.686-12.284 0-16.971L94.569 282H436c6.627 0 12-5.373 12-12v-28c0-6.627-5.373-12-12-12H94.569l155.13-155.13c4.686-4.686 4.686-12.284 0-16.971L229.9 38.101c-4.686-4.686-12.284-4.686-16.971 0L3.515 247.515c-4.686 4.686-4.686 12.284 0 16.971L212.929 473.9c4.686 4.686 12.284 4.686 16.971-.001z"></path></svg>',
            onClick: (event, el, pswp) => pswp.prev(),
          },
        ];

        this.lightbox.on("uiRegister", () => {
          this.lightbox.pswp.ui.registerElement(uiElements[0]);
          if (!this.onlyMedia) {
            uiElements.slice(1).forEach((element) => this.lightbox.pswp.ui.registerElement(element));
          }
        });

        this.lightbox.init();

        const handleMediaClick = (e, media) => {
          e.preventDefault();
          const isImage = media.classList.contains("media-type-image");
          const isZoomButton = e.target.closest(this.selectors.mediaZoomIns[0]);

          if (isImage || isZoomButton) {
            const index = Number(media.dataset.index) || 0;
            this.lightbox.loadAndOpen(index);
          }
        };

        addEventDelegate({
          selector: this.selectors.medias[0],
          context: this,
          handler: handleMediaClick,
        });
      }

      setActiveMedia(variant) {
        if (!variant) return;
        if (this.slider) {
          this.setActiveMediaForSlider(variant);
        } else {
          this.handleGalleryMode(variant);
        }
      }

      setActiveMediaForSlider(variant) {
        if (variant.featured_media && this.slider && this.slider.wrapperEl) {
          let slideIndex = variant.featured_media.position || 1;
          this.slider.slideToLoop(slideIndex - 1);
        }
      }

      handleGalleryMode(variant) {
        if (this.context !== "featured-product" && variant && variant.featured_media) {
          const selectedMedia = this.querySelector(`.m-media-gallery__list [data-media-id="${variant.featured_media.id}"]`);
          if (selectedMedia) {
            this.scrollIntoView(selectedMedia);
          }
        }
      }

      scrollIntoView(selectedMedia) {
        selectedMedia.scrollIntoView({
          behavior: "smooth",
        });
      }
    }
  );
}
