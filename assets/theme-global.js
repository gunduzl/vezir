MinimogTheme.pubSubEvents = {
  cartError: "cart-error",
  cartUpdate: "cart-update",
  openCartDrawer: "open-cart-drawer",
  openSearchPopup: "open-search-popup",
  closeSearchPopup: "close-search-popup",
  optionValueSelectionChange: 'option-value-selection-change',
  variantChange: "variant-change",
  quantityUpdate: 'quantity-update',
  quantityRules: 'quantity-rules',
  quantityBoundries: 'quantity-boundries'
};
const requestDefaultConfigs = {
  mode: "same-origin",
  credentials: "same-origin",
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json",
  },
};

MinimogTheme.config = {
  mqlMobile: false,
  mqlTablet: false,
  mediaQueryMobile: "screen and (max-width: 767px)",
  mediaQueryTablet: "screen and (max-width: 1023px)",
};

MinimogTheme.initWhenVisible = function (options) {
  const threshold = options.threshold ? options.threshold : 0;

  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (typeof options.callback === "function") {
            options.callback();
            observer.unobserve(entry.target);
          }
        }
      });
    },
    { rootMargin: `0px 0px ${threshold}px 0px` }
  );

  observer.observe(options.element);
};
(function () {
  // Trigger events when going between breakpoints
  const mql = window.matchMedia(MinimogTheme.config.mediaQueryMobile);
  MinimogTheme.config.mqlMobile = mql.matches;
  mql.onchange = (e) => {
    if (e.matches) {
      MinimogTheme.config.mqlMobile = true;
      document.dispatchEvent(new CustomEvent("matchMobile"));
    } else {
      MinimogTheme.config.mqlMobile = false;
      document.dispatchEvent(new CustomEvent("unmatchMobile"));
    }
  };

  // Tablet
  const mqltl = window.matchMedia(MinimogTheme.config.mediaQueryTablet);
  MinimogTheme.config.mqlTablet = mqltl.matches;
  mqltl.onchange = (e) => {
    if (e.matches) {
      MinimogTheme.config.mqlTablet = true;
      document.dispatchEvent(new CustomEvent("matchTablet"));
    } else {
      MinimogTheme.config.mqlTablet = false;
      document.dispatchEvent(new CustomEvent("unmatchTablet"));
    }
  };

  // Page transition
  var fader = document.querySelector(".m-page-transition");
  function __fadeInPage() {
    if (!window.AnimationEvent || !fader) return;

    let ignore_beforeunload = false;

    const loadingDesignMode = fader.dataset.designMode === "true";

    document.querySelectorAll("a[href^=mailto], a[href^=tel]").forEach((link) => {
      link.addEventListener("click", () => {
        ignore_beforeunload = true;
      });
    });

    if (loadingDesignMode && Shopify.designMode) {
      fader.classList.add("m-page-transition--design-mode");
    } else {
      // Page transition
      window.addEventListener("beforeunload", () => {
        if (!ignore_beforeunload) fader.classList.add("fade-in");
      });
      window.addEventListener("DOMContentLoaded", () => {
        document.documentElement.classList.remove("m:overflow-hidden");
        document.body.classList.remove("m:overflow-hidden");
        setScrollbarWidth();

        // fader.classList.remove('fade-in')
        setTimeout(() => {
          fader.classList.add("fade-out");
        }, 300);

        document.dispatchEvent(new CustomEvent("page:loaded"));
      });
      window.addEventListener("pageshow", (event) => {
        // Removes unload class when returning to page via history
        if (event.persisted) {
          fader.classList.remove("fade-in");
          // fader.classList.add('fade-out');
        }
      });
    }
  }
  __fadeInPage();
})();

class HTMLUpdateUtility {
  /**
   * Used to swap an HTML node with a new node.
   * The new node is inserted as a previous sibling to the old node, the old node is hidden, and then the old node is removed.
   *
   * The function currently uses a double buffer approach, but this should be replaced by a view transition once it is more widely supported https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
   */
  static viewTransition(oldNode, newContent, preProcessCallbacks = [], postProcessCallbacks = []) {
    if (!oldNode || !newContent) return;
    preProcessCallbacks?.forEach((callback) => callback(newContent));

    const newNodeWrapper = document.createElement('div');
    HTMLUpdateUtility.setInnerHTML(newNodeWrapper, newContent.outerHTML);
    const newNode = newNodeWrapper.firstChild;

    // dedupe IDs
    const uniqueKey = Date.now();
    oldNode.querySelectorAll('[id], [form]').forEach((element) => {
      element.id && (element.id = `${element.id}-${uniqueKey}`);
      element.form && element.setAttribute('form', `${element.form.getAttribute('id')}-${uniqueKey}`);
    });

    oldNode.parentNode.insertBefore(newNode, oldNode);
    oldNode.style.display = 'none';

    postProcessCallbacks?.forEach((callback) => callback(newNode));

    setTimeout(() => oldNode.remove(), 500);
  }

  // Sets inner HTML and reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
  static setInnerHTML(element, html) {
    element.innerHTML = html;
    element.querySelectorAll('script').forEach((oldScriptTag) => {
      const newScriptTag = document.createElement('script');
      Array.from(oldScriptTag.attributes).forEach((attribute) => {
        newScriptTag.setAttribute(attribute.name, attribute.value);
      });
      newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
      oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
    });
  }
}
class CountdownTimer {
  constructor(container, startTime, endTime, options = {}) {
    this.times = ["day", "hour", "min", "sec"];
    this.selectors = {
      day: ".countdown-timer-day",
      hour: ".countdown-timer-hour",
      min: ".countdown-timer-minute",
      sec: ".countdown-timer-sec",
    };
    this.DAY_IN_MS = 24 * 60 * 60 * 1000;
    this.HOUR_IN_MS = 60 * 60 * 1000;
    this.MIN_IN_MS = 60 * 1000;

    this.container = container;
    this.startTime = startTime;
    this.savedStartTime = startTime;
    this.endTime = endTime;
    this.options = Object.assign(
      {},
      {
        addZeroPrefix: true,
        loop: false,
        callback: () => { },
      },
      options
    );

    this.intervalTime = 1000;
    this.timer = null;
    this.domNodes = queryDomNodes(this.selectors, container);

    this.start();
  }

  start() {
    this.timer = setInterval(() => {
      if (this.startTime > this.endTime) this.stop();
      else this.update();
    }, this.intervalTime);

    this.container.style.removeProperty("opacity");
  }

  update() {
    const timeData = this.format(this.endTime - this.startTime);
    this.times.forEach((time) => {
      if (this.domNodes[time]) {
        this.domNodes[time].textContent = this.addZeroPrefix(timeData[time]);
      }
    });
    this.startTime += this.intervalTime;
  }

  stop() {
    clearInterval(this.timer);
    if (this.options.loop) {
      this.startTime = this.savedStartTime;
      this.start();
    } else {
      this.timer = null;
      this.options.callback();
    }
  }

  clear() {
    clearInterval(this.timer);
    this.timer = null;
    this.startTime = this.savedStartTime;
    this.times.forEach((time) => {
      if (this.domNodes[time]) {
        this.domNodes[time].textContent = "00";
      }
    });
  }

  addZeroPrefix(num) {
    if (this.options.addZeroPrefix && num < 10) {
      return `0${num}`;
    }
    return num.toString();
  }

  format(ms) {
    return {
      day: Math.floor(ms / this.DAY_IN_MS),
      hour: Math.floor(ms / this.HOUR_IN_MS) % 24,
      min: Math.floor(ms / this.MIN_IN_MS) % 60,
      sec: Math.floor(ms / 1000) % 60,
    };
  }
}
window.MinimogTheme.CountdownTimer = CountdownTimer;

class Tabs {
  constructor(container, cb = () => { }) {
    this.selectors = {
      tabHeaders: [".m-tab-header"],
      tabContents: [".m-tab-content"],
    };
    this.activeClass = "active";
    this.currentActiveIndex = -1;
    this.currentTab = null;
    this.container = container;
    this.cb = cb;
    this.domNodes = queryDomNodes(this.selectors, container);
    this.customSelect = this.container.querySelector("m-select-component");

    this.init();
    this.setActiveTab(0);
  }

  init() {
    addEventDelegate({
      context: this.container,
      selector: this.selectors.tabHeaders[0],
      handler: (e, tabHeader) => {
        e.preventDefault();
        let index;
        if (tabHeader) {
          index = Number(tabHeader.dataset.index);
        }
        this.setActiveTab(index);
        this.cb(tabHeader);
      },
    });
  }

  setActiveTab(tabIndex) {
    const { tabHeaders, tabContents } = this.domNodes;

    if (tabContents.length && tabIndex !== -1 && this.currentActiveIndex !== tabIndex) {
      let currHeader, newHeader, newTab;

      currHeader = tabHeaders && tabHeaders[this.currentActiveIndex];
      newHeader = tabHeaders && tabHeaders[tabIndex];

      if (this.customSelect && newHeader) {
        const tabHeaderStyle = this.customSelect.dataset.tabHeader;
        tabHeaderStyle === "select" && this.customSelect.updateCustomSelectChecked(tabIndex, newHeader.innerHTML);
        if (MinimogTheme.config.mqlMobile) {
          this.customSelect.updateCustomSelectChecked(tabIndex, newHeader.innerHTML);
        }
        document.addEventListener("matchMobile", () =>
          this.customSelect.updateCustomSelectChecked(tabIndex, newHeader.innerHTML)
        );
      }

      newTab = tabContents && tabContents[tabIndex];

      currHeader && currHeader.classList.remove(this.activeClass);
      this.currentTab && this.currentTab.classList.remove(this.activeClass);

      newHeader && newHeader.classList.add(this.activeClass);
      newTab && newTab.classList.add(this.activeClass);
      setTimeout(() => (newTab.style.opacity = 1));

      this.currentActiveIndex = tabIndex;
      this.currentTab = newTab;
    }
  }
}
window.MinimogTheme.Tabs = Tabs;

/*
 * Shopify Common JS
 *
 */
if (typeof window.Shopify == "undefined") {
  window.Shopify = {};
}
Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
};
Shopify.setSelectorByValue = function (selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener
    ? target.addEventListener(eventName, callback, false)
    : target.attachEvent("on" + eventName, callback);
};

Shopify.CountryProvinceSelector = function (country_domid, province_domid, options) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options["hideElement"] || province_domid);

  Shopify.addListener(this.countryEl, "change", Shopify.bind(this.countryHandler, this));

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    var value = this.countryEl.getAttribute("data-default");
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    var value = this.provinceEl.getAttribute("data-default");
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt.getAttribute("data-provinces");
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = "none";
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement("option");
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement("option");
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  },
};

function setScrollbarWidth() {
  document.documentElement.style.setProperty(
    "--m-scrollbar-width",
    `${window.innerWidth - document.documentElement.clientWidth}px`
  );
}

setScrollbarWidth();

function isStorageSupported(type) {
  // Return false if we are in an iframe without access to sessionStorage
  if (window.self !== window.top) {
    return false;
  }

  const testKey = "minimog:check";
  let storage;
  if (type === "session") {
    storage = window.sessionStorage;
  }
  if (type === "local") {
    storage = window.localStorage;
  }

  try {
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    // Do nothing, this may happen in Safari in incognito mode
    return false;
  }
}

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (event.target !== container && event.target !== last && event.target !== first) return;

    document.addEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== "TAB") return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if ((event.target === container || event.target === first) && event.shiftKey) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener("focusout", trapFocusHandlers.focusout);
  document.addEventListener("focusin", trapFocusHandlers.focusin);

  elementToFocus.focus();

  if (
    elementToFocus.tagName === "INPUT" &&
    ["search", "text", "email", "url"].includes(elementToFocus.type) &&
    elementToFocus.value
  ) {
    elementToFocus.setSelectionRange(0, elementToFocus.value.length);
  }
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener("focusin", trapFocusHandlers.focusin);
  document.removeEventListener("focusout", trapFocusHandlers.focusout);
  document.removeEventListener("keydown", trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function getRequestDefaultConfigs() {
  return JSON.parse(JSON.stringify(requestDefaultConfigs));
}

function fetchJSON(url, config = getRequestDefaultConfigs()) {
  return fetch(url, config).then(function (response) {
    if (!response.ok) {
      throw response;
    }
    return response.json();
  });
}

const cache = new Map();
function fetchCache(url, config = getRequestDefaultConfigs()) {
  return new Promise((resolve, reject) => {
    let cached = cache.get(url);
    if (cached) return resolve(cached);
    fetch(url, config)
      .then((res) => {
        cached = res.text();
        cache.set(url, cached);
        resolve(cached);
      })
      .catch(reject);
  });
}

const sectionCache = new Map();
function fetchSection(sectionId, options = {}) {
  const { url: _url, fromCache = false, params = {} } = options;

  return new Promise((resolve, reject) => {
    const url = new URL(_url || window.location.href);
    url.searchParams.set("section_id", sectionId);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    if (fromCache) {
      const cached = sectionCache.get(url);
      if (cached) return resolve(cached);
    }

    fetch(url, getRequestDefaultConfigs())
      .then((res) => {
        if (res.ok) return res.text();
        reject(`Failed to load section: ${sectionId}`);
      })
      .then((html) => {
        const div = generateDomFromString(html);
        sectionCache.set(url, div);
        resolve(div);
        // const div = <div />
        // div.innerHTML = html
        // sectionCache.set(url, div)
        // resolve(div)
      })
      .catch(reject);
  });
}

const cache2 = new Map();
function fetchJsonCache(url, config = requestDefaultConfigs) {
  return new Promise((resolve, reject) => {
    if (cache2.get(url)) {
      return resolve(cache2.get(url));
    }
    fetch(url, config)
      .then((res) => {
        if (res.ok) {
          const json = res.json();
          resolve(json);
          cache2.set(url, json);
          return json;
        } else {
          reject(res);
        }
      })
      .catch(reject);
  });
}

function formatMoney(cents, format) {
  const moneyFormat = "${{amount}}";
  if (typeof cents === "string") {
    cents = cents.replace(".", "");
  }
  let value = "";
  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  const formatString = format || moneyFormat;

  function formatWithDelimiters(number, precision = 2, thousands = ",", decimal = ".") {
    if (isNaN(number) || number == null) {
      return 0;
    }

    number = (number / 100.0).toFixed(precision);

    const parts = number.split(".");
    const dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${thousands}`);
    const centsAmount = parts[1] ? decimal + parts[1] : "";

    return dollarsAmount + centsAmount;
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case "amount":
      value = formatWithDelimiters(cents, 2);
      break;
    case "amount_no_decimals":
      value = formatWithDelimiters(cents, 0);
      break;
    case "amount_with_comma_separator":
      value = formatWithDelimiters(cents, 2, ".", ",");
      break;
    case "amount_no_decimals_with_comma_separator":
      value = formatWithDelimiters(cents, 0, ".", ",");
      break;
  }

  return formatString.replace(placeholderRegex, value);
}

function validateForm(form) {
  const missingFields = [];
  if (!form) return missingFields;
  const fieldSelectors = '[data-product-custom-field] [name][required]:not([hidden]):not([type="hidden"])';
  const requiredFields = form.querySelectorAll(fieldSelectors);
  requiredFields.forEach((field) => {
    field.classList.remove("form-control--warning");
    if (field.type === "radio") {
      const buttons = form.querySelectorAll(`input[name="${field.name}"]`);
      const selected = Array.from(buttons).some((btn) => btn.checked);
      if (!selected) {
        missingFields.push(field);
        field.classList.add("form-control--warning");
      }
    } else if (!field.value) {
      missingFields.push(field);
      field.classList.add("form-control--warning");
    }
  });
  return missingFields;
}

function generateDomFromString(value, tagName = "div") {
  const d = document.createElement(tagName);
  d.innerHTML = value;
  return d;
}

function generateDomeFromStringNew(value, selector = "div") {
  const dom = new DOMParser().parseFromString(value, "text/html");
  const newDom = dom.querySelector(selector);
  return newDom;
}

function fetchCountDown(collectionID) {
  const appURL = MinimogSettings.foxKitBaseUrl ? `https://${MinimogSettings.foxKitBaseUrl}` : "";

  return new Promise((resolve, reject) => {
    let requestUrl = `${appURL}/api/public/countdown?shop=${window.Shopify.shop}&collectionIds=${collectionID}`;

    fetch(requestUrl)
      .then((response) => response.json())
      .then(resolve)
      .catch(reject);
  });
}

function loadAssetsNew(files = [], id, callback = () => { }, options = {}) {
  const unique = id ? id : Math.random().toString(36).slice(2);
  if (!window.MinimogLibs.loadjs.isDefined(id)) window.MinimogLibs.loadjs(files, unique);
  window.MinimogLibs.loadjs.ready(unique, callback);
}

function pauseAllMedia(container = document) {
  container.querySelectorAll(".js-youtube").forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + "pauseVideo" + '","args":""}', "*");
  });
  container.querySelectorAll(".js-vimeo").forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', "*");
  });
  container.querySelectorAll("video").forEach((video) => video.pause());
  container.querySelectorAll("product-model").forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function loadJS(src, target = document.body, async = false, defer = true) {
  return new Promise((resolve, reject) => {
    const doc = target.ownerDocument;
    const currScript = doc.querySelector(`script[src="${src}"]`);
    if (currScript) {
      if (currScript.dataset.loaded) return resolve(true);
      currScript.addEventListener("load", () => {
        currScript.dataset.loaded = true;
        resolve(true);
      });
      return;
    }
    const script = doc.createElement("script");
    script.src = src;
    script.async = async;
    script.defer = defer;
    script.addEventListener("load", () => {
      script.dataset.loaded = true;
      resolve(true);
    });
    script.onerror = reject;
    target.appendChild(script);
  });
}

function loadCSS(href, target = document.head) {
  return new Promise((resolve, reject) => {
    const doc = target.ownerDocument;
    const currLink = doc.querySelector(`link[href="${href}"]`);
    if (currLink) {
      if (currLink.dataset.loaded) return resolve(true);
      currLink.addEventListener("load", () => {
        currLink.dataset.loaded = true;
        resolve(true);
      });
      return;
    }
    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.addEventListener("load", () => {
      link.dataset.loaded = true;
      resolve(true);
    });
    link.onerror = reject;
    target.appendChild(link);
  });
}

function addEventDelegate({ context = document.documentElement, event = "click", selector, handler, capture = false }) {
  const listener = function (e) {
    // loop parent nodes from the target to the delegation node
    for (let target = e.target; target && target !== this; target = target.parentNode) {
      if (target.matches(selector)) {
        handler.call(target, e, target);
        break;
      }
    }
  };
  context.addEventListener(event, listener, capture);
  return () => {
    context.removeEventListener(event, listener, capture);
  };
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function _validateOptionsArray(options) {
  if (Array.isArray(options) && typeof options[0] === "object") {
    throw new Error(options + "is not a valid array of options.");
  }
}

function _validateProductStructure(product) {
  if (typeof product !== "object") {
    throw new TypeError(product + " is not an object.");
  }

  if (Object.keys(product).length === 0 && product.constructor === Object) {
    throw new Error(product + " is empty.");
  }
}

function getVariantFromOptionArray(product, options) {
  _validateProductStructure(product);
  _validateOptionsArray(options);
  var result = product.variants.filter(function (variant) {
    return options.every(function (option, index) {
      return variant.options[index] === option;
    });
  });

  return result[0] || null;
}

function getSizedImageUrl(src, size) {
  if (size === null) {
    return src;
  }

  if (size === "master") {
    return removeProtocol(src);
  }

  var match = src.match(/\.(jpg|jpeg|gif|png|webp|bmp|bitmap|tiff|tif)(\?v=\d+)?$/i);

  if (match) {
    var prefix = src.split(match[0]);
    var suffix = match[0];

    return removeProtocol(prefix[0] + "_" + size + suffix);
  } else {
    return null;
  }
}

function removeProtocol(path) {
  return path.replace(/http(s)?:/, "");
}

function updateParam(key, value) {
  var { location } = window;
  var baseUrl = [location.protocol, "//", location.host, location.pathname].join("");

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  if (urlParams.has(key)) {
    if (value !== "" && value !== "undefined") {
      urlParams.set(key, value);
    }
    if (value === "" || value === "undefined") {
      urlParams.delete(key);
    }
  } else {
    if (value) urlParams.append(key, value);
  }

  window.history.replaceState({}, "", baseUrl + "?" + urlParams.toString());
  return false;
}

function createSearchLink(query) {
  const searchParams = new URLSearchParams({
    type: "product",
    ["options[unavailable_products]"]: "last",
    ["options[prefix]"]: "last",
    q: query,
  });

  const searchURL = window.MinimogSettings.routes.search_url;
  return `${searchURL}?${searchParams.toString()}`;
}

function refreshProductReview() {
  if (typeof SMARTIFYAPPS !== "undefined" && SMARTIFYAPPS.rv.installed) {
    SMARTIFYAPPS.rv.scmReviewsRate.actionCreateReviews();
  }
  if (typeof Yotpo !== "undefined" && typeof Yotpo.API === "function") {
    const yotpoApi = new Yotpo.API(yotpo);
    yotpoApi?.refreshWidgets();
  }
}

// SetPopularSearchLink
(function () {
  const popularSearchItems = document.querySelectorAll("[data-ps-item]");
  if (popularSearchItems) {
    popularSearchItems.forEach((itm) => (itm.href = createSearchLink(itm.dataset.psQuery)));
  }
})();

function queryDomNodes(selectors = {}, context = document) {
  const domNodes = Object.entries(selectors).reduce((acc, [name, selector]) => {
    const findOne = typeof selector === "string";
    const queryMethod = findOne ? "querySelector" : "querySelectorAll";
    const sl = findOne ? selector : selector[0];

    if (context) {
      acc[name] = context[queryMethod](sl);
    }
    if (!findOne && acc[name]) {
      acc[name] = [...acc[name]];
    }
    return acc;
  }, {});
  return domNodes;
}

function saleProgress(settings, productId, soldNumber) {
  const { total_quantity, sold_to, sold_from } = settings;
  let soldNumb;
  // const hour = new Date().getHours()
  if (soldNumber) {
    soldNumb = parseInt(soldNumber);
  } else {
    const hour = 4;
    const range = sold_to - sold_from;
    const timeRatio = hour / 24;
    const randomRatioById = (Number(productId.split("").pop()) + 1) / 10;
    let combinedRatio = timeRatio + randomRatioById;
    if (combinedRatio > 1) combinedRatio -= 1;

    const delta = Math.ceil(combinedRatio * range);
    soldNumb = sold_from + delta;
  }

  const availableNumb = total_quantity - soldNumb;
  const progress = (soldNumb * 100) / total_quantity;

  return `
    <div class="m-product-sale-progress">
      <div class="m-product-sale-progress__bar" data-flash-sale>
        <span data-sale-progress style="width: ${progress}%;" />
      </div>
      <div class="m-product-sale-progress__text">
        <div>
          <span>${MinimogStrings.sold}: </span>
          <strong data-sale-number>${soldNumb || 0}</strong>
        </div>
        <div>
          <span>${MinimogStrings.available}: </span>
          <strong data-available-number>${availableNumb || 0}</strong>
        </div>
      </div>
    </div>
  `;
}

function spinner(className = "") {
  return `<svg class="animate-spin m:hidden m-svg-icon--medium ${className}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>`;
}

function fetchConfig(type = "json") {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: `application/${type}` },
  };
}

function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  var expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) === " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function formatUrl(pageType, handle, query) {
  let url;
  const { routes } = MinimogSettings;
  const root = routes.root.endsWith("/") ? "" : routes.root;
  url = `${root}/${pageType}/${handle}`;
  if (query) url += `?${query}`;
  return url;
}
class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id*="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener("click", this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    if (!this.getAttribute("loaded")) {
      const content = document.createElement("div");
      content.appendChild(this.querySelector("template").content.firstElementChild.cloneNode(true));

      this.setAttribute("loaded", true);
      const deferredElement = this.appendChild(content.querySelector("video, model-viewer, iframe"));
      this.deferredElement = deferredElement;

      if (focus) deferredElement.focus();
      this.playVideo(deferredElement);
    }
  }

  playVideo(videoElm) {
    if (this.autoPlay) return;

    if (videoElm.classList.contains("js-youtube")) {
      const symbol = videoElm.src.indexOf("?") > -1 ? "&" : "?";
      videoElm.src += symbol + "autoplay=1&mute=1";
    } else if (videoElm.classList.contains("js-vimeo")) {
      const symbol = videoElm.src.indexOf("?") > -1 ? "&" : "?";
      videoElm.src += symbol + "autoplay=1&muted=1";
    } else {
      videoElm && videoElm.setAttribute("autoplay", "autoplay");
      videoElm && videoElm.play();
    }
  }
}
customElements.define("deferred-media", DeferredMedia);
class ResponsiveImage extends HTMLElement {
  get intersecting() {
    return this.hasAttribute("intersecting");
  }
  constructor() {
    super();
    this.img = this.querySelector("img");
    this.src = this.img.src;
    this.observerCallback = this.observerCallback.bind(this);
    if (this.img) {
      this.loadImage = this.loadImage.bind(this);
      this.img.onload = this.onLoad.bind(this);
    }
    if (this.img.complete) {
      this.onLoad();
    }
  }
  connectedCallback() {
    // this.img.src = "";
    if ("IntersectionObserver" in window) {
      this.initIntersectionObserver();
    } else {
      this.loadImage();
    }
  }
  disconnectedCallback() {
    this.disconnectObserver();
  }
  loadImage() {
    this.setAttribute("intersecting", "true");
    if (this.img) {
      this.img.src = this.src;
      this.img.width = this.clientWidth;
      this.img.height = this.clientHeight;
      this.img.sizes = this.clientWidth + "px";
    }
    window.MinimogEvents.emit(`m:image-loaded`, this.imageLoaded, this);
  }
  onLoad() {
    this.removeAttribute("");
    this.classList.add("m-image-loaded");
  }
  observerCallback(entries, observer) {
    if (!entries[0].isIntersecting) return;
    observer.unobserve(this);
    this.loadImage();
  }
  initIntersectionObserver() {
    if (this.observer) return;
    const rootMargin = "10px";
    this.observer = new IntersectionObserver(this.observerCallback, { rootMargin });
    this.observer.observe(this);
  }
  disconnectObserver() {
    if (!this.observer) return;
    this.observer.disconnect();
    this.observer = null;
    delete this.observer;
  }
}
customElements.define("responsive-image", ResponsiveImage);

class ProductRecommendations extends HTMLElement {
  constructor() {
    super();

    this.selectors = {
      gridContainer: ".m-product-list",
      swiperWrapper: ".swiper-wrapper",
      slideControls: ".m-slider-controls",
    };

    this.enableSlider = this.dataset.enableSlider === "true";
    this.useScrollMobile = this.dataset.useScrollMobile === "true";
    this.itemsPerPage = this.dataset.itemsPerPage;
    this.paginationType = this.dataset.paginationType;
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);
      fetch(this.dataset.url)
        .then((response) => response.text())
        .then((text) => {
          const html = generateDomFromString(text);
          const recommendations = html.querySelector("product-recommendations");
          if (recommendations && recommendations.innerHTML.trim().length) {
            this.innerHTML = recommendations.innerHTML;
            this.totalProducts = recommendations.querySelectorAll(".m-product-card").length;

            this.initByScreenSize();
            document.addEventListener("matchMobile", () => {
              this.initByScreenSize();
            });
            document.addEventListener("unmatchMobile", () => {
              this.initByScreenSize();
            });
          }
        })
        .catch((e) => {
          console.error(e);
        });
    };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(handleIntersection.bind(this), { rootMargin: "0px 0px 400px 0px" }).observe(this);
    }
  }

  initByScreenSize() {
    const { gridContainer, slideControls } = queryDomNodes(this.selectors, this);

    if (MinimogTheme.config.mqlMobile) {
      this.initSlider();
      if (!this.useScrollMobile) return;
      gridContainer && gridContainer.classList.remove("swiper-container");
      slideControls && slideControls.classList.add("m:hidden");
      if (this.swiper) this.swiper.destroy(false, true);
      gridContainer && gridContainer.parentNode.classList.add("m-mixed-layout--mobile-scroll");
    } else {
      gridContainer && gridContainer.classList.add("swiper-container");
      gridContainer && gridContainer.parentNode.classList.remove("m-mixed-layout--mobile-scroll");
      slideControls && slideControls.classList.remove("m:hidden");
      this.initSlider();
    }
  }

  initSlider() {
    let __this = this;
    const { gridContainer, slideControls } = queryDomNodes(this.selectors, this);
    if (this.enableSlider && this.totalProducts > this.itemsPerPage) {
      this.slider = new MinimogLibs.Swiper(gridContainer, {
        slidesPerView: this.itemsPerPage >= 2 ? 2 : 1,
        loop: true,
        autoplay: false,
        pagination: {
          el: this.querySelector(".swiper-pagination"),
          clickable: true,
          type: this.paginationType,
        },
        threshold: 2,
        breakpoints: {
          1280: {
            slidesPerView: this.itemsPerPage,
          },
        },
        on: {
          init: function () {
            this.slideToLoop(this.lastActive);
            setTimeout(() => {
              // Calculate controls position
              const firstItem = __this.querySelector(".m-image") || __this.querySelector(".m-placeholder-svg");
              const prevButton = slideControls && slideControls.querySelector(".m-slider-controls__button-prev");
              const nextButton = slideControls && slideControls.querySelector(".m-slider-controls__button-next");
              if (firstItem && slideControls) {
                const itemHeight = firstItem.clientHeight;
                slideControls.style.setProperty("--offset-top", parseInt(itemHeight) / 2 + "px");

                prevButton.classList.remove("m:hidden");
                nextButton.classList.remove("m:hidden");
              }
            }, 200);
          },
        },
      });

      if (this.slider) {
        slideControls && slideControls.classList.remove("m:hidden");
        const prevBtn = this.querySelector(".m-slider-controls__button-prev");
        const nextBtn = this.querySelector(".m-slider-controls__button-next");
        prevBtn && prevBtn.addEventListener("click", () => this.slider.slidePrev());
        nextBtn && nextBtn.addEventListener("click", () => this.slider.slideNext());
      }

      this.swiper = gridContainer?.swiper;
    } else {
      const innerContainer = gridContainer.querySelector(".m-mixed-layout__inner");
      innerContainer && innerContainer.classList.remove("swiper-wrapper");
      slideControls && slideControls.classList.add("m:hidden");
      gridContainer && gridContainer.classList.remove("swiper-container");
    }
  }
}
customElements.define("product-recommendations", ProductRecommendations);

if (!customElements.get("video-component")) {
  customElements.define(
    "video-component",
    class VideoComponent extends HTMLElement {
      constructor() {
        super();
        MinimogTheme.initWhenVisible({
          element: this,
          callback: this.init.bind(this),
          threshold: 0,
        });
      }

      init() {
        this.autoPlay = this.dataset.autoPlay === "true";
        this.muted = this.dataset.muted === "true";
        const poster = this.querySelector('[id^="Video-Deferred-Poster-"]');
        if (this.autoPlay) {
          this.loadContent();
        } else {
          poster && poster.addEventListener("click", this.loadContent.bind(this));
        }
      }

      loadContent() {
        if (!this.getAttribute("loaded")) {
          const content = document.createElement("div");
          content.appendChild(this.querySelector("template").content.firstElementChild.cloneNode(true));

          this.setAttribute("loaded", true);
          const deferredElement = this.appendChild(content.querySelector("video, model-viewer, iframe"));
          this.deferredElement = deferredElement;

          if (this.autoPlay) return;

          if (this.deferredElement.classList.contains("js-youtube")) {
            const symbol = this.deferredElement.src.indexOf("?") > -1 ? "&" : "?";
            this.deferredElement.src += symbol + `autoplay=1${this.muted ? "&mute=1" : ""}`;
          } else if (this.deferredElement.classList.contains("js-vimeo")) {
            const symbol = this.deferredElement.src.indexOf("?") > -1 ? "&" : "?";
            this.deferredElement.src += symbol + `autoplay=1${this.muted ? "&mute=1" : ""}`;
          } else {
            this.deferredElement.play();
          }
        }
      }
    }
  );
}

if (!customElements.get("collapsible-tab")) {
  class CollapsibleTab extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.parentEl = this.closest("[data-section-id]");
      this.init();
    }

    disconnectedCallback() {
      this.destroy();
    }

    init() {
      const destroy = this.dataset.destroy === "true";
      if (destroy) return;

      this.setDefaultData();
      this.attachEvents();

      if (this.getAttribute("open") === "true") {
        this.selected = true;
        this.classList.add(this.expandedClass);
        this.setExpandedAria();
        this.fire("tabOpened");
        window.MinimogEvents.emit(`ON_COLLAPSIBLE_TAB_OPENED`, this);
      } else {
        this.content.style.height = this.collapsedHeight;
        this.classList.add(this.collapsedClass);
        this.setCollapsedAria();
      }
      this.content.removeAttribute("hidden");
    }

    transitionendEventName() {
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
    }

    expand() {
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
            window.MinimogEvents.emit(`ON_COLLAPSIBLE_TAB_OPENED`, this);
          });
        });
      };

      const bindEvent = resetHeight.bind(this);
      this.content.addEventListener(this.transitionendevent, bindEvent);

      this.isOpen = true;
      this.classList.remove(this.collapsedClass);
      this.content.style.height = this.content.scrollHeight + "px";
    }

    collapse() {
      const endTransition = (ev) => {
        if (ev.target !== this.content) return;
        this.content.removeEventListener(this.transitionendevent, bindEvent);

        if (this.isOpen) return;

        this.fire("elementClosed");
        window.MinimogEvents.emit(`ON_COLLAPSIBLE_TAB_CLOSED`, this);
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
    }

    open() {
      this.selected = true;
      this.fire("elementSelected");
      window.MinimogEvents.emit(`ON_COLLAPSIBLE_TAB_SELECTED`, this);
      this.expand();
      this.setAttribute("open", true);
    }

    close() {
      this.selected = false;
      this.fire("elementUnselected");
      window.MinimogEvents.emit(`ON_COLLAPSIBLE_TAB_UNSELECTED`, this);
      this.collapse();
      this.removeAttribute("open");
    }

    toggle(event) {
      if (event) {
        event.preventDefault();
      }
      if (this.selected) {
        this.close();
      } else {
        this.open();

        if (this.oneAtATime) {
          const allItems = this.parentEl.querySelectorAll("collapsible-tab");
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
    }

    trySetTabIndex(el, index) {
      const tappableElements = el.querySelectorAll(this.defaultElements);
      if (tappableElements) {
        tappableElements.forEach((e) => {
          e.setAttribute("tabindex", index);
        });
      }
    }

    setExpandedAria() {
      this.trigger.setAttribute("aria-expanded", "true");
      this.content.setAttribute("aria-hidden", "false");
    }

    setCollapsedAria(el) {
      this.trigger.setAttribute("aria-expanded", "false");
      this.content.setAttribute("aria-hidden", "true");
    }

    attachEvents() {
      this.trigger.addEventListener("click", (event) => this.toggle(event));
    }

    setDefaultData() {
      this.events = {
        elementSelected: [],
        tabOpened: [],
        elementUnselected: [],
        elementClosed: [],
      };
      this.transitionendevent = this.transitionendEventName();
      this.expandedClass = "is-expanded";
      this.collapsedClass = "is-collapsed";
      this.trigger = this.querySelector("[data-trigger]");
      this.content = this.querySelector("[data-content]");
      this.collapsedHeight = "0px";
      this.defaultElements = ["a", "button", "input:not(.focus-none)", "[data-trigger]"];
      this.oneAtATime = true;
      if (this.dataset.oneOpen) {
        this.oneAtATime = this.dataset.oneOpen === "true";
      }
    }

    fire(eventName) {
      let callbacks = this.events[eventName];
      if (callbacks) {
        for (let i = 0; i < callbacks.length; i++) {
          callbacks[i](this);
        }
      }
    }

    on(eventName, cb) {
      if (!this.events[eventName]) return;
      this.events[eventName].push(cb);
    }

    destroy() {
      this.trigger.removeEventListener("click", (event) => this.toggle(event));
      this.content.removeAttribute("aria-hidden");
      this.content.style.height = "auto";
      this.classList.remove(this.expandedClass, this.collapsedClass);
      this.removeAttribute("open");
    }
  }

  customElements.define("collapsible-tab", CollapsibleTab);
}

if (!customElements.get("product-form")) {
  customElements.define(
    "product-form",
    class ProductForm extends HTMLElement {
      constructor() {
        super();
        this.selectors = {
          form: "form",
          inputId: "[name=id]",
          submitButton: '[name="add"]',
          errorWrapper: ".m-product-form-message",
          customFields: ["[data-product-custom-field]"],
          dynamicCheckout: ".m-product-dynamic-checkout",
        };
      }
      connectedCallback() {
        this.domNodes = queryDomNodes(this.selectors, this);
        this.form = this.domNodes.form;
        this.productInfo = this.closest(".m-main-product--info");
        this.submitButton = this.domNodes.submitButton;
        this.domNodes.inputId.disabled = false;
        this.cart = document.querySelector("m-cart-drawer");
        this.cartPage = document.querySelector("m-cart");
        this.customFields = document.querySelectorAll(this.selectors.customFields);
        if (this.domNodes.dynamicCheckout) this.enable_dynamic_checkout = true;
        this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
        if (this.domNodes.dynamicCheckout && this.customFields) {
          this.domNodes.dynamicCheckout.addEventListener(
            "click",
            (e) => {
              const missing = validateForm(this.form.closest(".m-main-product--info"));
              if (missing && missing.length > 0) {
                e.stopPropagation();
                window.MinimogTheme.Notification.show({
                  target: this.domNodes.errorWrapper,
                  method: "appendChild",
                  type: "warning",
                  message: window.MinimogStrings.requiredField,
                  delay: 100,
                });
                console.warn("Missing field(s): ", missing);
              }
            },
            true
          );
        }
      }
      toggleSpinner(show) {
        const method = show ? "add" : "remove";
        this.classList[method]("m-spinner-loading");
      }
      getFormData() {
        const formData = new FormData(this.form);
        if (this.closest('sticky-atc')) {
          const form = document.querySelector('.m-main-product--info .m-product-form--main form');
          const extraFormData = new FormData(form);

          for (const [key, value] of extraFormData.entries()) {
            if (!formData.has(key)) {
              formData.set(key, value);
            }
          }
        }

        return formData;
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        this.toggleSpinner(true);
        const missing = validateForm(this.form.closest(".m-main-product--info"));

        if (missing && missing.length > 0) {
          console.warn("Missing field(s): ", missing);
          this.toggleSpinner(false);
          return window.MinimogTheme.Notification.show({
            target: this.domNodes.errorWrapper,
            method: "appendChild",
            type: "warning",
            message: window.MinimogStrings.requiredField,
          });
        }

        let sectionsToBundle = [];
        document.documentElement.dispatchEvent(
          new CustomEvent('cart:grouped-sections', { bubbles: true, detail: { sections: sectionsToBundle } })
        );

        const config = fetchConfig("javascript");
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers["Content-Type"];

        const formData = this.getFormData();
        formData.append("sections", sectionsToBundle);
        formData.append("sections_url", window.location.pathname);

        config.body = formData;

        const { MinimogSettings, MinimogStrings } = window;
        fetch(`${MinimogSettings.routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            // Handle Error
            if (response.status) {
              window.MinimogEvents.emit(MinimogTheme.pubSubEvents.cartError, {
                source: "product-form",
                productVariantId: formData.get("id"),
                errors: response.error || response.description,
                message: response.message,
              });
              document.dispatchEvent(
                new CustomEvent("product-ajax:error", {
                  detail: {
                    errorMessage: response.error || response.description,
                  },
                })
              );
              this.error = true;
              const variantId = formData.get("id");
              if (variantId === "" || variantId === null) {
                this.handleErrorMessageVariantPicker();
                return window.MinimogTheme.Notification.show({
                  target: this.domNodes.errorWrapper ? this.domNodes.errorWrapper : document.body,
                  method: "appendChild",
                  type: "error",
                  message: MinimogStrings.selectVariant,
                  last: 3000,
                  sticky: !this.domNodes.errorWrapper,
                });
              } else {
                return window.MinimogTheme.Notification.show({
                  target: this.domNodes.errorWrapper ? this.domNodes.errorWrapper : document.body,
                  method: "appendChild",
                  type: "error",
                  message: response.message,
                  last: 3000,
                  sticky: !this.domNodes.errorWrapper,
                });
              }
            }

            if (MinimogSettings.use_ajax_atc) {
              // Handle Ajax ATC
              if (this.cart && MinimogSettings.enable_cart_drawer) {
                MinimogTheme.Notification.show({
                  target: this.cart.querySelector("m-cart-items"),
                  method: "prepend",
                  type: "success",
                  message: MinimogStrings.itemAdded,
                  delay: 400,
                });
                // Open cart drawer
                this.cart.open();
              } else {
                window.MinimogTheme.Notification.show({
                  target: this.domNodes.errorWrapper ? this.domNodes.errorWrapper : document.body,
                  method: "appendChild",
                  type: "success",
                  message: MinimogStrings.itemAdded,
                  last: 3000,
                  sticky: !this.domNodes.errorWrapper,
                });
              }

              window.MinimogEvents.emit(MinimogTheme.pubSubEvents.cartUpdate, { cart: response, productVariantId: formData.get('id') });

              // dispatch product added event
              document.dispatchEvent(
                new CustomEvent("product-ajax:added", {
                  detail: {
                    product: response,
                  },
                })
              );

              this.error = false;

            } else {
              window.location = MinimogSettings.routes.cart;
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.toggleSpinner(false);
          });
      }
      handleErrorMessageVariantPicker() {
        const variantPicker = this.productInfo && this.productInfo.querySelector("variant-picker");
        const options = variantPicker && variantPicker.querySelectorAll("[data-selected-value]");

        options &&
          options.forEach((option) => {
            const value = option.dataset.selectedValue;
            if (value === "") {
              option.classList.add("m-product-option--unselect");
              setTimeout(() => {
                option.classList.remove("m-product-option--unselect");
              }, 3000);
            }
          });
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    }
  );
}

if (!customElements.get("m-video-component")) {
  class VideoComponent extends HTMLElement {
    constructor() {
      super();
      this.background = this.dataset.initMode !== "template";
      if (this.background) {
        MinimogTheme.initWhenVisible({
          element: this,
          callback: this.init.bind(this),
          threshold: 0,
        });
      } else {
        this.init();
      }
    }

    init() {
      this.parentSelector = this.dataset.parent || ".m-hero__bg";
      this.parent = this.closest(this.parentSelector);

      switch (this.dataset.type) {
        case "youtube":
          this.initYoutubeVideo();
          break;

        case "vimeo":
          this.initVimeoVideo();
          break;

        case "mp4":
          this.initMp4Video();
          break;
      }
    }

    initYoutubeVideo() {
      this.setAsLoading();
      this.loadScript("youtube").then(this.setupYoutubePlayer.bind(this));
    }

    initVimeoVideo() {
      this.setAsLoading();
      this.loadScript("vimeo").then(this.setupVimeoPlayer.bind(this));
    }

    initMp4Video() {
      const player = this.querySelector("video");

      if (player) {
        const promise = player.play();

        // Edge does not return a promise (video still plays)
        if (typeof promise !== "undefined") {
          promise
            .then(function () {
              // playback normal
            })
            .catch(function () {
              player.setAttribute("controls", "");
            });
        }
      }
    }

    loadScript(videoType) {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        document.body.appendChild(script);
        script.onload = resolve;
        script.onerror = reject;
        script.async = true;
        script.src = videoType === "youtube" ? "//www.youtube.com/iframe_api" : "//player.vimeo.com/api/player.js";
      });
    }

    setAsLoading() {
      this.parent.setAttribute("loading", true);
    }

    setAsLoaded() {
      this.parent.removeAttribute("loading");
      this.parent.setAttribute("loaded", true);
    }

    setupYoutubePlayer() {
      const videoId = this.dataset.videoId;
      const playerInterval = setInterval(() => {
        if (window.YT) {
          window.YT.ready(() => {
            const element = document.createElement("div");
            this.appendChild(element);

            this.player = new YT.Player(element, {
              videoId: videoId,
              playerVars: {
                showinfo: 0,
                controls: false,
                fs: 0,
                rel: 0,
                height: "100%",
                width: "100%",
                iv_load_policy: 3,
                html5: 1,
                loop: 1,
                playsinline: 1,
                modestbranding: 1,
                disablekb: 1,
              },
              events: {
                onReady: this.onYoutubeReady.bind(this),
                onStateChange: this.onYoutubeStateChange.bind(this),
              },
            });
            clearInterval(playerInterval);
          });
        }
      }, 50);
    }

    onYoutubeReady() {
      this.iframe = this.querySelector("iframe"); // iframe once YT loads
      this.iframe.setAttribute("tabindex", "-1");
      if (typeof this.player.mute === "function") this.player.mute();
      if (typeof this.player.playVideo === "function") this.player.playVideo();

      this.setAsLoaded();

      // pause when out of view
      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
          (entries, _observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.youtubePlay();
              } else {
                this.youtubePause();
              }
            });
          },
          { rootMargin: "0px 0px 50px 0px" }
        );

        observer.observe(this.iframe);
      }
    }

    onYoutubeStateChange(event) {
      switch (event.data) {
        case -1: // unstarted
          // Handle low power state on iOS by checking if
          // video is reset to unplayed after attempting to buffer
          if (this.attemptedToPlay) {
            this.setAsLoaded();
            // this.closest('.banner').classList.add('video-interactable');
          }
          break;
        case 0: // ended, loop it
          this.youtubePlay();
          break;
        case 1: // playing
          this.setAsLoaded();
          break;
        case 3: // buffering
          this.attemptedToPlay = true;
          break;
      }
    }

    youtubePlay() {
      if (this.player && typeof this.player.playVideo === "function") {
        this.player.playVideo();
      }
    }

    youtubePause() {
      if (this.player && typeof this.player.pauseVideo === "function") {
        this.player.pauseVideo();
      }
    }

    setupVimeoPlayer() {
      const videoId = this.dataset.videoId;

      const playerInterval = setInterval(() => {
        if (window.Vimeo) {
          this.player = new Vimeo.Player(this, {
            id: videoId,
            autoplay: true,
            autopause: false,
            background: false,
            controls: false,
            loop: true,
            height: "100%",
            width: "100%",
          });
          this.player.ready().then(this.onVimeoReady.bind(this));
          clearInterval(playerInterval);
        }
      }, 50);
    }

    onVimeoReady() {
      this.iframe = this.querySelector("iframe");
      this.iframe.setAttribute("tabindex", "-1");

      this.player.setMuted(true);

      this.setAsLoaded();

      // pause when out of view
      const observer = new IntersectionObserver(
        (entries, _observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.vimeoPlay();
            } else {
              this.vimeoPause();
            }
          });
        },
        { rootMargin: "0px 0px 50px 0px" }
      );

      observer.observe(this.iframe);
    }

    vimeoPlay() {
      if (this.player && typeof this.player.play === "function") {
        this.player.play();
      }
    }

    vimeoPause() {
      if (this.player && typeof this.player.pause === "function") {
        this.player.pause();
      }
    }
  }
  customElements.define("m-video-component", VideoComponent);
}

if (!customElements.get("m-search-popup")) {
  class MSearchPopup extends HTMLElement {
    constructor() {
      super();

      this.selectors = {
        container: "[data-search-container]",
        form: "form",
        input: "[data-search-input]",
        submit: 'button[type="submit"]',
        loading: "[data-spinner]",
        close: "[data-close-search]",
      };

      const searchPopup = document.querySelector("[data-search-popup]");
      if (!searchPopup) return;

      this.domNodes = queryDomNodes(this.selectors, searchPopup);
      this.domNodes.searchPopup = searchPopup;
      document.body.appendChild(searchPopup);
      addEventDelegate({
        selector: "[data-open-search-popup]",
        handler: () => this.openSearchPopup(),
      });

      const { input, submit, close, form } = this.domNodes;
      if (input) {
        input.addEventListener("keydown", (e) => {
          // ESC
          if (e.keyCode === 27) {
            this.closeSearchPopup();
          }
        });
      }
      submit.addEventListener("click", (e) => {
        e.preventDefault();
        if (input.value) {
          form.submit();
        }
      });
      close.addEventListener("click", (e) => {
        this.closeSearchPopup();
        MinimogEvents.emit(MinimogTheme.pubSubEvents.closeSearchPopup);
      });
      searchPopup.addEventListener("click", (e) => {
        if (e.target === searchPopup) {
          this.closeSearchPopup();
        }
      });

      MinimogEvents.subscribe(MinimogTheme.pubSubEvents.openCartDrawer, () => {
        if (this.hasAttribute("open")) this.closeSearchPopup();
      });
    }

    openSearchPopup() {
      const { searchPopup, input, container } = this.domNodes;
      searchPopup.style.removeProperty("visibility");
      searchPopup.style.setProperty("opacity", "1");
      container.classList.add("m-show-search");
      this.setAttribute("open", true);
      setTimeout(() => {
        container.style.removeProperty("--m-durations");
        input.focus();
      }, 350);
      document.documentElement.classList.add("prevent-scroll");
      MinimogEvents.emit(MinimogTheme.pubSubEvents.openSearchPopup, this);
    }

    closeSearchPopup() {
      const { searchPopup, container } = this.domNodes;
      container.classList.remove("m-show-search");
      searchPopup.style.setProperty("opacity", "0");
      setTimeout(() => {
        searchPopup.style.setProperty("visibility", "hidden");
        container.style.setProperty("--m-durations", ".3s");
        document.documentElement.classList.remove("prevent-scroll");
        this.removeAttribute("open");
      }, 350);
    }
  }

  customElements.define("m-search-popup", MSearchPopup);
}

if (!customElements.get("m-select-component")) {
  class MSelectComponent extends HTMLElement {
    constructor() {
      super();

      this.selectors = {
        elSelectNative: ".js-selectNative",
        elSelectCustom: ".js-selectCustom",
        elSelectCustomBox: ".m-select-custom--trigger",
        elSelectCustomOpts: ".m-select-custom--options",
        elSelectCustomTriggerText: ".m-select-custom--trigger-text",
        customOptionList: [".m-select-custom--option"],
      };

      this.domNodes = queryDomNodes(this.selectors, this);
      this.optionChecked = "";

      window.addEventListener("DOMContentLoaded", () => {
        this.classList.remove("m:hidden");
      });
      this.setDefaultValue();
      this.initSelect();
    }

    setDefaultValue() {
      const { elSelectNative } = this.domNodes;
      const value = elSelectNative.options[elSelectNative.selectedIndex].value;
      const text = elSelectNative.options[elSelectNative.selectedIndex].text;
      this.updateCustomSelectChecked(value, text);
    }

    initSelect() {
      this.classList.remove("m:hidden");
      const { elSelectNative, elSelectCustom, elSelectCustomBox } = this.domNodes;

      elSelectCustomBox.addEventListener("click", () => {
        const isClose = !elSelectCustom.classList.contains("isActive");
        if (isClose) {
          this.openSelect();
        } else {
          this.closeSelect();
        }
      });

      this.domNodes.customOptionList.forEach((option) => {
        option.addEventListener("click", (e) => {
          const value = e.target.getAttribute("data-value");
          elSelectNative.value = value;
          this.closeSelect();
          this.updateCustomSelectChecked(value, e.target.textContent);
          elSelectNative.dispatchEvent(new Event("change"));
          elSelectNative.dispatchEvent(new Event("click"));
        });
      });
    }

    openSelect() {
      const allCustomSelect = document.querySelectorAll("m-select-component");
      document.addEventListener("click", (e) => this.handleClickOutside(e));
      if (allCustomSelect.length > 0) {
        allCustomSelect.forEach((select) => {
          select.closeSelect();
        });
      }
      this.domNodes.elSelectCustom.classList.add("isActive");
    }

    closeSelect() {
      this.domNodes.elSelectCustom.classList.remove("isActive");
    }

    updateCustomSelectChecked(value, text) {
      const { elSelectCustomOpts, elSelectCustomTriggerText } = this.domNodes;
      const prevValue = this.optionChecked;
      const elPrevOption = elSelectCustomOpts.querySelector(`[data-value="${prevValue}"`);

      const elOption = elSelectCustomOpts.querySelector(`[data-value="${value}"`);

      if (elPrevOption) {
        elPrevOption.classList.remove("isActive");
      }

      if (elOption) {
        elOption.classList.add("isActive");
      }

      elSelectCustomTriggerText.textContent = text;
      this.optionChecked = value;
    }

    handleClickOutside(e) {
      const { elSelectCustom } = this.domNodes;
      const didClickedOutside = !elSelectCustom.contains(e.target);
      if (didClickedOutside) {
        this.closeSelect();
      }
    }
  }

  customElements.define("m-select-component", MSelectComponent);
}

class MQuantityInput extends HTMLElement {
  quantityUpdateUnsubscriber = undefined;

  constructor() {
    super();
  }

  get sectionId() {
    return this.getAttribute("data-section-id");
  }

  get productId() {
    return this.getAttribute("data-product-id");
  }

  get input() {
    return this.querySelector("input");
  }

  get value() {
    return this.input.value;
  }

  connectedCallback() {
    this.changeEvent = new Event("change", { bubbles: true });

    this.input.addEventListener("change", this.onInputChange.bind(this));
    this.input.addEventListener('focus', () => setTimeout(() => this.input.select()));

    this.querySelectorAll("button").forEach((button) =>
      button.addEventListener("click", this.onButtonClick.bind(this))
    );

    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = MinimogEvents.subscribe(
      MinimogTheme.pubSubEvents.quantityUpdate,
      this.validateQtyRules.bind(this)
    );

    // Sync 2 inputs inside product info and sticky ATC
    this.shouldSync = this.closest('.m-main-product--info') || this.closest('sticky-atc');
    if (this.shouldSync) {
      window.addEventListener("syncProductQuantity", (event) => {
        if (event.detail !== this.input.value) {
          this.input.value = event.detail;
          this.validateQtyRules();
        }
      });
    }
  }
  onInputChange() {
    if (this.shouldSync) {
      window.dispatchEvent(new CustomEvent("syncProductQuantity", { detail: this.input.value }));
    }

    this.validateQtyRules();
  }
  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    if (event.currentTarget.name === 'plus') {
      if (parseInt(this.input.getAttribute('data-min')) > parseInt(this.input.step) && this.input.value == 0) {
        this.input.value = this.input.getAttribute('data-min');
      } else {
        this.input.stepUp();
      }
    } else {
      this.input.stepDown();
    }

    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);

    if (this.input.getAttribute('data-min') === previousValue && event.currentTarget.name === 'minus') {
      this.input.value = parseInt(this.input.min);
    }
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    const buttonMinus = this.querySelector(".m-quantity__button[name='minus']");
    const buttonPlus = this.querySelector(".m-quantity__button[name='plus']");

    if (this.input.min) {
      const min = parseInt(this.input.min);
      buttonMinus.classList.toggle("m:disabled", value <= min);
    } else {
      buttonMinus.classList.remove("m:disabled");
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      buttonPlus.classList.toggle("m:disabled", value >= max);
    } else {
      buttonPlus.classList.remove("m:disabled");
    }
  }

  updateQuantityRules(sectionId, productId, parsedHTML) {
    if (sectionId !== this.sectionId || productId !== this.productId) return;
    const selectors = [
      ".m-quantity__input",
      ".quantity__rules",
      ".m-product-option--label",
    ];
    const quantityFormUpdated = parsedHTML.getElementById(
      `QuantityForm-${sectionId}`
    );
    const quantityForm = this.closest(`#QuantityForm-${sectionId}`);
    for (let selector of selectors) {
      const current = quantityForm.querySelector(selector);
      const updated = quantityFormUpdated.querySelector(selector);
      if (!current || !updated) continue;

      if (selector === ".m-quantity__input") {
        const attributes = [
          "data-cart-quantity",
          "data-min",
          "data-max",
          "step",
        ];
        for (let attribute of attributes) {
          const valueUpdated = updated.getAttribute(attribute);
          if (valueUpdated !== null) {
            current.setAttribute(attribute, valueUpdated);
          } else {
            current.removeAttribute(attribute);
          }
        }
      } else {
        current.innerHTML = updated.innerHTML;
      }
    }
  }

  setQuantityBoundries(sectionId, productId) {
    if (sectionId !== this.sectionId || productId !== this.productId) return;

    const data = {
      cartQuantity: this.input.hasAttribute("data-cart-quantity")
        ? parseInt(this.input.getAttribute("data-cart-quantity"))
        : 0,
      min: this.input.hasAttribute("data-min") && this.input.getAttribute("data-min")
        ? parseInt(this.input.getAttribute("data-min"))
        : 1,
      max: this.input.hasAttribute("data-max") && this.input.getAttribute("data-max")
        ? parseInt(this.input.getAttribute("data-max"))
        : null,
      step: this.input.hasAttribute("step") && this.input.getAttribute("step")
        ? parseInt(this.input.getAttribute("step"))
        : 1,
    };

    let min = data.min;
    const max = data.max === null ? data.max : data.max - data.cartQuantity;
    if (max !== null) min = Math.min(min, max);
    if (data.cartQuantity >= data.min) min = Math.min(min, data.step);

    this.input.min = min;

    if (max) {
      this.input.max = max;
    } else {
      this.input.removeAttribute("max");
    }
    this.input.value = min;

    MinimogEvents.emit(MinimogTheme.pubSubEvents.quantityUpdate, undefined);
  }

  reset() {
    this.input.value = this.input.defaultValue;
  }

  setValidity(message) {
    this.input.setCustomValidity(message);
    this.input.reportValidity();
    this.input.value = this.input.defaultValue;
    this.input.select();
    // Avoid the button being disabled when enter a value is greater than max value or less than min value
    this.validateQtyRules();
  }
}

customElements.define("m-quantity-input", MQuantityInput);

class ProductRecentlyViewed extends HTMLElement {
  constructor() {
    super();

    // Save product Id
    if (isStorageSupported("local")) {
      const productId = parseInt(this.dataset.productId);
      const cookieName = "minimog-recently-viewed";
      const items = JSON.parse(window.localStorage.getItem(cookieName) || "[]");

      // Check current product already exists, if not push to array
      if (!items.includes(productId)) {
        items.unshift(productId);
      }

      // Save to localStorage
      window.localStorage.setItem(cookieName, JSON.stringify(items.slice(0, 20)));
    }
  }
}
customElements.define("product-recently-viewed", ProductRecentlyViewed);

class ProgressBar extends HTMLElement {
  constructor() {
    super();

    if (this.hasAttribute('style')) return;

    if (this.dataset.from) {
      this.initProgress();
    }

    MinimogTheme.initWhenVisible({
      element: this,
      callback: this.init.bind(this),
      threshold: 0,
    });
  }

  init() {
    this.setPercentage(this.dataset.value, this.dataset.max);
  }

  initProgress() {
    this.setPercentage(this.dataset.from, this.dataset.max);
  }

  setPercentage(val1, val2) {
    this.style.setProperty('--percent', `${(parseInt(val1) / parseInt(val2)) * 100}%`);
  }
}
customElements.define('progress-bar', ProgressBar);

if (!customElements.get("m-cart-count")) {
  class MCartCount extends HTMLElement {
    constructor() {
      super();
      this.getSectionToRenderListener = this.getSectionToRender.bind(this);
    }

    cartUpdateUnsubscriber = undefined;

    get sectionName() {
      return 'cart-count';
    }

    getSectionToRender(event) {
      event.detail.sections.push(this.sectionName);
    }

    connectedCallback() {
      document.addEventListener('cart:grouped-sections', this.getSectionToRenderListener);

      this.cartUpdateUnsubscriber = MinimogEvents.subscribe(
        MinimogTheme.pubSubEvents.cartUpdate,
        this.onCartUpdate.bind(this)
      );
    }

    disconnectedCallback() {
      if (this.cartUpdateUnsubscriber) {
        this.cartUpdateUnsubscriber();
      }
    }

    get itemCount() {
      return parseInt(this.innerText);
    }

    onCartUpdate(event) {
      if (event.cart.errors) return;
      const sectionToRender = new DOMParser().parseFromString(event.cart.sections[this.sectionName], 'text/html');
      this.onUpdate(sectionToRender);
    }

    onUpdate(section) {
      this.innerText = section.querySelector('.m-cart-count').innerText;
      const method = this.itemCount === 0 ? 'add' : 'remove';
      this.classList[method]('m:hidden');
    }
  }
  customElements.define('m-cart-count', MCartCount);
}