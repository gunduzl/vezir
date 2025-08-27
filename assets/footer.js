class MFooter extends HTMLElement {
  constructor() {
    super();
    this.init();
  }

  init() {
    const mobileAccordion = this.querySelector(".m-footer--accordion");
    const mobileStickyBar = document.querySelector(".m-mobile-sticky-bar");

    if (mobileAccordion) {
      if (MinimogTheme.config.mqlMobile) {
        this.acc = new MinimogLibs.Accordion(mobileAccordion, { presetContentHeight: true, onload: true });
      }
      document.addEventListener("matchMobile", () => {
        this.acc = new MinimogLibs.Accordion(mobileAccordion, { presetContentHeight: true, onload: true });
      });
    }

    // Set mobile stickybar height
    if (mobileStickyBar) {
      document.documentElement.style.setProperty("--mobile-sticky-bar-height", `${mobileStickyBar.offsetHeight}px`);
      document.addEventListener("matchMobile", () => {
        document.documentElement.style.setProperty("--mobile-sticky-bar-height", `${mobileStickyBar.offsetHeight}px`);
      });
      document.addEventListener("unmatchMobile", () => {
        document.documentElement.style.setProperty("--mobile-sticky-bar-height", `${mobileStickyBar.offsetHeight}px`);
      });
    }
  }
}
customElements.define("m-footer", MFooter);
