if (!customElements.get("m-localization-form")) {
  class MLocalizationForm extends HTMLElement {
    constructor() {
      super();
      const select = this.querySelector('[data-localization-select]');
      select && select.addEventListener('change', (e) => {
        const value = e.target.value
        const form = select.closest('[data-localization-form]')
        const input = form.querySelector('input[data-localization-input]')
        input && input.setAttribute('value', value)
        input && form.submit()
      });
    }
  }
  customElements.define('m-localization-form', MLocalizationForm);
}