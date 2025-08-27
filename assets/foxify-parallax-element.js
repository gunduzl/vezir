if (!customElements.get('f-parallax-element')) {
  customElements.define('f-parallax-element', class FoxifyParallaxElement extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.image = this.querySelector('img')
      if (this.image) {
        window.Foxify.Utils.loadAssets([window.Foxify.Libs.parallax], 'foxify-parallax-element', this.init.bind(this))
      }
    }

    disconnectedCallback() {
      this.parallax && this.parallax.destroy();
    }

    init() {
      const speed = this.dataset.speed ? parseInt(this.dataset.speed) : -2;
      this.parallax = new Foxify.RellaxParallax(this.image, {
        speed,
        vertical: true,
        horizontal: false,
        center: true,
      });
    }
  })
}