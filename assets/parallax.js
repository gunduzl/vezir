if (!customElements.get("m-parallax")) {
  class MParallax extends HTMLElement {
    constructor() {
      super();
      this.image = this.querySelector('.m-parallax__image')
      this.enableParallax = this.dataset.enableParallax === 'true'
      this.parallax = this.dataset.parallax ? parseFloat(this.dataset.parallax) : 0.3
      this.direction = this.dataset.direction || 'vertical'

      this.enableParallax && MinimogTheme.Motion.inView(this, this.init.bind(this));
    }

    init() {
      const [scale, translate] = [1 + this.parallax, this.parallax * 100 / (1 + this.parallax)];
      this.scale = this.dataset.scale ? parseFloat(this.dataset.scale) : scale
      this._translate = this.dataset.translate ? parseFloat(this.dataset.translate) : translate

      if (this.direction === 'zoom') {
        MinimogTheme.Motion.scroll(
          MinimogTheme.Motion.animate(
            this.image,
            { transform: [`scale(1)`, `scale(${this.scale})`], transformOrigin: ['center', 'center'] },
            { easing: 'linear' }
          ),
          { target: this, offset: ['start end', 'end start'] }
        );
      }
      else if (this.direction === 'horizontal') {
        MinimogTheme.Motion.scroll(
          MinimogTheme.Motion.animate(
            this.image,
            { transform: [`scale(${this.scale}) translateX(0)`, `scale(${this.scale}) translateX(${this._translate}%)`], transformOrigin: ['right', 'right'] },
            { easing: 'linear' }
          ),
          { target: this, offset: ['start end', 'end start'] }
        );
      }
      else {
        MinimogTheme.Motion.scroll(
          MinimogTheme.Motion.animate(
            this.image,
            { transform: [`scale(${this.scale}) translateY(0)`, `scale(${this.scale}) translateY(${this._translate}%)`], transformOrigin: ['bottom', 'bottom'] },
            { easing: "linear" }
          ),
          { target: this, offset: ['start end', 'end start'] }
        );
      }
    }
  }

  customElements.define("m-parallax", MParallax);
}
