if (!customElements.get("m-sharing")) {
  customElements.define(
    "m-sharing",
    class MSharing extends HTMLElement {
      constructor() {
        super();
        this.selectors = {
          shareContent: ".m-product-addon--sharing",
          openBtn: "[data-open-share]",
        };
      }

      connectedCallback() {
        this.domNodes = queryDomNodes(this.selectors, this);
        const { shareContent } = this.domNodes;
        if (shareContent && shareContent.innerHTML) {
          this.shareContent = shareContent.innerHTML;
          this.init();
        }
      }

      init() {
        this.domNodes.openBtn && this.domNodes.openBtn.classList.remove("m:hidden");
        this.modal = new MinimogTheme.Modal();
        addEventDelegate({
          selector: this.selectors.openBtn,
          handler: (e) => {
            e.preventDefault();
            if (this.shareContent) {
              const html = document.createElement("DIV");
              html.classList.add('m-sharing__content');
              html.innerHTML = this.shareContent;
              this.modal.appendChild(html);
              const colorScheme = html.querySelector('[data-color-scheme]') && html.querySelector('[data-color-scheme]').dataset.colorScheme;
              this.modal.setSizes(`m-sharing m-gradient ${colorScheme}`);
              this.modal.open();
            }
          },
        });
      }
    }
  );
}
