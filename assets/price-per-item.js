if (!customElements.get('price-per-item')) {
  customElements.define(
    'price-per-item',
    class PricePerItem extends HTMLElement {
      updatePricePerItemUnsubscriber = undefined;
      variantIdChangedUnsubscriber = undefined;

      constructor() {
        super();
      }

      get sectionId() {
        return this.getAttribute('data-section-id');
      }

      get productId() {
        return this.getAttribute('data-product-id');
      }

      connectedCallback() {
        this.init();
      }

      disconnectedCallback() {
        if (this.updatePricePerItemUnsubscriber) {
          this.updatePricePerItemUnsubscriber();
        }
        if (this.variantIdChangedUnsubscriber) {
          this.variantIdChangedUnsubscriber();
        }
      }

      init() {
        this.getVolumePricingArray();

        this.variantId = this.getAttribute('data-variant-id');
        this.input = document.querySelector(`[id^="QuantityForm-${this.sectionId}"] m-quantity-input input`);
        this.shouldSync = this.closest('.m-main-product--info') || this.closest('sticky-atc');

        if (this.input) {
          if (this.shouldSync) {
            window.addEventListener("syncProductQuantity", this.onInputChange.bind(this));
          } else {
            this.input.addEventListener('change', this.onInputChange.bind(this));
          }
        }

        // Update variantId if variant is switched on product page
        this.variantIdChangedUnsubscriber = MinimogEvents.subscribe(
          MinimogTheme.pubSubEvents.variantChange,
          (event) => {
            this.variantId = event.data.variant.id.toString();
            this.getVolumePricingArray(event.data.html);
          }
        );

        this.updatePricePerItemUnsubscriber = MinimogEvents.subscribe(
          MinimogTheme.pubSubEvents.cartUpdate,
          (response) => {
            if (!response.cart) return;

            // Item was added to cart via product page
            if (response.cart['variant_id'] !== undefined) {
              if (response.productVariantId === this.variantId) this.updatePricePerItem(response.cart.quantity);
              // Qty was updated in cart
            } else if (response.cart.item_count !== 0) {
              const isVariant = response.cart.items?.find((item) => item.variant_id.toString() === this.variantId);
              if (isVariant && isVariant.id.toString() === this.variantId) {
                // The variant is still in cart
                this.updatePricePerItem(isVariant.quantity);
              } else {
                // The variant was removed from cart, qty is 0
                this.updatePricePerItem(0);
              }
              // All items were removed from cart
            } else {
              this.updatePricePerItem(0);
            }
          }
        );
      }

      onInputChange() {
        this.updatePricePerItem();
      }

      updatePricePerItem(updatedCartQuantity) {
        if (this.input) {
          this.enteredQty = parseInt(this.input.value);
          this.step = parseInt(this.input.step);
        }

        // updatedCartQuantity is undefined when qty is updated on product page. We need to sum entered qty and current qty in cart.
        // updatedCartQuantity is not undefined when qty is updated in cart. We need to sum qty in cart and min qty for product.
        this.currentQtyForVolumePricing =
          updatedCartQuantity === undefined
            ? this.getCartQuantity(updatedCartQuantity) + this.enteredQty
            : this.getCartQuantity(updatedCartQuantity) + parseInt(this.step);

        if (this.classList.contains('variant-item__price-per-item')) {
          this.currentQtyForVolumePricing = this.getCartQuantity(updatedCartQuantity);
        }

        for (let pair of this.qtyPricePairs) {
          if (this.currentQtyForVolumePricing >= pair[0]) {
            const pricePerItemsCurrent = document.querySelectorAll(
              `price-per-item[id^="PricePerItem-${this.sectionId}"] .price-per-item--current`
            );
            pricePerItemsCurrent.forEach((pricePerItemCurrent) => {
              pricePerItemCurrent.innerHTML = pair[1];
            });
            break;
          }
        }
      }

      getCartQuantity(updatedCartQuantity) {
        return updatedCartQuantity || updatedCartQuantity === 0
          ? updatedCartQuantity
          : parseInt(this.input.dataset.cartQuantity);
      }

      getVolumePricingArray(html) {
        const context = html ? html : document;
        const volumePricing = context.getElementById(`Volume-${this.sectionId}`);
        this.qtyPricePairs = [];

        if (volumePricing) {
          volumePricing.querySelectorAll('li').forEach((li) => {
            const qty = parseInt(li.querySelector('span:first-child').textContent);
            const price = li.querySelector('span:not(:first-child):last-child').dataset.text;
            this.qtyPricePairs.push([qty, price]);
          });
        }
        this.qtyPricePairs.reverse();
      }
    }
  );
}