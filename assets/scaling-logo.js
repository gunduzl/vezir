class MScalingLogo extends HTMLElement {
  constructor() {
    super();
    this.logo = this.querySelector(".m-scaling-logo__logo");
    this.logoWrapper = this.querySelector(".m-scaling-logo__logo-wrapper");
    this.content = this.querySelector(".m-scaling-logo__content");
    this.headerDesktop = document.querySelector(".m-header__desktop");
    this.headerMobile = document.querySelector(".m-header__mobile");
    this.headerWrapper = document.querySelector(".m-header__wrapper");
    this.header = document.querySelector(".m-header");
    this.headerStyle = this.header && this.header.dataset.sticky;

    this.init();
    window.addEventListener("resize", debounce(this.init.bind(this), 100));
    window.addEventListener("scroll", () => {
      window.requestAnimationFrame(() => this.scrollAnimation());
    });
  }

  init() {
    if (!this.logoWrapper) {
      console.warn("Logo wrapper not found");
      return;
    }

    const logoWidth = parseFloat(window.getComputedStyle(this.logoWrapper).width);
    this.scale = window.innerWidth / logoWidth;
    if (window.innerWidth > 768) {
      this.scale = Math.min(this.scale, 14);
      this.logo.style.transform = `scale(${this.scale - 3})`;
    } else {
      this.logo.style.transform = `scale(${this.scale - 1})`;
    }

    if (this.headerStyle !== "none") {
      this.headerDesktop.classList.add("m:fade-out");
      this.headerMobile.classList.add("m:fade-out");
    } else {
      this.classList.add("m-scaling-logo--sticky-none");
    }
  }

  scrollAnimation() {
    const scroll = window.pageYOffset;
    const winH = window.innerHeight - this.header.offsetHeight - 1;
    const scaleAdjustment = window.innerWidth > 768 ? 3 : 1;
    let percent = 1 + (this.scale - 1 - this.scale * (scroll / winH)) - scaleAdjustment;

    percent = Math.max(percent, 1);
    if (this.logo) {
      this.logo.style.transform = `scale(${percent})`;
    }

    if (scroll > winH / 2) {
      this.content.classList.add("m:fade-out");
    } else {
      this.content.classList.remove("m:fade-out");
    }

    if (percent === 1) {
      this.headerWrapper.classList.remove("m-unset-shadow");
      this.logo && this.logo.classList.add("m:hidden");
      if (this.headerStyle !== "none") {
        this.headerDesktop.classList.remove("m:fade-out");
        this.headerMobile.classList.remove("m:fade-out");
      }
    } else {
      this.headerWrapper.classList.add("m-unset-shadow");
      this.logo && this.logo.classList.remove("m:hidden");
      if (this.headerStyle !== "none") {
        this.headerDesktop.classList.add("m:fade-out");
        this.headerMobile.classList.add("m:fade-out");
      }
    }
  }
}

customElements.define("m-scaling-logo", MScalingLogo);
