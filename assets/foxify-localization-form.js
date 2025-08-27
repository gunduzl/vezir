if (!customElements.get('f-localization-form')) {
	class LocalizationForm extends HTMLElement {
		constructor() {
			super();
			this.elements = {
				input: this.querySelector('input[name="locale_code"], input[name="country_code"]'),
				button: this.querySelector('button'),
				panel: this.querySelector('.f\\:disclosure-list')
			};

			this.elements.panel.removeAttribute('hidden')
			this.elements.button.addEventListener('click', this.openSelector.bind(this));
			this.elements.button.addEventListener('focusout', this.closeSelector.bind(this));
			this.addEventListener('keyup', this.onContainerKeyUp.bind(this));

			this.querySelectorAll('a').forEach(item => item.addEventListener('click', this.onItemClick.bind(this)));

			this.handleDropdownPos()
		}

		handleDropdownPos() {
			const offsetButton = this.elements.button?.getBoundingClientRect().right
			if ((window.innerWidth - offsetButton) < 220) {
				this.elements.button?.nextElementSibling?.classList.add('f:disclosure-list__right')
			}
		}

		hidePanel() {
			this.elements.button.setAttribute('aria-expanded', 'false');
			this.removeAttribute('open')
		}

		onContainerKeyUp(event) {
			if (event.code.toUpperCase() !== 'ESCAPE') return;

			this.hidePanel();
			this.elements.button.focus();
		}

		onItemClick(event) {
			event.preventDefault();
			const form = this.querySelector('form');
			this.elements.input.value = event.currentTarget.dataset.value;
			if (form) form.submit();
		}

		openSelector() {
			this.elements.button.focus();
			this.toggleAttribute('open')
			this.elements.button.setAttribute('aria-expanded', (this.elements.button.getAttribute('aria-expanded') === 'false').toString());
		}

		closeSelector(event) {
			const shouldClose = event.relatedTarget && event.relatedTarget.nodeName === 'BUTTON' || event.relatedTarget && !event.relatedTarget.classList.contains('f:disclosure-list__option')
			if (event.relatedTarget === null || shouldClose) {
				this.hidePanel(shouldClose);
			}
		}
	}
	customElements.define('f-localization-form', LocalizationForm);
}

if (!customElements.get('x-localization-form')) {
	customElements.define(
	  'x-localization-form',
	  class LocalizationForm extends HTMLElement {
		constructor() {
		  super();
		  this.elements = {
			input: this.querySelector('input[name="locale_code"], input[name="country_code"]'),
			button: this.querySelector('button'),
			panel: this.querySelector('.x-disclosure-list-wrapper'),
			closeButton: this.querySelector('.x-country-selector__close-button'),
		  };
  
		  this.addEventListener('keyup', this.onContainerKeyUp.bind(this));
		  this.addEventListener('keydown', this.onContainerKeyDown.bind(this));
		  this.addEventListener('focusout', this.closeSelector.bind(this));
		  this.elements.button.addEventListener('click', this.openSelector.bind(this));

		  if (this.elements.closeButton) {
			this.elements.closeButton.addEventListener('click', this.hidePanel.bind(this));
		  }

		  this.querySelectorAll('a').forEach(item => item.addEventListener('click', this.onItemClick.bind(this)));
		  this.handleDropdownPos();
		}
  
		handleDropdownPos() {
		  const offsetButton = this.elements.button?.getBoundingClientRect().right;
		  if ((window.innerWidth - offsetButton) < 220) {
			this.elements.button?.nextElementSibling?.classList.add('x-disclosure-list--right');
		  }
		}
  
		hidePanel() {
		  this.elements.button.setAttribute('aria-expanded', 'false');
		  this.removeAttribute('open');
		  
		}
  
		onContainerKeyDown(event) {
		  const focusableItems = Array.from(this.querySelectorAll('a')).filter(
			item => !item.parentElement.classList.contains('x-hidden')
		  );
		  let focusedItemIndex = focusableItems.findIndex(item => item === document.activeElement);
		  let itemToFocus;
  
		  switch (event.code.toUpperCase()) {
			case 'ARROWUP':
			  event.preventDefault();
			  itemToFocus = focusedItemIndex > 0 ? focusableItems[focusedItemIndex - 1] : focusableItems[focusableItems.length - 1];
			  itemToFocus.focus();
			  break;
			case 'ARROWDOWN':
			  event.preventDefault();
			  itemToFocus = focusedItemIndex < focusableItems.length - 1 ? focusableItems[focusedItemIndex + 1] : focusableItems[0];
			  itemToFocus.focus();
			  break;
		  }
		}
  
		onContainerKeyUp(event) {
		  event.preventDefault();
  
		  switch (event.code.toUpperCase()) {
			case 'ESCAPE':
			  if (this.elements.button.getAttribute('aria-expanded') == 'false') return;
			  this.hidePanel();
			  event.stopPropagation();
			  this.elements.button.focus();
			  break;
			case 'SPACE':
			  if (this.elements.button.getAttribute('aria-expanded') == 'true') return;
			  this.openSelector();
			  break;
		  }
		}
  
		onItemClick(event) {
		  event.preventDefault();
		  const form = this.querySelector('form');
		  this.elements.input.value = event.currentTarget.dataset.value;
		  if (form) form.submit();
		}
  
		openSelector() {
		  this.elements.button.focus();
		  this.toggleAttribute('open');
		  this.elements.button.setAttribute('aria-expanded', 
			(this.elements.button.getAttribute('aria-expanded') === 'false').toString()
		  );
		}
  
		closeSelector(event) {
		  if (event.target.classList.contains('x-country-selector__overlay') ||
			  !this.contains(event.target) ||
			  !this.contains(event.relatedTarget)) {
			this.hidePanel();
		  }
		}
  
		normalizeString(str) {
		  return str
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '')
			.toLowerCase();
		}
	  }
	);
  }
  