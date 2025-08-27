if (!customElements.get("m-image-layer")) {
  class MImageLayer extends HTMLElement {
    constructor() {
      super();
      this.enableParallax = false;
    }

    connectedCallback() {
      this.enableParallax = this.dataset.enableParallax === "true";
      if (this.enableParallax) {
        this.initElements();
        MinimogTheme.Motion.inView(this, this.initAnimations.bind(this));
      }
    }

    initElements() {
      this.firstImage = this.querySelector(".m-image-with-text__image-first");
      this.secondImage = this.querySelector(".m-image-with-text__image-second");

      if (!this.firstImage || !this.secondImage) {
        console.error("MImageLayer: Required elements not found.");
        return;
      }
    }

    initAnimations() {
      this.animateElement(this.secondImage, [`translateY(30%)`, `translateX(0)`]);
      this.animateElement(this.firstImage, [`translateY(-5%)`, `translateX(0)`]);
    }

    animateElement(element, transforms) {
      MinimogTheme.Motion.scroll(
        MinimogTheme.Motion.animate(element, { transform: transforms }, { easing: "linear" }),
        {
          target: element,
          offset: ["start end", "end start"],
        }
      );
    }
  }

  customElements.define("m-image-layer", MImageLayer);
}
