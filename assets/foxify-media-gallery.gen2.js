if (!customElements.get('x-media-gallery')) {
  class MediaGallery extends HTMLElement {
    constructor() {
      super()
      this.selectors = {
        xrButton: '[data-first-xr-button]',
        mainSlider: 'x-carousel-component'
      }
    }
    
    connectedCallback() {
      this.mediaLayout = this.dataset.layout
      const mainSliderNode = this.querySelector(this.selectors.mainSlider)
      if (mainSliderNode) {
        this.check = setInterval(() => {
          this.mainSlider = mainSliderNode.mainSwiper

          if (this.mainSlider && typeof this.mainSlider == 'object') {
            clearInterval(this.check)
            this.mainSlider.on('slideChange', this.onSlideChanged.bind(this))
          }
        }, 100)
      }
    }

    onSlideChanged() {
      const {realIndex, slides} = this.mainSlider
      this.activeMedia = slides[realIndex]
      this.playActiveMedia(this.activeMedia)
    }

    playActiveMedia(selected) {
      if (!selected) return;
      window.Foxify.Utils.pauseAllMedia()
      this.activeMedia = selected
      this.activeMediaType = this.activeMedia?.dataset?.mediaType
      const deferredMedia = selected.querySelector('x-deferred-media')
      if (deferredMedia) deferredMedia.loadContent(false)

      if (this.activeMediaType !== 'image') {
        this.classList.add('auto-hide-controls')
      } else {
        this.classList.remove('auto-hide-controls')
      }
    }

    setActiveMedia(mediaId, transition = 300) {
      const selectedMedia = this.querySelector(`[data-media-id="${mediaId}"]`)
      if (!selectedMedia) return;
      const mediaIndex = Number(selectedMedia.dataset.mediaIndex)
      this.scrollIntoView(selectedMedia)

      this.preventStickyHeader()
      if (this.mainSlider) this.mainSlider.slideTo(mediaIndex, transition)
    }

    preventStickyHeader() {
      this.stickyHeader = this.stickyHeader || document.querySelector('x-sticky-header');
      if (!this.stickyHeader) return;
      this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'))
    }
    scrollIntoView(selectedMedia) {
      // if (this.mediaLayout === 'carousel') return false;
      // selectedMedia.scrollIntoView({
      // 	behavior: 'smooth'
      // })
    }
  }
	customElements.define('x-media-gallery', MediaGallery);
}
