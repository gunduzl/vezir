class FoxkitFlashSaleCountdown {
  constructor(settings) {
    this.selectors = {
      countDown: ["[data-foxkit-countdown-timer]"],
      productForm: ".m-product-form",
    };
    this.DAY_IN_MS = 24 * 60 * 60 * 1000;
    this.HOUR_IN_MS = 60 * 60 * 1000;
    this.storageKey = "__sf-prod-countdown-evergreen";
    this.ended = false;
    this.productId = MinimogSettings.productId;
    this.settings = settings;
    this.storageTimes = JSON.parse(localStorage.getItem(this.storageKey)) || {};
    this.init();
  }

  ProductCountdownTimer(props) {
    const { locales = {}, title } = props;
    const { days = "days", hrs = "hrs", mins = "mins", secs = "secs" } = locales;
    return `<div class="m-countdown-timer__header m:flex m:items-center">
      <div class="m-countdown-timer__heading m:flex m:text-xl m:font-medium">${title}</div>
    </div>
    <div class="m-countdown-timer">
      <div class="m-countdown-timer__wrapper">
        <div class="m-countdown-timer__box m-countdown-timer__day">
          <p class="countdown-timer-day m-countdown-timer__digit">00</p>
          <p class="m-countdown-timer__text">${days}</p>
        </div>
        <div class="m-countdown-timer__separator">:</div>
        <div class="m-countdown-timer__box m-countdown-timer__hour">
          <p class="countdown-timer-hour m-countdown-timer__digit">00</p>
          <p class="m-countdown-timer__text">${hrs}</p>
        </div>
        <div class="m-countdown-timer__separator">:</div>
        <div class="m-countdown-timer__box m-countdown-timer__min">
          <p class="countdown-timer-minute m-countdown-timer__digit">00</p>
          <p class="m-countdown-timer__text">${mins}</p>
        </div>
        <div class="m-countdown-timer__separator">:</div>
        <div class="m-countdown-timer__box m-countdown-timer__sec">
          <p class="countdown-timer-sec m-countdown-timer__digit">00</p>
          <p class="m-countdown-timer__text">${secs}</p>
        </div>
      </div>
    </div>`;
  }

  init = () => {
    this.domNodes = queryDomNodes(this.selectors);
    this.domNodes.countDown.forEach((countDown) => {
      try {
        let shouldStartCountdown = true,
          loop = false;
        if (this.settings.schedule) {
          const scheduledTime = new Date(this.settings.schedule_time).getTime();
          const now = new Date(countDown.dataset.now).getTime();
          shouldStartCountdown = now >= scheduledTime;
        }
        if (countDown.dataset.initialized === "true" || !shouldStartCountdown) return;

        const { productId, HOUR_IN_MS } = this;
        const { cdt_type = "fixed", duration, expires_date } = this.settings;
        const now = Date.now();

        let endTime = new Date(expires_date).getTime();

        if (cdt_type === "evergreen") {
          const timeInStorage = this.getEvergreenTimeByProductId(productId);
          const [_duraion, _endtime] = timeInStorage.split("__").map(Number);
          const settingsChanged = _duraion !== duration;

          endTime = _endtime;
          if (endTime < now || settingsChanged) endTime = now + duration * HOUR_IN_MS;

          this.storageTimes[productId] = [duration, endTime].join("__");
          this.saveTimesToStorage();
          loop = true;
        }

        if (endTime > now) {
          const html = this.ProductCountdownTimer({ locales: countDown.dataset, title: this.settings.title });
          const countDownTimer = document.createElement("DIV");
          countDownTimer.classList.add(`m-countdown-timer__container`, `m-countdown-timer--${this.settings.cdt_style}`);
          countDownTimer.innerHTML = html;
          countDown.appendChild(countDownTimer);
          this.countDownTimer = new CountdownTimer(countDown, Date.now(), endTime, { loop: loop });
          countDown.classList.remove("m:hidden");
        } else {
          this.ended = true;
        }
        countDown.dataset.initialized = "true";
      } catch (error) {
        console.error("Failed to init product countdown.", error);
      }
    });
  };

  getEvergreenTimeByProductId = (id) => {
    return this.storageTimes[id] || "";
  };

  saveTimesToStorage = () => {
    localStorage.setItem(this.storageKey, JSON.stringify(this.storageTimes));
  };
}

MinimogTheme.FoxkitFlashSaleCountdown = FoxkitFlashSaleCountdown;
