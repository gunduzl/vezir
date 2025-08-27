if (!customElements.get("m-image-comparison")) {
  class MImageComparison extends HTMLElement {
    constructor() {
      super();
      this.active = false;
      this.button = this.querySelector("button");
      this.horizontal = this.dataset.layout === "horizontal";
      this.init();
      if (this.hasAttribute("data-animation")) {
        MinimogTheme.initWhenVisible({
          element: this.querySelector(".m-image-comparison__slider-animation"),
          callback: this.animation.bind(this),
          threshold: 0,
        });
      }
    }

    init() {
      this.button.addEventListener("touchstart", this.start.bind(this));
      document.body.addEventListener("touchend", this.end.bind(this));
      document.body.addEventListener("touchmove", this.onStart.bind(this));

      this.button.addEventListener("mousedown", this.start.bind(this));
      document.body.addEventListener("mouseup", this.end.bind(this));
      document.body.addEventListener("mousemove", this.onStart.bind(this));
    }

    animation() {
      this.setAttribute("is-visible", "");
      this.classList.add("m-animating");
      setTimeout(() => {
        this.classList.remove("m-animating");
      }, 1e3);
    }

    start() {
      document.documentElement.classList.add("prevent-scroll");
      this.active = true;
      this.classList.add("image-comparing");
    }

    end() {
      document.body.style.removeProperty("padding-right");
      document.documentElement.classList.remove("prevent-scroll");
      this.active = false;
      this.classList.remove("image-comparing");
    }

    onStart(e) {
      if (!this.active) return;
      const event = (e.touches && e.touches[0]) || e;
      const x = this.horizontal ? event.pageX - this.offsetLeft : event.pageY - this.offsetTop;
      this.scroll(x);
    }

    scroll(x) {
      const distance = this.horizontal ? this.clientWidth : this.clientHeight;
      const max = distance - 20;
      const min = 20;
      const mouseX = Math.max(min, Math.min(x, max));
      const mousePercent = (mouseX * 100) / distance;
      this.style.setProperty("--percent", mousePercent + "%");
    }
  }
  customElements.define("m-image-comparison", MImageComparison);
}
