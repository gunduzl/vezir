class FoxkitFlashSale {
  constructor() {
    this.selectors = {
      productsContainer: '#CollectionProductGrid',
      products: ['.m-product-card'],
      flashSale: '.foxkit-flashsale'
    }
    this.domNodes = queryDomNodes(this.selectors)
    const collectionID = this.domNodes.productsContainer && this.domNodes.productsContainer.dataset.collectionId;
    if (collectionID) this.initFlashSale(collectionID)
  }

  async initFlashSale(collectionID) {
    const res = await fetchCountDown(collectionID)
    if (res.ok && res.payload) {
      this.settings = res.payload[0]
      this.initCountdown()
      const {expires_date} = this.settings
      this.expires_date = expires_date

      if (new Date(expires_date).getTime() < Date.now()) {
        this.domNodes.flashSale && this.domNodes.flashSale.classList.add('m\:hidden');
      }

      this.domNodes.flashSale && this.domNodes.flashSale.classList.remove('m\:hidden');
      const products = this.domNodes.productsContainer.querySelectorAll(this.selectors.products)

      products.forEach(card => {
        const saleProgressEl = card.querySelector('.m-product-sale-progress');
        if (saleProgressEl) return;
        const content = card.querySelector('.m-product-card__content')
        const soldNumber = card.dataset.soldNumber
        const component = saleProgress(this.settings, card.dataset.productId, soldNumber);
        const newComponent = generateDomFromString(component);
        content.appendChild(newComponent)
      })
    }
  }

  initCountdown() {
    this.domNodes.flashSale && this.domNodes.flashSale.classList.add(this.settings && this.settings.cdt_style)
    this.Countdown = new MinimogTheme.FoxkitFlashSaleCountdown(this.settings)
    if (this.Countdown && this.Countdown.ended) {
      this.domNodes.flashSale && this.domNodes.flashSale.classList.add('m\:hidden');
    } 
  }
}

new FoxkitFlashSale();