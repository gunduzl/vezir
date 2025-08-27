if (!customElements.get("m-announcement-bar")) {
  class MAnnouncementBar extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      const enableSlider = this.dataset.enableSlider === "true";
      if (!enableSlider) return;
      this.initSlider();
    }

    initSlider() {
      const autoplay = this.dataset.enableAutoplay === "true";
      const autoplaySpeed = this.dataset.autoplaySpeed;
      const slideContainer = this.querySelector(".swiper-container");
      if (slideContainer) {
        this.slider = new MinimogLibs.Swiper(slideContainer, {
          slidesPerView: 1,
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
        });
      }
    }
  }

  customElements.define("m-announcement-bar", MAnnouncementBar);
}
