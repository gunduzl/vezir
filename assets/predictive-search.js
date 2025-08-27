class PredictiveSearch extends HTMLElement {
  constructor() {
    super();

    this.selectors = {
      searchQuery: "[data-query]",
      searchMessage: "[data-message]",
      input: "[data-search-input]",
      submit: 'button[type="submit"]',
      loading: "[data-spinner]",
      clear: "[data-clear-search]",
      popularSearchItems: ["[data-ps-item]"],
      moreResultIcon: "[data-more-result-icon]",
    };

    this.container = document.querySelector("[data-search-popup]");

    this.domNodes = queryDomNodes(this.selectors, this.container);

    this.cachedResults = {};
    this.transitionDuration = 300;
    this.input = this.querySelector('input[type="search"]');
    this.predictiveSearchResults = this.querySelector("[data-predictive-search]");
    this.searchPopupSearults = this.querySelector(".m-search-popup__result");
    this.popularSearches = this.querySelector("[data-popular-searches]");
    this.searchCount = this.querySelector("[data-search-count]");

    this.setupEventListeners();
  }

  setPopularSearchesLink = () => {
    const { popularSearchItems } = this.domNodes;
    popularSearchItems.forEach((itm) => (itm.href = createSearchLink(itm.dataset.psQuery)));
  };

  setupEventListeners() {
    const { clear } = this.domNodes;
    const form = this.querySelector("form.m-search-form");
    form.addEventListener("submit", this.onFormSubmit.bind(this));

    this.input.addEventListener(
      "input",
      debounce((event) => {
        this.onChange(event);
      }, 300).bind(this)
    );
    clear.addEventListener("click", this.onClearSearch.bind(this));
    MinimogEvents.subscribe(MinimogTheme.pubSubEvents.closeSearchPopup, () => this.close(true));
  }

  getQuery() {
    return this.input.value.trim();
  }

  onChange() {
    const searchTerm = this.getQuery();

    if (!searchTerm.length) {
      this.close(true);
      return;
    }

    this.getSearchResults(searchTerm);
  }

  onFormSubmit(event) {
    if (!this.getQuery().length || this.querySelector('[aria-selected="true"] a')) event.preventDefault();
  }

  onClearSearch(event) {
    event.preventDefault();
    this.input.value = "";
    this.onChange();
  }

  getSearchResults(searchTerm) {
    const queryKey = searchTerm.replace(" ", "-").toLowerCase();
    this.toggleSpinnerLoading(true);
    this.toggleClearSearch(false);

    const searchByTag = this.dataset.searchByTag === "true";
    const searchByBody = this.dataset.searchByBody === "true";
    const unavailableProductsOption = this.dataset.unavailableProductsOption;

    let searchFields = "title,product_type,vendor,variants.sku,variants.title";

    if (searchByTag) searchFields += ",body";
    if (searchByBody) searchFields += ",tag";

    if (this.cachedResults[queryKey]) {
      this.renderSearchResults(this.cachedResults[queryKey]);
      return;
    }

    let searchURL = `${window.MinimogSettings.routes.predictive_search_url}?q=${encodeURIComponent(
      searchTerm
    )}&resources[options][unavailable_products]=${unavailableProductsOption}&resources[options][fields]=${searchFields}&section_id=predictive-search`;

    fetch(`${searchURL}`)
      .then((response) => {
        if (!response.ok) {
          var error = new Error(response.status);
          this.close();
          throw error;
        }
        return response.text();
      })
      .then((text) => {
        const resultsMarkup = new DOMParser()
          .parseFromString(text, "text/html")
          .querySelector("#shopify-section-predictive-search").innerHTML;
        this.cachedResults[queryKey] = resultsMarkup;
        this.renderSearchResults(resultsMarkup);
      })
      .catch((error) => {
        this.close();
        throw error;
      });
  }

  renderSearchResults(resultsMarkup) {
    this.predictiveSearchResults.innerHTML = resultsMarkup;
    this.setAttribute("results", true);
    const searchItemsWrapper = this.querySelector("[data-search-items-wrapper]");
    if (searchItemsWrapper.childElementCount > 0) {
      this.renderSearchQueryAndMessage(true);
    } else {
      this.renderSearchQueryAndMessage(false);
    }

    this.toggleSpinnerLoading(false);
    this.toggleClearSearch(true);
    this.open();
  }

  renderSearchQueryAndMessage(results) {
    const { input, searchQuery, searchMessage, moreResultIcon } = this.domNodes;
    const query = input.value;

    const { resultsTitle } = searchMessage.dataset;
    searchQuery.textContent = query;

    this.predictiveSearchResults.classList.remove("m:hidden");
    this.searchPopupSearults.classList.remove("m:hidden");

    if (results) {
      searchMessage.textContent = resultsTitle;
      moreResultIcon.classList.add("m:hidden");
    } else {
      searchMessage.textContent = searchMessage.dataset.resultsTitle;
      moreResultIcon.classList.remove("m:hidden");
    }
  }

  toggleSpinnerLoading(show) {
    const { loading, submit } = this.domNodes;
    submit.style.visibility = show ? "hidden" : "visible";
    loading.style.visibility = show ? "visible" : "hidden";
  }

  toggleClearSearch(show) {
    const { clear } = this.domNodes;
    clear.style.visibility = show ? "visible" : "hidden";
  }

  open() {
    this.searchPopupSearults.style.setProperty(
      "--search-result-max-height",
      `${this.resultsMaxHeight || this.getResultsMaxHeight()}px`
    );
    this.setAttribute("open", true);
    this.input.setAttribute("aria-expanded", true);
    this.isOpen = true;

    this.popularSearches && this.popularSearches.classList.add("m:hidden");
    this.searchCount.classList.remove("m:hidden");
  }

  close(clearSearchTerm = false) {
    if (clearSearchTerm) {
      this.input.value = "";
      this.removeAttribute("results");
      this.toggleClearSearch(false);
      this.resultsMaxHeight = false;
    }

    this.removeAttribute("open");
    this.predictiveSearchResults.classList.add("m:hidden");
    this.searchPopupSearults.classList.add("m:hidden");
    this.popularSearches && this.popularSearches.classList.remove("m:hidden");
    this.searchCount.classList.add("m:hidden");
  }

  getResultsMaxHeight() {
    this.resultsMaxHeight =
      window.innerHeight - document.querySelector("predictive-search").getBoundingClientRect().bottom;
    return this.resultsMaxHeight;
  }
}

customElements.define("predictive-search", PredictiveSearch);
