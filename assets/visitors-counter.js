class MVisitorCounter extends HTMLElement {
  constructor() {
    super();
    this.selectors = {
      liveViews: [".m-product-live-views"],
      stockCountdowns: [".prod__stock-countdown"],
    };
  }

  connectedCallback() {
    this.init();
  }

  init() {
    try {
      this.domNodes = queryDomNodes(this.selectors);
      this.initLiveViews();
    } catch (error) {
      console.error("Failed to init Boost Sales Helper");
    }
  }

  initLiveViews() {
    this.domNodes.liveViews &&
      this.domNodes.liveViews.forEach((liveViews) => {
        if (liveViews.dataset.initialized !== "true") {
          const liveViewElem = liveViews.querySelector(".live-views-text");
          const settings = liveViews.dataset;
          if (liveViewElem) {
            const lvtHTML = liveViewElem.innerHTML;
            liveViewElem.innerHTML = lvtHTML.replace(
              settings.liveViewsCurrent,
              `<span class="live-view-numb">${settings.liveViewsCurrent}</span>`
            );
            this.changeLiveViewsNumber(liveViewElem, settings);
          }
          liveViews.dataset.initialized = true;
        }
      });
  }

  changeLiveViewsNumber(liveViewElem, settings) {
    const numbElem = liveViewElem.querySelector(".live-view-numb");
    const { liveViewsDuration, liveViewsMax, liveViewsMin } = settings;
    const duration = Number(liveViewsDuration) || 5;
    const max = Number(liveViewsMax) || 30;
    const min = Number(liveViewsMin) || 20;

    if (numbElem) {
      setInterval(() => {
        const newViews = Math.floor(Math.random() * (max - min + 1)) + min;
        numbElem.textContent = newViews;
      }, duration * 1000);
    }
  }
}
customElements.define("m-visitiors-counter", MVisitorCounter);
