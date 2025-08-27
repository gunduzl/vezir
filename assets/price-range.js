class PriceRange extends HTMLElement {
  constructor() {
    super();

    this.rangeMin = this.querySelector('input[type="range"]:first-child');
    this.rangeMax = this.querySelector('input[type="range"]:last-child');
    this.inputMin = this.querySelector('input[name="filter.v.price.gte"]');
    this.inputMax = this.querySelector('input[name="filter.v.price.lte"]');

    this.inputMin.addEventListener("focus", this.inputMin.select);
    this.inputMax.addEventListener("focus", this.inputMax.select);
    this.inputMin.addEventListener("change", this.onInputMinChange.bind(this));
    this.inputMax.addEventListener("change", this.onInputMaxChange.bind(this));

    this.rangeMin.addEventListener("change", this.onRangeMinChange.bind(this));
    this.rangeMax.addEventListener("change", this.onRangeMaxChange.bind(this));
    this.rangeMin.addEventListener("input", this.onRangeMinInput.bind(this));
    this.rangeMax.addEventListener("input", this.onRangeMaxInput.bind(this));
  }

  onInputMinChange(event) {
    event.preventDefault();
    event.target.value = Math.max(
      Math.min(parseInt(event.target.value), parseInt(this.inputMax.value || event.target.max) - 1),
      event.target.min
    );
    this.rangeMin.value = event.target.value;
    this.rangeMin.parentElement.style.setProperty(
      "--from",
      `${(parseInt(this.rangeMin.value) / parseInt(this.rangeMin.max)) * 100}%`
    );
  }

  onInputMaxChange(event) {
    event.preventDefault();
    event.target.value = Math.min(
      Math.max(parseInt(event.target.value), parseInt(this.inputMin.value || event.target.min) + 1),
      event.target.max
    );
    this.rangeMax.value = event.target.value;
    this.rangeMax.parentElement.style.setProperty(
      "--to",
      `${(parseInt(this.rangeMax.value) / parseInt(this.rangeMax.max)) * 100}%`
    );
  }

  onRangeMinChange(event) {
    event.stopPropagation();
    this.inputMin.value = event.target.value;
    this.inputMin.dispatchEvent(new Event("change", { bubbles: true }));
  }

  onRangeMaxChange(event) {
    event.stopPropagation();
    this.inputMax.value = event.target.value;
    this.inputMax.dispatchEvent(new Event("change", { bubbles: true }));
  }

  onRangeMinInput(event) {
    event.target.value = Math.min(parseInt(event.target.value), parseInt(this.inputMax.value || event.target.max) - 1);
    event.target.parentElement.style.setProperty(
      "--from",
      `${(parseInt(event.target.value) / parseInt(event.target.max)) * 100}%`
    );
    this.inputMin.value = event.target.value;
  }

  onRangeMaxInput(event) {
    event.target.value = Math.max(parseInt(event.target.value), parseInt(this.inputMin.value || event.target.min) + 1);
    event.target.parentElement.style.setProperty(
      "--to",
      `${(parseInt(event.target.value) / parseInt(event.target.max)) * 100}%`
    );
    this.inputMax.value = event.target.value;
  }
}
customElements.define("price-range", PriceRange);
