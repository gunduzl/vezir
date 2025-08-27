class TagsFilter extends HTMLElement {
  constructor() {
    super();
    this.selectors = {
      mainContent: "#MainContent",
      section: 'section[data-section-type="collection-template"]',
      collectionHeader: '[data-section-type="collection-header"]',
      productGridContainer: "#CollectionProductGrid",
      sorting: 'select[name="sort_by"]',
      initialActiveSortingOption: ".m-sortby-mobile--content li.active",
    };

    this.preventClick = false;
  }

  connectedCallback() {
    this.domNodes = queryDomNodes(this.selectors);
    this.setData();
    this.listeners = [
      addEventDelegate({
        selector: "[data-tag-filter]",
        handler: this.handleFilter,
      }),
    ];
    this.initSorting();
    this.setLoadingTarget();
  }

  disconnectedCallback() {
    this.listeners.forEach((unsubscribeFunc) => unsubscribeFunc());
  }

  setData = () => {
    const { section, initialActiveSortingOption } = this.domNodes;
    this.enableSorting = section.dataset.enableSorting === "true";
    this.filtersPosition = section.dataset.filtersPosition;
    this.sectionId = section.dataset.sectionId;
    this.activeSortingOption = initialActiveSortingOption;
  };

  handleFilter = (e, tag) => {
    e.preventDefault();
    if (this.preventClick) return;
    this.preventClick = true;
    const url = tag.querySelector("a").href;
    if (url) this.fetchSectionHtml(url);
  };

  initSorting() {
    if (!this.enableSorting) return;

    this.domNodes.sorting &&
      this.domNodes.sorting.addEventListener("change", (e) => {
        const value = e && e.target && e.target.value;
        this.handleSorting(value);
      });
    addEventDelegate({
      selector: ".m-sortby-mobile--content li",
      handler: (e, option) => {
        if (option !== this.activeSortingOption) {
          this.activeSortingOption && this.activeSortingOption.classList.remove("active");
          option.classList.add("active");
          this.activeSortingOption = option;
          MinimogTheme.Collection.closeMobileSorting();
          this.handleSorting(option.dataset.value);
        }
      },
    });
  }

  handleSorting = (value) => {
    if (!value) return;
    updateParam("sort_by", value);
    this.fetchSectionHtml(window.location.href);
  };

  fetchSectionHtml(url) {
    this.loading.start();
    fetch(url)
      .then((res) => {
        if (res.ok) return res.text();
        throw new Error("Failed to load section!");
      })
      .then((text) => {
        this.preventClick = false;
        this.renderCollectionHeader(text);
        this.renderProductGrid(text);
        this.updateBrowserHistory(url);
        MinimogTheme.Collection.init();
        this.loading.finish(this.scrollToTop);
        document.dispatchEvent(new CustomEvent("collection:rerendered"));
      });
  }

  renderCollectionHeader = (html) => {
    const dom = new DOMParser().parseFromString(html, "text/html");
    const newCollectionHeader = dom.querySelector(this.selectors.collectionHeader);
    this.domNodes.collectionHeader && this.domNodes.collectionHeader.replaceWith(newCollectionHeader);
  };

  renderProductGrid = (html) => {
    const dom = new DOMParser().parseFromString(html, "text/html");
    document.title = dom && dom.querySelector("title") && dom.querySelector("title").innerText;
    const newSection = dom.querySelector(this.selectors.section);
    this.domNodes.section.replaceWith(newSection);
    handleBackgroundImageLazyload();
  };

  setLoadingTarget = () => {
    const screen = window.innerWidth < 768 ? "mobile" : "desktop";
    const { productGridContainer } = this.domNodes;
    const isFiltersOffCanvas = screen === "mobile" || this.filtersPosition === "fixed";
    const options = isFiltersOffCanvas ? {} : { overlay: productGridContainer };
    this.loading = new MinimogLibs.AnimateLoading(document.body, options);
  };

  updateBrowserHistory(url) {
    window.history.replaceState({ path: url }, "", url);
  }

  scrollToTop = () => {
    const target = document.getElementById("CollectionProductGrid");

    const scrollIntoView = (selector, offset) => {
      window.scrollTo({
        behavior: 'smooth',
        top: selector.getBoundingClientRect().top - document.body.getBoundingClientRect().top - offset
      })
    }

    scrollIntoView(target, 80);
  };
}

customElements.define("collection-tags-filters", TagsFilter);
