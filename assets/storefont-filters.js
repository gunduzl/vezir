const cachedFiltersResult = [];

class CollectionFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.selectors = {
      section: ".facest-filters-section",
      productGridContainer: "#CollectionProductGrid",
      filtersForm: "#CollectionFiltersForm",
      sortingInToolbar: "[data-toolbar-sorting] select",
      sortingInForm: "[data-form-sorting] select",
      initialActiveSortingOption: ".m-sortby-mobile--content li.active",
      filtersWrapper: ".m-filter--wrapper",
      sidebar: ".m-sidebar",
      sidebarContent: ".m-sidebar--content",
      openSidebar: ".m-sidebar--open",
      closeSidebar: ".m-sidebar--close",
    };
    this.accordions = "";
  }

  connectedCallback() {
    this.domNodes = queryDomNodes(this.selectors);
    this.setData();
    this.debouncedOnSubmit = debounce((evt) => this.onSubmitHandler(evt), 500);
    this.domNodes.filtersForm.addEventListener("input", this.debouncedOnSubmit.bind(this));
    this.setLoadingTarget();
    this.initSorting();
    window.addEventListener("popstate", this.onHistoryChange);
  }

  disconnectedCallback() {
    window.removeEventListener("popstate", this.onHistoryChange);
    this.listeners.forEach((unsubscribeFunc) => unsubscribeFunc());
  }

  setData = () => {
    const { section, initialActiveSortingOption } = this.domNodes;
    this.enableSorting = section.dataset.enableSorting === "true";
    this.filtersPosition = section.dataset.filtersPosition;
    this.sectionId = section.dataset.sectionId;
    this.activeSortingOption = initialActiveSortingOption;
    this.view = section.dataset.view;
    this.listeners = [];
  };

  initSorting = () => {
    const { sortingInToolbar } = this.domNodes;
    if (!this.enableSorting || !sortingInToolbar) return;
    sortingInToolbar.selectedIndex = sortingInToolbar.querySelector("option[selected]").dataset.index;
    sortingInToolbar.addEventListener("change", () => {
      this.handleSorting(sortingInToolbar.selectedIndex);
    });

    this.listeners = [
      addEventDelegate({
        selector: ".m-sortby-mobile--content li",
        handler: (e, option) => {
          if (option !== this.activeSortingOption) {
            this.activeSortingOption?.classList?.remove?.("active");
            option.classList.add("active");
            this.activeSortingOption = option;
            MinimogTheme.Collection.closeMobileSorting();
            this.handleSorting(option.dataset.index);
          }
        },
      }),
    ];
  };

  handleSorting = (sortingOptionIndex) => {
    const { filtersForm, sortingInForm } = this.domNodes;
    sortingInForm.selectedIndex = Number(sortingOptionIndex) || 0;
    filtersForm.dispatchEvent(new Event("input"));
  };

  setLoadingTarget = () => {
    const screen = window.innerWidth < 768 ? "mobile" : "desktop";
    const { productGridContainer } = this.domNodes;
    const isFiltersOffCanvas = screen === "mobile" || this.filtersPosition === "fixed";
    const options = isFiltersOffCanvas ? {} : { overlay: productGridContainer };
    this.loading = new MinimogLibs.AnimateLoading(document.body, options);
  };

  onSubmitHandler(event) {
    event.preventDefault();
    const formData = new FormData(this.domNodes.filtersForm);
    const searchParams = new URLSearchParams(formData).toString();
    this.renderPage(searchParams);
  }

  onHistoryChange = (event) => {
    const searchParams = event.state?.searchParams || "";
    this.renderPage(searchParams, false);
  };

  renderPage = (searchParams, updateURLHash = true) => {
    this.loading.start();
    const _url = `${window.location.pathname}?section_id=${this.sectionId}&${searchParams}`;
    const cachedResult = cachedFiltersResult.find(({ url }) => url === _url);
    const renderFunc = cachedResult ? this.renderSectionFromCache : this.renderSectionFromFetch;
    renderFunc(_url)
      .then(() => {
        MinimogTheme.Collection.init();
        this.loading.finish(this.scrollToTop);
        document.dispatchEvent(new CustomEvent("collection:rerendered"));
      })
      .catch(console.error);

    if (updateURLHash) this.updateURLHash(searchParams);
  };

  renderSectionFromFetch = (url) => {
    return fetch(url)
      .then((res) => {
        if (res.ok) return res.text();
        throw new Error("Failed to load section!");
      })
      .then((text) => {
        cachedFiltersResult.push({ url, html: text });
        this.renderProductGrid(text);
      })
      .catch(console.error);
  };

  renderSectionFromCache = async (_url) => {
    const cachedResult = cachedFiltersResult.find(({ url }) => url === _url);
    this.renderProductGrid(cachedResult.html);
  };

  renderProductGrid = (html) => {
    const newSection = new DOMParser().parseFromString(html, "text/html").querySelector(".facest-filters-section");
    this.domNodes.section.replaceWith(newSection);
    handleBackgroundImageLazyload();
  };

  updateURLHash(searchParams) {
    history.pushState({ searchParams }, "", `${window.location.pathname}${searchParams && "?".concat(searchParams)}`);
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

customElements.define("collection-filters-form", CollectionFiltersForm);
