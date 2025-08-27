class CompareProduct {
  constructor() {
    this.storageKey = 'm-compare-products'
    this.products = []
    this.productNodes = {}

    this.pageTemplate = 'page.product-compare'
    this.addedClass = 'added-to-compare'
    this.selectors = {
      container: '.m-compare-page-content__wrapper',
      noProducts: '.m-compare-no-products',
      wrapper: '.m-compare-card',
      item: '.m-product-card',
      compareButton: '.m-compare-button',
      compareText: '.m-compare-button-text',
      removeButton: '.m-compare-remove-button',
      count: '.m-compare-count'
    }
    this.products = Array.from(new Set(Array.from(JSON.parse(localStorage.getItem(this.storageKey)) || [])));
    this.isComparePage = MinimogSettings.template === this.pageTemplate;
    this.init()
  }

  init = () => {
    if (this.isComparePage) {
      this.renderComparePage();
      this.addEventToRemoveButtons();
    }
    this.setCompareButtonsState();
    this.addEventToCompareButtons();
    this.updateCompareCount();
  }

  saveToStorage = () => {
    this.products = Array.from(new Set(this.products))
    localStorage.setItem(this.storageKey, JSON.stringify(this.products))
  }

  addToCompare(handle) {
    if (handle && this.products.indexOf(handle) === -1) {
      this.products.push(handle)
      this.saveToStorage()
    }
  }

  removeFromCompare(handle) {
    this.products = this.products.filter(hdl => hdl !== handle)
    this.saveToStorage()
  }

  setCompareButtonsState = () => {
    const buttons = document.querySelectorAll(this.selectors.compareButton)
    buttons.forEach(btn => {
      const prodHandle = btn && btn.dataset.productHandle
      if (this.products.indexOf(prodHandle) >= 0 && btn && !btn.classList.contains(this.addedClass)) {
        this.toggleButtonState(btn, true)
      }
    })
  }

  updateCompareCount = () => {
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
  }

  addEventToCompareButtons = () => {
    addEventDelegate({
      selector: this.selectors.compareButton,
      handler: (e, btn) => {
        e.preventDefault()
        const productHandle = btn && btn.dataset.productHandle
        if (productHandle) {
          const active = !btn.classList.contains(this.addedClass)
          this.toggleButtonState(btn, active)
          this.updateCompareCount();
          document.querySelectorAll(this.selectors.compareButton).forEach(btnItem => {
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
    const compareText = btn && btn.querySelector(this.selectors.compareText)

    if (active) {
      this.addToCompare(productHandle)
      btn.classList.add(this.addedClass)
    } else {
      this.removeFromCompare(productHandle)
      btn.classList.remove(this.addedClass)
    }

    if (compareText) {
      const temp = compareText.dataset.revertText
      compareText.dataset.revertText = compareText.textContent
      compareText.textContent = temp
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
          this.removeFromCompare(productHandle)
          this.updateCompareCount()
          if (!this.products.length) {
            this.showNoProductsMessage()
          }
        }
      }
    })
  }

  renderComparePage = async () => {
    const container = document.querySelector(this.selectors.container)
    if (container) {
      let noItemAvailable = true

      if (this.products.length) {
        const promises = this.products.map(async hdl => {
          const prodHTML = await fetchCache(`/products/${hdl}?view=compare`)
          const item = document.createElement("DIV");
          item.classList.add("m:hidden", "m:column", "m-compare-card");
          item.innerHTML = prodHTML
          if (item.querySelector(this.selectors.item)) {
            noItemAvailable = false
            this.productNodes[hdl] = item
          }
        })

        await Promise.all(promises)

        // Render in order
        this.products.forEach(hdl => {
          const prodNode = this.productNodes[hdl]
          if (prodNode) {
            container.appendChild(prodNode)
            prodNode.classList.remove('m:hidden')
          }
        })
      }

      if (noItemAvailable) {
        this.showNoProductsMessage()
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

MinimogTheme.CompareProduct = new CompareProduct()

