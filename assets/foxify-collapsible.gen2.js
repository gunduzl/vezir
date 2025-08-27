if (!customElements.get(`x-collapsible-tab`)) {
  class FoxifyCollapsibleTab extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.init();
    }
    disconnectedCallback() {
      this.destroy();
    }
    init = () => {
      const destroy = this.dataset.destroy === "true";
      this.preventToggle = this.dataset.preventToggle === "true";
      if (destroy) return;

      this.setDefaultData();
      this.attachEvents();

      if (this.getAttribute("open") === "true") {
        this.selected = true;
        this.classList.add(this.expandedClass);
        this.setExpandedAria();
      } else {
        this.content.style.height = this.collapsedHeight;
        this.classList.add(this.collapsedClass);
        this.setCollapsedAria();
      }
      this.content.removeAttribute("hidden");
      if (!this.content.querySelector(".x-collapsible__content").innerHTML.trim()) {
        this.classList.add(this.emptyClass)
        if (this.hideIfEmpty) {
          this.classList.add(this.hiddenClass)
          if (this.closest('.x-collapsible-tab')) {
            this.closest('.x-collapsible-tab').classList.add(this.hiddenClass)
          }
        }
      }
    };

    transitionendEventName = () => {
      let i,
        el = document.createElement("div"),
        transitions = {
          transition: "transitionend",
          OTransition: "otransitionend",
          MozTransition: "transitionend",
          WebkitTransition: "webkitTransitionEnd",
        };

      for (i in transitions) {
        if (transitions.hasOwnProperty(i) && el.style[i] !== undefined) {
          return transitions[i];
        }
      }
    };

    expand = () => {
      const resetHeight = (ev) => {
        if (ev.target !== this.content) return;
        this.content.removeEventListener(this.transitionendevent, bindEvent);

        if (!this.isOpen) return;

        requestAnimationFrame(() => {
          this.content.style.transition = "0";
          this.content.style.height = "auto";

          requestAnimationFrame(() => {
            this.content.style.height = null;
            this.content.style.transition = null;

            this.setExpandedAria();
            this.classList.add(this.expandedClass);
            this.trySetTabIndex(this.content, 0);

            this.fire("tabOpened");
          });
        });
      };

      const bindEvent = resetHeight.bind(this);
      this.content.addEventListener(this.transitionendevent, bindEvent);

      this.isOpen = true;
      this.classList.remove(this.collapsedClass);
      this.content.style.height = this.content.scrollHeight + "px";
    };

    collapse = () => {
      const endTransition = (ev) => {
        if (ev.target !== this.content) return;
        this.content.removeEventListener(this.transitionendevent, bindEvent);

        if (this.isOpen) return;

        this.fire("elementClosed");
        this.setCollapsedAria();
        this.classList.add(this.collapsedClass);
        this.trySetTabIndex(this.content, -1);
      };

      const bindEvent = endTransition.bind(this);
      this.content.addEventListener(this.transitionendevent, bindEvent);

      this.isOpen = false;
      this.classList.remove(this.expandedClass);

      requestAnimationFrame(() => {
        this.content.style.transition = "0";
        this.content.style.height = this.content.scrollHeight + "px";

        requestAnimationFrame(() => {
          this.content.style.transition = null;
          this.content.style.height = this.collapsedHeight;
        });
      });
    };

    open = () => {
      this.selected = true;
      this.fire("elementSelected");
      this.expand();
      this.setAttribute("open", true);
    };

    close = () => {
      this.selected = false;
      this.fire("elementUnselected");
      this.collapse();
      this.removeAttribute("open");
    };

    toggle = (event) => {
      event?.preventDefault();
      if (this.selected) {
        if (this.preventToggle) {
          return;
        }

        this.close();
      } else {
        this.open();

        if (this.oneAtATime) {
          const parentElement = this.closest('.x-collapsible') || this.parentElement?.parentElement
          const allItems = parentElement.querySelectorAll("x-collapsible-tab");
          const parent = this.closest("[data-first-level]");
          if (allItems.length) {
            allItems.forEach((item) => {
              if (item !== this && item.selected && parent !== item) {
                item.close();
              }
            });
          }
        }
      }
      this.fire("toggle");
    };

    trySetTabIndex(el, index) {
      const tappableElements = el.querySelectorAll(this.defaultElements);
      if (tappableElements) {
        tappableElements.forEach((e) => {
          e.setAttribute("tabindex", index);
        });
      }
    }

    setExpandedAria = () => {
      this.trigger.setAttribute("aria-expanded", "true");
      this.content.setAttribute("aria-hidden", "false");
    };

    setCollapsedAria = (el) => {
      this.trigger.setAttribute("aria-expanded", "false");
      this.content.setAttribute("aria-hidden", "true");
    };

    attachEvents = () => {
      this.trigger.addEventListener("click", (event) => this.toggle(event));
    };

    setDefaultData = () => {
      this.events = {
        elementSelected: [],
        tabOpened: [],
        toggle: [],
        elementUnselected: [],
        elementClosed: [],
      };
      this.transitionendevent = this.transitionendEventName();
      this.emptyClass = "x-collapsible__item--empty";
      this.hiddenClass = "!x-hidden";
      this.expandedClass = "x-is-expanded";
      this.collapsedClass = "x-is-collapsed";
      this.trigger = this.querySelector("[data-trigger]");
      this.content = this.querySelector("[data-content]");
      this.collapsedHeight = "0px";
      this.defaultElements = [
        "a",
        "button",
        "input:not(.focus-none)",
        "[data-trigger]",
      ];
      this.oneAtATime = true;
      this.hideIfEmpty = this.dataset.hideIfEmpty === 'true'
      if (this.dataset.oneOpen) {
        this.oneAtATime = this.dataset.oneOpen === "true";
      }
    };

    fire = (eventName) => {
      let callbacks = this.events[eventName];
      for (let i = 0; i < callbacks?.length; i++) {
        callbacks[i](this);
      }
    };

    on = (eventName, cb) => {
      if (!this.events[eventName]) return;
      this.events[eventName].push(cb);
    };

    destroy = () => {
      this.trigger.removeEventListener("click", (event) => this.toggle(event));
      this.content.removeAttribute("aria-hidden");
      this.content.style.height = "auto";
      this.classList.remove(this.expandedClass, this.collapsedClass);
      this.removeAttribute("open");
    };
  }

  customElements.define(`x-collapsible-tab`, FoxifyCollapsibleTab);
}
