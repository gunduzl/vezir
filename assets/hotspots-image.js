if (!customElements.get("m-hotspot")) {
  class Hotspot extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.selectors = {
        wrapper: ".m-hotspots-image__wrapper",
        card: ".m-hotspot__card",
      };

      this.domNodes = queryDomNodes(this.selectors, this)
      this.wrapper = this.closest(this.selectors.wrapper)
      this.card = this.domNodes.card

      this.init()
      document.addEventListener("matchMobile", () => {
        this.init()
      });
      document.addEventListener("unmatchMobile", () => {
        this.init()
      });
      this.addEventListener('mouseover', this.init.bind(this))
    }

    disconnectedCallback() {
      this.removeEventListener('mouseover', this.init.bind(this))
    }

    init() {
      this.wrapperOffsetX = this.wrapper.getBoundingClientRect().left
      this.wrapperOffsetY = this.wrapper.getBoundingClientRect().top

      this.offsetX = this.getBoundingClientRect().left - this.wrapperOffsetX
      this.offsetY = this.getBoundingClientRect().top - this.wrapperOffsetY

      this.width = this.clientWidth
      this.cardWidth = this.card.clientWidth
      this.cardHeight = this.card.clientHeight
      this.wrapperWidth = this.wrapper.clientWidth
      this.wrapperHeight = this.wrapper.clientHeight

      this.cardPosition = this.offsetY > this.cardHeight ? 'top' : 'bottom'

      if ((this.offsetX + this.width) > this.cardWidth) {
        this.cardPosition += '-left'
      } else if ((this.wrapperWidth - this.offsetX) > this.cardWidth) {
        this.cardPosition += '-right'
      }

      this.dataset.cardPosition = this.cardPosition

      switch (this.cardPosition) {
        case 'top-left':
          this.card.style.bottom = 'calc(100% + 20px)'
          this.card.style.right = '-20px'
          this.card.style.top = 'auto'
          this.card.style.left = 'auto'
          this.card.style.marginLeft = '0px'
          break;
        case 'top-right':
          this.card.style.bottom = 'calc(100% + 20px)'
          this.card.style.left = '-20px'
          this.card.style.top = 'auto'
          this.card.style.right = 'auto'
          this.card.style.marginLeft = '0px'
          break;
        case 'bottom-left':
          this.card.style.top = 'calc(100% + 20px)'
          this.card.style.right = '-20px'
          this.card.style.bottom = 'auto'
          this.card.style.left = 'auto'
          this.card.style.marginLeft = '0px'
          break;
        case 'bottom-right':
          this.card.style.top = 'calc(100% + 20px)'
          this.card.style.left = '-20px'
          this.card.style.bottom = 'auto'
          this.card.style.right = 'auto'
          this.card.style.marginLeft = '0px'
          break;
        case 'bottom':
          this.card.style.top = 'calc(100% + 20px)'
          this.card.style.left = '50%'
          this.card.style.bottom = 'auto'
          this.card.style.right = 'auto'
          this.card.style.marginLeft = `${-1 * this.cardWidth / 2}px`
          break;
        case 'top':
          this.card.style.bottom = 'calc(100% + 20px)'
          this.card.style.left = '50%'
          this.card.style.top = 'auto'
          this.card.style.right = 'auto'
          this.card.style.marginLeft = `${-1 * this.cardWidth / 2}px`
          break;
        default:
      }
    }
  }
  customElements.define("m-hotspot", Hotspot);
}