// MStlCard class'ının zaten tanımlanmış olup olmadığını kontrol et
if (typeof MStlCard === 'undefined') {
  class MStlCard extends HTMLElement {
    constructor() {
      super();
      this.selectors = {
        cardBtn: ".m-stl-card__btn",
        popup: ".m-stl-popup",
        overlayCard: ".m-stl-card__overlay",
        closePopupBtn: ".m-stl-popup__close-btn"
      };
      this.domNodes = queryDomNodes(this.selectors, this);
      this.domNodes.cardBtn && this.domNodes.cardBtn.addEventListener('click', this.showPopup.bind(this));
      this.domNodes.closePopupBtn && this.domNodes.closePopupBtn.addEventListener('click', this.hidePopup.bind(this));
      this.domNodes.overlayCard && this.domNodes.overlayCard.addEventListener('click', this.hidePopup.bind(this));
    }

    showPopup() {
      if (!this.domNodes.popup) return;
      const { cardBtn, popup, overlayCard } = this.domNodes;
      cardBtn?.classList.add('is-hide');
      popup.classList.add('is-show');
      overlayCard.classList.add('is-show');
      document.querySelector('html')?.classList.add('no-scroll');
    }

    hidePopup() {
      if (!this.domNodes.popup) return;
      const { popup, overlayCard, cardBtn } = this.domNodes;
      popup?.classList.remove('is-show');
      overlayCard.classList.remove('is-show');
      document.querySelector('html')?.classList.remove('no-scroll');
      cardBtn?.classList.remove('is-hide');
    }
  }

  // Custom element'i sadece daha önce tanımlanmamışsa tanımla
  if (!customElements.get('m-stl-card')) {
    customElements.define("m-stl-card", MStlCard);
  }
}