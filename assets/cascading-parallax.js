if (!customElements.get("m-cascading")) {
  class MCascading extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.init();
    }

    map(number, in_min, in_max, out_min, out_max) {
      return ((number - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
    }

    setPosition() {
      let oldPosition = this.position;
      this.position =
        (document.documentElement || document.body.parentNode || document.body).scrollTop || window.pageYOffset;

      if (oldPosition != this.position) {
        // scroll changed, return true
        return true;
      }
      return false;
    }

    updatePosition(percentage, speed) {
      let value = speed * (100 * (1 - percentage));
      return Math.round(value);
    }

    cacheParallaxContainers() {
      for (var i = 0; i < this.parallaxContainers.length; i++) {
        var item = this.createParallaxItem(this.parallaxContainers[i]);
        this.parallaxItems.push(item);
      }
    }

    inViewport(element) {
      if (!element) return false;
      if (1 !== element.nodeType) return false;

      var html = document.documentElement;
      var rect = element.getBoundingClientRect();

      return (
        !!rect &&
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom >= 0 &&
        rect.right >= 0 &&
        rect.left <= html.clientWidth &&
        rect.top <= html.clientHeight
      );
    }

    createParallaxItem(el) {
      const id = el.getAttribute("data-parallax-id");
      const container = el;
      const item = el.querySelector("[data-parallax-element]");
      let speed = parseInt(el.getAttribute("data-parallax-speed"));

      speed = speed * -1;

      const blockHeight = item.clientHeight || item.offsetHeight || item.scrollHeight;
      const isInViewPort = this.inViewport(el);

      return {
        id: id,
        container: container,
        item: item,
        height: blockHeight,
        speed: speed,
        visible: isInViewPort,
      };
    }

    observeCascadeItems(enable_parallax) {
      if (enable_parallax) {
        this.parallaxObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (this.cascadeEnableParallax) {
                const parallaxItemIndex = this.parallaxItems.findIndex(
                  (item) => item.id === entry.target.getAttribute("data-parallax-id")
                );
                if (parallaxItemIndex > -1) {
                  this.parallaxItems[parallaxItemIndex].visible = entry.isIntersecting;
                }
              }
            });
          },
          {
            rootMargin: "0px 0px 20% 0px",
            threshold: 0,
          }
        );
      }

      for (var i = 0; i < this.cascadeItems.length; i++) {
        if (enable_parallax) {
          this.parallaxObserver.observe(this.cascadeItems[i]);
        }
      }
    }

    animate() {
      for (var i = 0; i < this.parallaxContainers.length; i++) {
        if (this.parallaxItems[i].visible) {
          const scrollPercentage =
            (this.screenHeight - this.parallaxItems[i].item.getBoundingClientRect().top) /
              (this.screenHeight + this.parallaxItems[i].height) -
            0.5;

          const baseValue = this.intensity * (this.parallaxItems[i].speed * (scrollPercentage * 100));

          const valueY = Math.round(baseValue * 100 + Number.EPSILON) / 100;

          this.parallaxItems[i].item.style.transform = `translateY(${valueY}px)`;
        }
      }
      this.firstAnimate = true;
    }

    initParallax() {
      this.screenHeight = window.innerHeight;
      this.parallaxItems = [];
      this.parallaxContainers = this.querySelectorAll("[data-parallax-container]");
      this.cascadeParallaxIntensity = parseInt(this.dataset.parallaxIntensity);

      this.setPosition();
      this.cacheParallaxContainers();

      this.intensity = this.map(this.cascadeParallaxIntensity, 0, 100, 1, 110) / 100;

      this.animate();

      document.addEventListener(
        "scroll",
        () => {
          if (this.setPosition()) {
            requestAnimationFrame(this.animate.bind(this));
          }
        },
        { passive: true }
      );
    }

    init() {
      this.cascadeEnableParallax = this.dataset.enableParallax === "true";
      this.cascadeItems = this.querySelectorAll("[data-cascade-item]");
      this.observeCascadeItems(this.cascadeEnableParallax);

      this.cascadeEnableParallax && this.initParallax();

      window.addEventListener("resize", () => {
        if (this.cascadeEnableParallax) {
          this.initParallax();
        }
      });
    }
  }

  customElements.define("m-cascading", MCascading);
}
