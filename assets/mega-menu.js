class Megamenu {
  constructor(container) {
    this.selectors = {
      announcementBar: ".m-announcement-bar",
      hamburgerButtons: ".m-hamburger-box",
      desktopMenuItems: [".m-menu__item"],
      desktopSubMenus: ".m-mega-menu",
      headerMobile: ".m-header__mobile",
      menuDrawer: "#m-menu-drawer",
      menuDrawerContent: ".m-menu-drawer__content",
      menu: ".m-menu-mobile",
      menuItems: [".m-menu-mobile__item"],
      megaMenuMobile: [".m-megamenu-mobile"],
      backDrop: ".m-menu-drawer__backdrop",
    };
    this.menuSelectors = {
      subMenu: ".m-mega-menu",
    };
    this.activeDesktopMenuItem = null;

    this.sliders = {};
    this.open = false;
    this.container = container;
    this.transitionDuration = 0;
    this.domNodes = queryDomNodes(this.selectors);
    this.menuData = [...this.domNodes.desktopMenuItems].map((item) => {
      const header = item.closest("header");
      const menuNodes = queryDomNodes(this.menuSelectors, item);
      return { header, item, ...menuNodes, active: false };
    });
    this.init();

    MinimogTheme = MinimogTheme || {};
    MinimogTheme.headerSliders = this.sliders;
  }

  init() {
    this.domNodes.hamburgerButtons.addEventListener("click", (e) => {
      if (this.domNodes.hamburgerButtons.classList.contains("active")) {
        this.closeMenu();
      } else {
        this.openMenu();
      }
      this.domNodes.hamburgerButtons.classList.toggle("active");
    });
    this.domNodes.backDrop.addEventListener("click", (e) => {
      this.closeMenu();
    });
    this.initMobileMegaMenu();
    this.initDesktopMegaMenu();

    MinimogEvents.subscribe(MinimogTheme.pubSubEvents.openCartDrawer, () => {
      this.open && this.closeMenu();
    });
    MinimogEvents.subscribe(MinimogTheme.pubSubEvents.openSearchPopup, () => {
      this.open && this.closeMenu();
    });
  }
  initDesktopMegaMenu() {
    [...this.menuData].forEach((menuItem) => {
      const { item, subMenu } = menuItem;
      if (subMenu) {
        const productsBanner = subMenu.querySelector(".m-mega-product-list");
        if (productsBanner) {
          if (window && window.__sfWindowLoaded) {
            menuItem.productsBannerSlider = this.initProductsBanner(productsBanner);
          } else {
            window.addEventListener("load", () => {
              menuItem.productsBannerSlider = this.initProductsBanner(productsBanner);
            });
          }
        }
      }
    });
  }
  closeDesktopSubmenu = (menuItemIndex) => {
    const menuItem = this.menuData[menuItemIndex];
    const { header } = menuItem;
    header && header.classList.remove("show-menu");
  };
  initProductsBanner(banner) {
    const header = banner.closest("header");
    const menuItem = banner.closest(".m-menu__item");
    const screenClass = (header && `.${header.dataset.screen}`) || "";

    const id = banner.dataset.id;
    const sliderContainer = document.querySelector(`.m-product-list-${id}`);
    const columns = sliderContainer.dataset.column;

    let slider;
    slider = new MinimogLibs.Swiper(`${screenClass} .m-product-list-${id}`, {
      slidesPerView: 1,
      loop: false,
      autoplay: false,
      breakpoints: {
        1200: { slidesPerView: columns },
        992: { slidesPerView: columns >= 2 ? 2 : columns },
      },
    });
    this.sliders[menuItem.dataset.index] = slider;

    if (slider) {
      const prevBtn = document.querySelector(`#m-slider-controls-${id} .m-slider-controls__button-prev`);
      const nextBtn = document.querySelector(`#m-slider-controls-${id} .m-slider-controls__button-next`);
      prevBtn && prevBtn.addEventListener("click", () => slider.slidePrev());
      nextBtn && nextBtn.addEventListener("click", () => slider.slideNext());
    }
  }

  initMobileMegaMenu() {
    [...this.domNodes.menuItems].forEach((item) => {
      const subMenuContainer = item.querySelector(".m-megamenu-mobile");
      const backBtn = item.querySelector(".m-menu-mobile__back-button");

      if (subMenuContainer) {
        addEventDelegate({
          context: item,
          selector: "[data-toggle-submenu]",
          handler: (e, target) => {
            e.preventDefault();
            const level = target.dataset.toggleSubmenu;
            const parentNode = e.target.parentNode;
            if (
              e.target.classList.contains("m-menu-mobile__back-button") ||
              parentNode.classList.contains("m-menu-mobile__back-button")
            ) {
              return;
            }

            this.openSubMenu(subMenuContainer, level);
          },
        });
      }

      if (backBtn) {
        addEventDelegate({
          context: item,
          selector: "[data-toggle-submenu]",
          handler: (e, target) => {
            e.preventDefault();
            const level = target.dataset.toggleSubmenu;
            const parentNode = e.target.parentNode;
            if (
              e.target.classList.contains("m-menu-mobile__back-button") ||
              parentNode.classList.contains("m-menu-mobile__back-button")
            ) {
              return;
            }

            this.openSubMenu(subMenuContainer, level);
          },
        });
        backBtn.addEventListener("click", (e) => {
          const level = e.target.dataset.level;
          this.closeSubMenu(subMenuContainer, level);
        });
      }
    });

    document.addEventListener("matchMobile", () => this.setMenuHeight());
    document.addEventListener("unmatchMobile", () => this.setMenuHeight());
  }

  //////////////// MOBILE MENU EVENTS
  openMenu() {
    this.setMenuHeight();
    document.documentElement.classList.add("prevent-scroll");
    this.domNodes.menuDrawer.classList.add("open");
    this.domNodes.headerMobile.classList.add("header-drawer-open");
    this.open = true;
  }

  closeMenu() {
    const { menuDrawer, menu, megaMenuMobile, hamburgerButtons } = this.domNodes;

    setTimeout(() => {
      megaMenuMobile.forEach((container) => {
        container.classList.remove("open");
      });
      menu && menu.classList.remove("m-submenu-open", "m-submenu-open--level-1", "m-submenu-open--level-2");
      menuDrawer.classList.remove("open");
      document.documentElement.classList.remove("prevent-scroll");
      this.domNodes.headerMobile.classList.remove("header-drawer-open");
      hamburgerButtons.classList.remove("active");
      // Close search
    }, this.transitionDuration);
    this.open = false;
  }

  openSubMenu(subMenuContainer, level) {
    let subMenuOpenClass = `m-submenu-open--level-${level}`;

    this.domNodes.menuDrawerContent.classList.add("open-submenu");
    this.domNodes.menu && this.domNodes.menu.classList.add("m-submenu-open");
    this.domNodes.menu && this.domNodes.menu.classList.add(subMenuOpenClass);
    subMenuContainer.classList.add("open");
  }

  closeSubMenu(subMenuContainer, level) {
    let subMenuOpenClass = `m-submenu-open--level-${level}`;

    level === "1" && this.domNodes.menu && this.domNodes.menu.classList.remove("m-submenu-open");
    this.domNodes.menu && this.domNodes.menu.classList.remove(subMenuOpenClass);
    subMenuContainer.classList.remove("open");
    this.domNodes.menuDrawerContent.classList.remove("open-submenu");
  }

  setMenuHeight() {
    const { menuDrawer, headerMobile } = this.domNodes;
    const offsetBottom = headerMobile.getBoundingClientRect().bottom;
    const panelHeight = window.innerHeight - offsetBottom;

    menuDrawer.style.setProperty("--menu-drawer-height", `${panelHeight}px`);
  }
}
class SiteNav {
  constructor(container) {
    this.selectors = {
      menuItems: [".m-menu .m-menu__item"],
      dropdowns: [".m-mega-menu"],
      subMenu: ".m-mega-menu",
      overlay: ".m-header__overlay",
      swiper: ".swiper-container",
    };

    this.classes = {
      slideFromRight: "slide-from-right",
      slideReveal: "slide-reveal",
      active: "m-mega-active",
    };

    this.headerSticky = false;

    if (!container) return;
    this.container = container;
    this.domNodes = queryDomNodes(this.selectors, this.container);
    this.activeIndex = -1;
    this.lastActiveIndex = -1;
    this.visited = false;
    this.timeoutEnter = null;
    this.timeoutLeave = null;
    this.attachEvents();
  }

  attachEvents = () => {
    this.domNodes.menuItems.forEach((menuItem, index) => {
      menuItem.addEventListener("mouseenter", (evt) => this.onMenuItemEnter(evt, index));
      menuItem.addEventListener("mouseleave", (evt) => this.onMenuItemLeave(evt, index));
    });
  };

  initDropdownSize = () => {
    this.container && this.container.style.setProperty("--sf-dropdown-width", this.windowWidth());
    this.container && this.container.style.setProperty("--sf-dropdown-height", this.windowHeight());
  };

  onMenuItemEnter = (evt, index) => {
    const { target } = evt;

    if (!target.classList.contains("m-menu__item--mega")) return;

    clearTimeout(this.timeoutLeave);
    this.activeIndex = target.dataset && Number(target.dataset.index);
    this.headerSticky = this.container && this.container.dataset.sticky === "true";
    this.reInitSlider(target);

    this.container && this.visited
      ? this.container.classList.remove(this.classes.slideReveal)
      : this.container.classList.add(this.classes.slideReveal);

    this.visited = true;
    this.lastActiveIndex >= 0 &&
      this.activeIndex >= 0 &&
      (this.container && this.lastActiveIndex < this.activeIndex
        ? this.container.classList.add(this.classes.slideFromRight)
        : this.lastActiveIndex > this.activeIndex && this.container.classList.remove(this.classes.slideFromRight));

    this.getElementBoundingRect(target).then((rect) => {
      if (rect) {
        this.container && this.container.style.setProperty("--sf-dropdown-width", rect.width);
        this.container && this.container.style.setProperty("--sf-dropdown-height", rect.height);
      }

      this.timeoutEnter = setTimeout(() => {
        if (this.activeIndex !== Number(target.dataset.index)) return;
        this.container && this.container.classList.add(this.classes.active);
        target.closest(".m-menu__item").classList.add("m-menu__item--active");
        // document.documentElement.classList.add("prevent-scroll");
      }, 120);
    });
  };

  onMenuItemLeave = (evt, index) => {
    this.activeIndex = -1;
    this.lastActiveIndex = index;
    evt.target.closest(".m-menu__item").classList.remove("m-menu__item--active");
    // document.documentElement.classList.remove("prevent-scroll");

    this.timeoutLeave = setTimeout(() => {
      if (this.activeIndex === -1 || this.activeIndex < 0) {
        this.visited = false;
      }
      this.resetMegaMenu(evt.target);
    }, 80);
  };

  reInitSlider = (menuItem) => {
    const swiper = menuItem.querySelector(this.selectors.swiper);
    if (!swiper) return;
    const itemIndex = menuItem.dataset.index;
    const slider = MinimogTheme && MinimogTheme.headerSliders[itemIndex];
    slider && slider.update();
  };

  getElementBoundingRect = async (element) => {
    const subMenu = element.querySelector(this.selectors.subMenu);
    if (subMenu) {
      const rect = subMenu.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top,
      };
    }
  };

  resetMegaMenu = () => {
    this.activeIndex = -1;

    clearTimeout(this.timeoutEnter);
    this.container &&
      this.container.classList.remove(
        this.classes.active,
        this.classes.slideFromRight,
        this.classes.slideReveal,
        "sf-header--bg-black",
        "sf-header--bg-white"
      );
  };

  windowWidth = () => {
    return window.innerWidth;
  };
  windowHeight = () => {
    return window.innerHeight;
  };

  destroy = () => {
    this.domNodes.menuItems.forEach((menuItem, index) => {
      menuItem.removeEventListener("mouseenter", (evt) => this.onMenuItemEnter(evt, index));
      menuItem.removeEventListener("mouseleave", (evt) => this.onMenuItemLeave(evt, index));
    });
  };
}
