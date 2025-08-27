if (!customElements.get("m-countdown-timer")) {
  if (!customElements.get("m-countdown-timer")) {
    class MCountdownTimer extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        const time = this.dataset.time;
        const endTime = Date.parse(time.split(" ").join("T"));
        if (endTime) {
          new CountdownTimer(this, Date.now(), endTime);

          if (endTime > Date.now()) {
            this.classList.remove("hidden");
            this.classList.remove("m:hidden");
          }
        }
      }
    }

    customElements.define("m-countdown-timer", MCountdownTimer);
  }
}
