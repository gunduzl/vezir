if (!customElements.get("m-scrolling-promotion")) {
  class MScrollingPromotion extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.promotion = this.querySelector(".m-promotion");
      this.init();
    }

    init() {
      if (this.childElementCount === 1) {
        this.promotion.classList.add("m-promotion--animated");

        for (let index = 0; index < 10; index++) {
          this.clone = this.promotion.cloneNode(true);
          this.clone.setAttribute("aria-hidden", true);
          this.appendChild(this.clone);
        }

        // pause when out of view
        const observer = new IntersectionObserver(
          (entries, _observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.scrollingPlay();
              } else {
                this.scrollingPause();
              }
            });
          },
          { rootMargin: "0px 0px 50px 0px" }
        );

        observer.observe(this);
      }
    }

    scrollingPlay() {
      this.classList.remove("m-scrolling-promotion--paused");
    }

    scrollingPause() {
      this.classList.add("m-scrolling-promotion--paused");
    }
  }

  customElements.define("m-scrolling-promotion", MScrollingPromotion);
}
