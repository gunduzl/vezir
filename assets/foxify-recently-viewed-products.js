if (!customElements.get('f-recently-viewed-products')) {
  customElements.define('f-recently-viewed-products', class RecentlyViewedProducts extends HTMLElement {
    constructor() {
      super();

      this.productNodes = {}
      this.maxLimit = Number(this.dataset.maxLimit)
      this.productContainer = this.querySelector('[data-product-container]')
      this.swiperContainer = this.querySelector('f-swiper-component')
      const products = localStorage.getItem('foxify:recently-viewed')
      this.products = products ? Array.from(new Set(JSON.parse(products))).reverse() : []

      if (products) {
        this.removeAttribute('hidden')
        this.init()
      }
    }

    init() {
      const handleIntersection = (entries, observer) => {
        if (!entries[0].isIntersecting) return;
        observer.unobserve(this);

        this.fetchProducts()
      }

      new IntersectionObserver(handleIntersection.bind(this), {rootMargin: '0px 0px 400px 0px'}).observe(this);
    }

    async fetchProducts() {
      const promises = this.products.map(async handle => {
        const productUrl = `${window.Foxify.Settings.routes.base_url}products/${handle}`
        const prodHTML = await Foxify.Utils.fetchSection('foxify-product-card-section', {url: productUrl}).catch(() => {})
        if (prodHTML) {
          this.productNodes[handle] = prodHTML.querySelector('.f\\:column')
        }
      })

      await Promise.all(promises)

      await this.renderProducts()
    }

    renderProducts() {
      this.products.slice(0, this.maxLimit).forEach(hdl => {
        const node = this.productNodes[hdl]
        if (node) {
          try {
            this.productContainer && this.productContainer.appendChild(node)
            if (this.swiperContainer && this.swiperContainer.swiper) {
              const slide = node.cloneNode(true)
              const div = document.createElement('div')
              div.classList.add('f:swiper-slide')
              div.appendChild(slide)
              this.swiperContainer.querySelector('.f\\:swiper-wrapper').appendChild(div)
            }
          } catch (error) {
            console.log(error, 'error')
          }
        }
      })
      this.swiperContainer?.swiper && this.swiperContainer.swiper.updateSlides()
    }
  });
}
