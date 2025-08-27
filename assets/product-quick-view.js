const { MinimogThemeStyles, MinimogThemeScripts } = window;

class QuickView {
  constructor() {
    this.modal = new MinimogTheme.Modal();
    this.isOpen = false;
    this.isLoading = false;

    // Event delegation for quick view button
    addEventDelegate({
      selector: ".m-product-quickview-button",
      handler: (e, target) => {
        e.preventDefault();
        if (this.isLoading) return;
        this.target = target;
        this.toggleLoading(true);
        const productHandle = target.dataset.productHandle;
        if (productHandle) this.loadProductQuickView(productHandle);
      },
    });

    // Subscribe to cart update events
    window.MinimogEvents.subscribe(MinimogTheme.pubSubEvents.cartUpdate, () => {
      if (this.modal) this.modal.close();
    });
    window.MinimogEvents.subscribe('ON_MODAL_CLOSED', (modal) => {
      this.close();
    });
  }

  // Load product quick view HTML
  loadProductQuickView(productHandle) {
    if (this.isOpen) {
      this.modal && this.modal.close(); // Close any existing modal before loading a new one
    }
    this.isLoading = true;
    fetchSection("product-quickview", { url: `${window.MinimogSettings.base_url}products/${productHandle}` })
      .then((html) => {
        this.modalContent = html.querySelector("#MainProduct-quick-view__content");
        const productInfo = html.querySelector("product-info");
        const colorScheme = productInfo.dataset.colorScheme;
        this.modal.appendChild(this.modalContent);
        this.modal.setWidth("960px");

        const sectionWrapper = this.modal.modal.querySelector('#MainProduct-quick-view__content');

        sectionWrapper.querySelectorAll('script').forEach((oldScriptTag) => {
          const newScriptTag = document.createElement('script');
          Array.from(oldScriptTag.attributes).forEach((attribute) => {
            newScriptTag.setAttribute(attribute.name, attribute.value);
          });
          newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
          oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
        });

        this.modal.open();
        this.modal.setSizes(`m-gradient ${colorScheme}`);

        this.toggleLoading(false);
        this.isOpen = true;
        this.isLoading = false; // Reset loading state
      })
      .then(() => {
        document.dispatchEvent(
          new CustomEvent('tcustomizer-custom-show-quick-view', {
            detail: { productHandle: this.target.dataset.productHandle }
          })
        );

        document.dispatchEvent(
          new CustomEvent("quick-view:loaded", {
            detail: { productUrl: this.target.dataset.productHandle }
          })
        );
      })
      .catch((error) => {
        console.error("Error loading product quick view:", error);
      });
  }

  // Close the quick view modal
  close() {
    this.isOpen = false;
  }

  // Toggle loading spinner on the target element
  toggleLoading(isLoading) {
    if (isLoading) {
      this.target.classList.add("m-spinner-loading");
    } else {
      this.target.classList.remove("m-spinner-loading");
    }
  }
}

// Initialize the QuickView instance
MinimogTheme.ProductQuickView = new QuickView();
