if (!customElements.get("m-ask-question")) {
  customElements.define(
    "m-ask-question",
    class MAskQuestion extends HTMLElement {
      constructor() {
        super()
        this.selectors = {
          openButton: '[data-open-ask-question]',
          content: '.m-form-ask-question',
          container: '.m-product-addon',
          formSuccess: '.form-ask__success'
        }
      }

      connectedCallback() {
        this.domNodes = queryDomNodes(this.selectors, this);
        this.container = document.querySelector(this.selectors.container);
        this.colorScheme = this.domNodes.content.dataset.colorScheme;
        if (this.domNodes.content && this.domNodes.content.innerHTML) {
          this.content = this.domNodes.content.innerHTML;
          this.init();
        }
      }

      init() {
        this.showSuccessMessage();
        this.modal = new MinimogTheme.Modal();
        addEventDelegate({
          selector: this.selectors.openButton,
          handler: (e) => {
            e.preventDefault()
            if (this.content) {
              const html = document.createElement("DIV");
              html.innerHTML = this.content;
              this.modal.appendChild(html);
              this.modal.setWidth('500px');
              this.modal.setSizes(`m-form-ask-question m-gradient ${this.colorScheme}`);
              this.container.classList.remove('m\:hidden');
              this.modal.open();
            }
          }
        })
      }
      showSuccessMessage() {
        const successMessage = this.container.querySelector(this.selectors.formSuccess);
        if (successMessage) {
          MinimogTheme.Notification.show({
            target: document.body,
            method: 'appendChild',
            type: 'success',
            message: successMessage.dataset.message,
            delay: 2000,
            sticky: true
          })

          setTimeout(() => {
            const url = window.location.origin + window.location.pathname
            window.history.replaceState({}, document.title, url)
          }, 2500)
        }
      }
    }
  );
}