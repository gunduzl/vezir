const SCROLL_ANIMATION_TRIGGER_CLASSNAME = "m-scroll-trigger";
const SCROLL_ANIMATION_OFFSCREEN_CLASSNAME = "m-scroll-trigger--offscreen";
const SCROLL_ANIMATION_CANCEL_CLASSNAME = "m-scroll-trigger--cancel";

function updateElementVisibility(element, isVisible) {
  if (isVisible) {
    element.classList.remove(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
  } else {
    element.classList.add(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
    element.classList.remove(SCROLL_ANIMATION_CANCEL_CLASSNAME);
  }
}

function handleMobileChange(element) {
  const removeTriggerClass = () => element.classList.remove(SCROLL_ANIMATION_TRIGGER_CLASSNAME);

  if (MinimogTheme.config.mqlMobile || element.dataset.type === "fixed") {
    removeTriggerClass();
  }

  document.addEventListener("matchMobile", removeTriggerClass);
  document.addEventListener("unmatchMobile", removeTriggerClass);
}

function onIntersection(entries, observer) {
  entries.forEach((entry, index) => {
    const { isIntersecting, target } = entry;
    updateElementVisibility(target, isIntersecting);

    if (isIntersecting) {
      if (target.hasAttribute("data-cascade")) {
        target.setAttribute("style", `--animation-order: ${index};`);
      }
      observer.unobserve(target);
    }

    if (target.classList.contains("m-sidebar")) {
      handleMobileChange(target);
    }
  });
}

const observer = new IntersectionObserver(onIntersection, {
  rootMargin: "0px 0px -50px 0px",
});

function initializeScrollAnimationTrigger(rootEl = document, isDesignModeEvent = false) {
  const elements = rootEl.getElementsByClassName(SCROLL_ANIMATION_TRIGGER_CLASSNAME);

  if (elements.length === 0 || isDesignModeEvent) return;

  Array.from(elements).forEach((element) => observer.observe(element));
}

document.addEventListener("DOMContentLoaded", () => initializeScrollAnimationTrigger());

if (Shopify.designMode) {
  const reinitialize = (event) => initializeScrollAnimationTrigger(event.target, true);
  document.addEventListener("shopify:section:load", reinitialize);
  document.addEventListener("shopify:section:reorder", () => initializeScrollAnimationTrigger(document, true));
}
