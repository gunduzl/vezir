class MHeader extends HTMLElement {
  constructor() {
    super();
    this.selectors = {
      headers: ["header"],
      logos: [".m-logo"],
      topbar: ".m-topbar",
      headerWrapper: ".m-header__wrapper",
      topbarClose: ".m-topbar__close",
    };
    this.domNodes = queryDomNodes(this.selectors, this);
    this.innerWidth = window.innerWidth;
    this.headerOffsetTop = this.domNodes.headerWrapper.offsetTop;
    this.headerHeight = this.domNodes.headerWrapper.offsetHeight;
    this.stickyHeader = this.dataset.sticky;

    this.classes = {
      scrollUp: "scroll-up",
      scrollDown: "scroll-down",
      stuck: "stuck",
      always: "header-sticky-always",
      headerScrollUp: "header-scroll-up",
      headerScrollDown: "header-scroll-down",
    };
    this.init();
  }

  init() {
    this.transparentHeader =
      this.domNodes && this.domNodes.headers[0] && this.domNodes.headers[0].dataset.transparent === "true";
    this.initAddon();
    this.handleSticky();
    document.addEventListener("matchMobile", () => this.handleSticky());
    document.addEventListener("unmatchMobile", () => this.handleSticky());
    this.siteNav = new SiteNav(this);
    window.__sfHeader = this;
    window.addEventListener("resize", () => {
      this.innerWidth = window.innerWidth;
    });
  }

  initAddon() {
    this.megamenu = new Megamenu(this);
    if (Shopify.designMode) {
      MinimogTheme = MinimogTheme || {};
      MinimogTheme && MinimogTheme.Wishlist && MinimogTheme.Wishlist.updateWishlistCount();
    }
  }
  handleSticky() {
    let extraSpace = 20;
    const sectionGroups = document.querySelectorAll(".shopify-section-group-header-group");
    sectionGroups.forEach((section) => {
      if (!section.classList.contains("m-section-header") && !section.classList.contains("m-section-scaling-logo")) {
        extraSpace += section.offsetHeight;
      }
    });
    const topBar = document.querySelector(".m-topbar");
    if (topBar) extraSpace += topBar.offsetHeight;

    let lastScroll = 0;
    window.addEventListener("scroll", () => {
      const currentScroll = window.scrollY;
      if (currentScroll <= extraSpace) {
        this.classList.remove(this.classes.scrollUp, this.classes.stuck, this.classes.always);
        document.body.classList.remove(this.classes.headerScrollUp, this.classes.headerScrollDown);
        return;
      }

      if (this.stickyHeader === "on_scroll_up") {
        this.classList.add(this.classes.stuck);
      } else if (this.stickyHeader === "always") {
        this.classList.add(this.classes.always);
      }

      if (
        currentScroll > this.headerHeight + extraSpace &&
        currentScroll > lastScroll &&
        !this.classList.contains(this.classes.scrollDown)
      ) {
        this.classList.remove(this.classes.scrollUp);
        document.body.classList.remove(this.classes.headerScrollUp);
        this.classList.add(this.classes.scrollDown);
        document.body.classList.add(this.classes.headerScrollDown);
      } else if (currentScroll < lastScroll && this.classList.contains(this.classes.scrollDown)) {
        this.classList.remove(this.classes.scrollDown);
        document.body.classList.remove(this.classes.headerScrollDown);
        this.classList.add(this.classes.scrollUp);
        document.body.classList.add(this.classes.headerScrollUp);
      }
      lastScroll = currentScroll;
    });
  }
}
customElements.define("m-header", MHeader);
