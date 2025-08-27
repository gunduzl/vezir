class FProductRecommendations extends HTMLElement {
	constructor() {
		super();
    this.sectionHeader = null
    this.container = this.closest('.f\\:product-recommendations')
    if (this.container) {
      this.sectionHeader = this.container.querySelector('.f\\:section-header')
    }
	}

	connectedCallback() {
		const handleIntersection = (entries, observer) => {
			if (!entries[0].isIntersecting) return;
			observer.unobserve(this);

			fetch(this.dataset.url)
				.then((response) => response.text())
				.then((text) => {
					const html = window.Foxify.Utils.generateDomFromString(text);
					const recommendations = html.querySelector("f-product-recommendations");
 
					if (recommendations && recommendations.innerHTML.trim().length) {
						this.innerHTML = recommendations.innerHTML;
						if (this.sectionHeader) this.sectionHeader.classList.remove('f:hidden')
					} else {
						if (this.sectionHeader) this.sectionHeader.classList.add('f:hidden')
					}

					if (html.querySelector(".f\\:product-card")) {
						this.classList.add("f:product-recommendations--loaded");
					} else {
						this.classList.add("f:hidden");
					}
				})
				.catch((e) => {
					console.error(e);
				});
		};

		new IntersectionObserver(handleIntersection.bind(this), {
			rootMargin: "0px 0px 400px 0px",
		}).observe(this);
	}
}

customElements.define("f-product-recommendations", FProductRecommendations);