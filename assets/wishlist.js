class Wishlist {
  constructor() {
    this.isWishlistPage = false
    this.storageKey = 'm-wishlist-products'
    this.products = []
    this.productNodes = {}

    this.pageTemplate = 'page.wishlist'
    this.addedClass = 'added-to-wishlist'
    this.hasItemClass = 'wishlist-has-item'
    this.selectors = {
      container: '.m-wishlist-page-content__wrapper',
      noProducts: '.m-wishlist-no-products',
      wrapper: '.m-wishlist-card',
      productCard: '.m-product-card',
      wishlistButton: '.m-wishlist-button',
      wishlistText: '.m-wishlist-button-text',
      removeButton: '.m-wishlist-remove-button',
      count: '.m-wishlist-count'
    }
    this.products = Array.from(new Set(Array.from(JSON.parse(localStorage.getItem(this.storageKey)) || [])))
    this.isWishlistPage = MinimogSettings.template === this.pageTemplate
    this.init()
  }

  init = async () => {
    if (this.isWishlistPage) {
      await this.renderWishlistPage()
      this.addEventToRemoveButtons()
    }
    this.setWishlistButtonsState()
    this.addEventToWishlistButtons()
    this.updateWishlistCount()
  }

  saveToStorage = () => {
    this.products = Array.from(new Set(this.products))
    localStorage.setItem(this.storageKey, JSON.stringify(this.products))
  }

  addToWishlist(handle) {
    if (handle && this.products.indexOf(handle) === -1) {
      this.products.push(handle)
      this.saveToStorage()
    }
  }

  removeFromWishlist(handle) {
    this.products = this.products.filter(hdl => hdl !== handle)
    this.saveToStorage()
  }

  setWishlistButtonsState = () => {
    const buttons = document.querySelectorAll(this.selectors.wishlistButton)
    buttons.forEach(btn => {
      const prodHandle = btn && btn.dataset.productHandle
      if (this.products.indexOf(prodHandle) >= 0 && btn && !btn.classList.contains(this.addedClass)) {
        this.toggleButtonState(btn, true)

        if (this.isWishlistPage) {
          btn.classList.remove(this.selectors.wishlistButton.replace('.', ''))
          btn.classList.add(this.selectors.removeButton.replace('.', ''))
        }
      }
    })
  }

  updateWishlistCount = () => {
    const size = this.products.length
    const countElems = document.querySelectorAll(this.selectors.count);
    [...countElems].forEach(elem => {
      elem.textContent = size
      if (size < 1) {
        elem.classList.add('m:hidden')
      } else {
        elem.classList.remove('m:hidden')
      }
    })
    const method = size ? 'add' : 'remove'
    document.body.classList[method](this.hasItemClass)
  }

  addEventToWishlistButtons = () => {
    addEventDelegate({
      selector: this.selectors.wishlistButton,
      handler: (e, btn) => {
        e.preventDefault()
        const productHandle = btn && btn.dataset.productHandle
        if (productHandle) {
          const active = !btn.classList.contains(this.addedClass)
          this.toggleButtonState(btn, active)
          this.updateWishlistCount()

          document.querySelectorAll(this.selectors.wishlistButton).forEach(btnItem => {
            if (btnItem && btnItem.dataset.productHandle === productHandle && btnItem !== btn) {
              const isAdded = !btnItem.classList.contains(this.addedClass)
              this.toggleButtonState(btnItem, isAdded)
            }
          })
        }
      }
    })
  }

  toggleButtonState = (btn, active) => {
    const productHandle = btn && btn.dataset.productHandle
    const wishlistText = btn && btn.querySelector(this.selectors.wishlistText)

    if (active) {
      this.addToWishlist(productHandle)
      btn.classList.add(this.addedClass)
    } else {
      this.removeFromWishlist(productHandle)
      btn.classList.remove(this.addedClass)
    }

    if (wishlistText) {
      const temp = wishlistText.dataset.revertText
      wishlistText.dataset.revertText = wishlistText.textContent
      wishlistText.textContent = temp
    }
  }

  addEventToRemoveButtons = () => {
    addEventDelegate({
      selector: this.selectors.removeButton,
      handler: (e, btn) => {
        e.preventDefault()
        const prod = btn && btn.closest(this.selectors.wrapper)
        prod && prod.remove()

        const productHandle = btn && btn.dataset.productHandle
        if (productHandle) {
          this.removeFromWishlist(productHandle)
          this.updateWishlistCount()
          if (!this.products.length) {
            this.showNoProductsMessage()
          }
        }
      }
    })
  }

  wishlistRemoveButton(prdHandle) {
    const html = `<svg class="m-svg-icon--medium" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
    const button = document.createElement("DIV");
    button.classList.add("m-tooltip", "m-wishlist-remove-button", "m:block", "md:m:hidden");
    button.setAttribute("data-product-handle", prdHandle);
    button.innerHTML = html;
    return button;
  }

  renderWishlistPage = async () => {
    const container = document.querySelector(this.selectors.container)
    if (container) {
      let noItemAvailable = true
      if (this.products.length) {
        const promises = this.products.map(async hdl => {
          const url = formatUrl('products', hdl, 'view=grid-card-item')
          const prodHTML = await fetchCache(url)
          const item = document.createElement("DIV");
          item.classList.add("m:hidden", "m:column", "m-wishlist-card");
          item.innerHTML = prodHTML
          if (item.querySelector(this.selectors.productCard)) {
            noItemAvailable = false
            item.appendChild(this.wishlistRemoveButton(hdl));
            this.productNodes[hdl] = item
          }
        })

        await Promise.all(promises)

        // Render in order
        this.products.forEach(hdl => {
          const prod = this.productNodes[hdl]
          if (prod) {
            container.appendChild(prod)

            if (MinimogTheme.CompareProduct) {
              MinimogTheme.CompareProduct.setCompareButtonsState();
            }

            prod.classList.remove('m:hidden');
          }
        })
      }

      if (noItemAvailable) {
        this.showNoProductsMessage()
      } else {
        this.setWishlistButtonsState()
      }

      container.classList.add('is-visible')
    }
  }

  showNoProductsMessage = () => {
    const container = document.querySelector(this.selectors.container)
    const noProducts = document.querySelector(this.selectors.noProducts)

    container.classList.add('m:hidden')
    noProducts.classList.remove('m:hidden')
  }
}

MinimogTheme.Wishlist = new Wishlist()