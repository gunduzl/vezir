if (!customElements.get("m-brand-list")) {
  class MBrandList extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      const enableSlider = this.dataset.enableSlider === "true";
      if (!enableSlider) return;
      const wrapper = this.querySelector("[data-wrapper]");
      wrapper.classList.add("swiper-wrapper");
      this.initSlider();
    }

    initSlider() {
      const autoplay = this.dataset.enableAutoplay === "true";
      const autoplaySpeed = this.dataset.autoplaySpeed;
      const items = parseInt(this.dataset.items);
      const slideContainer = this.querySelector(".swiper-container");
      if (slideContainer) {
        this.slider = new MinimogLibs.Swiper(slideContainer, {
          slidesPerView: 2,
          slidesPerGroup: 1,
          autoplay: autoplay
            ? {
                delay: parseInt(autoplaySpeed) * 1000,
              }
            : false,
          loop: true,
          navigation: {
            nextEl: this.querySelector(".swiper-button-next"),
            prevEl: this.querySelector(".swiper-button-prev"),
          },
          pagination: {
            el: this.querySelector(".swiper-pagination"),
            clickable: true,
          },
          breakpoints: {
            768: {
              slidesPerView: items > 3 ? 3 : items,
            },
            1024: {
              slidesPerView: items,
            },
          },
        });
      }
    }
  }

  customElements.define("m-brand-list", MBrandList);
}
