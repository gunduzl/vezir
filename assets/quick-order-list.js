if (!customElements.get("quick-order-list")) {
  customElements.define(
    "quick-order-list",
    class QuickOrderList extends HTMLFormElement {
      constructor() {
        super();
        this.bindEvents();
      }

      cartUpdateUnsubscriber = undefined;

      get sectionId() {
        return this.dataset.sectionId;
      }
      get productId() {
        return this.dataset.productId;
      }

      bindEvents() {
        this._handleGroupedSections = (event) => this.getSectionToBundle(event);
        document.addEventListener('cart:grouped-sections', this._handleGroupedSections);

        this.addEventListener('change', debounce(this.onChange.bind(this), 300));

        this.cartUpdateUnsubscriber = MinimogEvents.subscribe(MinimogTheme.pubSubEvents.cartUpdate, this.onCartUpdate.bind(this));
      }

      getSectionToBundle(event) {
        if (event.detail && Array.isArray(event.detail.sections)) {
          event.detail.sections.push(this.sectionId);
        }
      }

      disconnectedCallback() {
        if (this._handleGroupedSections) {
          document.removeEventListener('cart:grouped-sections', this._handleGroupedSections);
          this._handleGroupedSections = null;
        }
        if (this.cartUpdateUnsubscriber) {
          this.cartUpdateUnsubscriber();
          this.cartUpdateUnsubscriber = null;
        }
      }

      onChange(e) {
        const { target } = e;
        const variantId = target.dataset.variantId;
        this.updateItemQuantity(
          variantId,
          target.value,
          document.activeElement.getAttribute('name'),
          target
        );
      }

      updateItemQuantity(line, quantity, name, target) {
        const items = {};
        items[line] = quantity;
        this.updateCartItems(items, line, name, target);
      }

      /**
       * Update multiple cart items
       * @param {Object} items - Items to update
       * @param {string} line - Line item index
       * @param {string} name - Input name
       * @param {HTMLElement} target - Target element
       */
      updateCartItems(items, line, name, target) {
        this.toggleSpinner(line, true);

        const { routes } = window.MinimogSettings;

        let sectionsToBundle = [];
        document.documentElement.dispatchEvent(
          new CustomEvent('cart:grouped-sections', { bubbles: true, detail: { sections: sectionsToBundle } })
        );

        const body = JSON.stringify({
          updates: items,
          sections: sectionsToBundle
        });

        fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } })
          .then((response) => response.json())
          .then((response) => {
            if (response.errors) {
              this.toggleSpinner(line, false);
              if (target) {
                const quantityInput = target.closest('m-quantity-input');
                quantityInput.setValidity(response.errors);
              }
              return;
            }

            window.MinimogEvents.emit(MinimogTheme.pubSubEvents.cartUpdate, { source: 'quick-order-list', cart: response });
          })
          .catch((error) => {
            console.log(error);
          }).finally(() => {
            this.toggleSpinner(line, false);
          });
      }

      toggleSpinner(line, show) {
        const method = show ? "add" : "remove";
        const spinnerSelector = line ? `tr[data-variant-id="${line}"] .m-spinner-button` : '.m-quick-order-list__remove .m-spinner-button';
        const spinnerEls = this.querySelectorAll(spinnerSelector);

        const updateSpinner = (element) => {
          if (!element) return;
          element.classList[method]("m-spinner-loading");
        };

        if (spinnerEls) spinnerEls.forEach(updateSpinner);
      }

      onCartUpdate(event) {
        const sectionToRender = new DOMParser().parseFromString(event.cart.sections[this.sectionId], 'text/html');
        this.innerHTML = sectionToRender.querySelector(`#QuickOrderList-${this.sectionId}`).innerHTML;

        const newCartDrawer = new DOMParser().parseFromString(event.cart.sections['cart-drawer'], 'text/html');
        const cartDrawer = document.getElementById('MinimogCartDrawer');

        if (cartDrawer && newCartDrawer) {
          cartDrawer.querySelector('#MinimogCartDrawerBody').innerHTML = newCartDrawer.querySelector('#MinimogCartDrawerBody').innerHTML;
          cartDrawer.querySelector('#MinimogCartDrawerFooter').innerHTML = newCartDrawer.querySelector('#MinimogCartDrawerFooter').innerHTML;
        }

        document.dispatchEvent(
          new CustomEvent('cart:updated', {
            detail: {
              source: 'quick-order-list',
              cart: event.cart,
            },
          })
        );
      }
    }, { extends: 'form' }
  );
}

if (!customElements.get("quick-order-list-remove")) {
  customElements.define(
    "quick-order-list-remove",
    class QuickOrderListRemove extends HTMLAnchorElement {
      constructor() {
        super();
      }

      connectedCallback() {
        this.quickOrderList = this.closest('form[is="quick-order-list"]');
        this.handleClick = this.handleClick.bind(this);
        this.addEventListener('click', this.handleClick);
      }

      disconnectedCallback() {
        this.removeEventListener('click', this.handleClick);
      }

      handleClick(e) {
        e.preventDefault();
        this.quickOrderList.updateItemQuantity(this.dataset.variantId, 0);
      }
    }, { extends: 'a' }
  );
}

if (!customElements.get('quick-order-list-remove-all')) {
  customElements.define(
    'quick-order-list-remove-all',
    class QuickOrderListRemoveAll extends HTMLElement {
      static ACTIONS = {
        CONFIRM: 'confirm',
        REMOVE: 'remove',
        CANCEL: 'cancel',
      };

      static SELECTORS = {
        CONFIRMATION: '.m-quick-order-list__confirmation',
        INFO: '.m-quick-order-list__total-wrapper',
      };

      constructor() {
        super();
      }

      connectedCallback() {
        this.items = {};
        this.hasVariantsInCart = false;

        this.quickOrderList = this.closest('form[is="quick-order-list"]');
        this.inputs = this.quickOrderList.querySelectorAll('[data-cart-quantity]');
        this.handleClick = this.handleClick.bind(this);
        this.addEventListener('click', this.handleClick);
        this.processVariant();
      }

      processVariant() {
        this.inputs.forEach((input) => {
          const cartQuantity = parseInt(input.dataset.cartQuantity);
          const variantId = parseInt(input.dataset.variantId);

          if (cartQuantity > 0 && !isNaN(variantId)) {
            this.hasVariantsInCart = true;
            this.items[variantId] = 0;
          }
        });
      }

      /**
       * Handle button click events
       * @param {Event} event - Click event
       */
      handleClick(event) {
        try {
          event.preventDefault();
          const action = this.getAttribute('data-action');

          if (!action) {
            throw new Error('Missing data-action attribute');
          }

          this.handleAction(action);
        } catch (error) {
          console.error('Error handling click:', error);
        }
      }

      /**
       * Handle different button actions
       * @param {string} action - Action to perform
       */
      handleAction(action) {
        const actionHandlers = {
          [QuickOrderListRemoveAll.ACTIONS.CONFIRM]: () => {
            this.updateVisibility(false, true);
          },
          [QuickOrderListRemoveAll.ACTIONS.REMOVE]: () => {
            this.removeAllItems();
            this.updateVisibility(true, false);
          },
          [QuickOrderListRemoveAll.ACTIONS.CANCEL]: () => {
            this.updateVisibility(true, false);
          },
        };

        const handler = actionHandlers[action];
        if (handler) {
          handler();
        }
      }

      /**
       * Remove all items from cart
       */
      removeAllItems() {
        if (Object.keys(this.items).length > 0) {
          this.quickOrderList.updateCartItems(this.items);
        }
      }

      /**
       * Update visibility of confirmation and info sections
       * @param {boolean} showConfirmation - Show confirmation section
       * @param {boolean} showInfo - Show info section
       */
      updateVisibility(showConfirmation, showInfo) {
        const confirmation = this.quickOrderList.querySelector(QuickOrderListRemoveAll.SELECTORS.CONFIRMATION);
        const info = this.quickOrderList.querySelector(QuickOrderListRemoveAll.SELECTORS.INFO);

        if (confirmation && info) {
          confirmation.classList.toggle('m:hidden', showConfirmation);
          info.classList.toggle('m:hidden', showInfo);
        }
      }

      /**
       * Clean up when element is removed
       */
      disconnectedCallback() {
        this.removeEventListener('click', this.handleClick);
      }
    }
  );
}