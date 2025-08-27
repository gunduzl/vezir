if (!customElements.get("quantity-popover")) {
  customElements.define(
    "quantity-popover",
    class QuantityPopover extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        this.init();
      }

      init() {
        this.popoverInfoButton = this.querySelector(".quantity-popover__button");
        this.popoverInfo = this.querySelector(".quantity-popover__wrapper");
        this.closeButton = this.querySelector(".quantity-popover__close");

        // Only set up event listeners if elements exist
        if (this.popoverInfoButton && this.popoverInfo) {
          if (this.closeButton) {
            this.closeButton.addEventListener("click", this.closePopover.bind(this));
          }

          this.popoverInfoButton.addEventListener("click", this.togglePopover.bind(this));

          // Add click outside handler
          this.handleClickOutside = this.handleClickOutside.bind(this);
          document.addEventListener("click", this.handleClickOutside);
        }
      }

      togglePopover(event) {
        event.preventDefault();
        const isOpen = this.popoverInfoButton.classList.contains("open");
        this.popoverInfoButton.classList.toggle("open", !isOpen);
        this.popoverInfo.toggleAttribute("hidden");
      }

      closePopover(event) {
        event.preventDefault();
        this.popoverInfo.setAttribute("hidden", "");
        this.popoverInfoButton.classList.remove("open");
      }

      // Add new method to handle clicks outside
      handleClickOutside(event) {
        if (!this.contains(event.target) && this.popoverInfoButton.classList.contains("open")) {
          this.closePopover(event);
        }
      }
    }
  );
}
