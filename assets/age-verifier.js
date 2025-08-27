class AgeVerifierPopup extends HTMLElement {
  constructor() {
    super();
    this.cookieName = `Minimog:age-verifier-${this.id}`;
    this.cookie = getCookie(this.cookieName);

    this.modal = this.querySelector(".m-modal");
    this.modalContent = this.modal.querySelector(".m-modal--content");

    this.declineButton = this.querySelector("[data-age-verifier-decline-button]");
    this.declineContent = this.querySelector("[data-age-verifier-decline-content]");
    this.content = this.querySelector("[data-age-verifier-content]");

    this.agreeButton = this.querySelector("[data-age-verifier-agree-button]");
    this.returnButton = this.querySelector("[data-age-verifier-return-button]");

    if (this.cookie === "" && this.dataset.enable === "true") {
      if (Shopify && Shopify.designMode) return;
      this.openPopup();

      // Check session storage if user was editing on the second view
      const secondViewVisited = sessionStorage.getItem(this.id);
      if (!secondViewVisited) return;

      this.showDeclineContent();
    }
  }

  connectedCallback() {
    if (this.declineButton) {
      this.declineButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.showDeclineContent();
        sessionStorage.setItem(this.id, "age-second-view");
      });
    }

    if (this.returnButton) {
      this.returnButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.hideDeclineContent();

        const secondViewVisited = sessionStorage.getItem(this.id);

        if (secondViewVisited) {
          sessionStorage.removeItem(this.id);
        }
      });
    }

    if (this.agreeButton) {
      this.agreeButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.hideDeclineContent();

        // Set cookie when design mode disabled
        if (this.dataset.enable === "true") {
          setCookie(this.cookieName, "agreed", 30);
        }
        this.closePopup();
      });
    }

    if (Shopify.designMode) {
      document.addEventListener("shopify:section:select", this.__shopifySectionSelect.bind(this));
      document.addEventListener("shopify:section:load", this.__shopifySectionLoad.bind(this));
    }
  }

  disconnectedCallback() {
    if (Shopify.designMode) {
      document.removeEventListener("shopify:section:select", this.__shopifySectionSelect.bind(this));
      document.removeEventListener("shopify:section:load", this.__shopifySectionLoad.bind(this));
    }
  }

  __shopifySectionLoad(event) {
    if (event.detail.sectionId === this.dataset.sectionId && this.dataset.designMode === "true") {
      this.openPopup();

      // Check session storage if user was editing on the second view
      const secondViewVisited = sessionStorage.getItem(this.id);

      if (!secondViewVisited) return;

      this.showDeclineContent(event);
    }
  }

  __shopifySectionSelect(event) {
    if (event.detail.sectionId === this.dataset.sectionId && this.dataset.designMode === "true") {
      this.openPopup();
    } else {
      this.closePopup();
    }
  }

  showDeclineContent() {
    this.declineContent.classList.remove("m:hidden");
    this.content.classList.add("m:hidden");
  }

  hideDeclineContent() {
    this.declineContent.classList.add("m:hidden");
    this.content.classList.remove("m:hidden");
  }

  openPopup() {
    this.modal.style.setProperty("--m-opacity", "1");
    this.modal.classList.add("m-open-modal");
    document.documentElement.classList.add("prevent-scroll");
  }

  closePopup() {
    this.modal.classList.remove("m-open-modal");
    this.modal.style.setProperty("--m-opacity", "0");
    document.documentElement.classList.remove("prevent-scroll");
  }
}

customElements.define("m-age-verifier-popup", AgeVerifierPopup);
