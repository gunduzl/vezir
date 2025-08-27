class Customer {
  constructor() {
    this.formNewSelectors = {
      add: '.m-customer__add-new-btn',
      cancel: '.m-customer__cancel-add-btn',
      form: '.m-customer__form-new',
      wrapper: '.m-customer__form-new-wrapper',
    }
    this.formEditSelectors = {
      address: '.m-customer-address',
      info: '.m-customer-address__info',
      wrapper: '.m-customer__form-edit-wrapper',
      form: '.m-customer__form-edit',
      edit: '.m-customer__edit-btn',
      delete: '.m-customer__form-delete',
      cancel: '.m-customer__cancel-edit-btn',
      select: '[data-address-country-select]'
    }
    this.selectors = {
      customerAddresses: '[data-customer-addresses]'
    }
    this.container = document.querySelector(this.selectors.customerAddresses);
    this.setupCountries()
    this.initFormNew()
    this.initFormEdit()
  }

  initFormNew() {
    this.formNewNodes = queryDomNodes(this.formNewSelectors)
    this.formNewNodes.add && this.formNewNodes.add && this.formNewNodes.add.addEventListener("click", () => this.toggleFormNew(true))
    this.formNewNodes && this.formNewNodes.cancel && this.formNewNodes.cancel.addEventListener("click", () => this.toggleFormNew(false))
  }

  setupCountries() {
    const countrySelects = this.container.querySelectorAll(this.formEditSelectors.select);
    if (Shopify && Shopify.CountryProvinceSelector) {
      // eslint-disable-next-line no-new
      new Shopify.CountryProvinceSelector('AddressCountry_new', 'AddressProvince_new', {
        hideElement: 'AddressProvinceContainerNew',
      });
      countrySelects.forEach((select) => {
        const formId = select.dataset.formId;
        // eslint-disable-next-line no-new
        new Shopify.CountryProvinceSelector(`AddressCountry_${formId}`, `AddressProvince_${formId}`, {
          hideElement: `AddressProvinceContainer_${formId}`,
        });
      });
    }
  }

  initFormEdit() {
    addEventDelegate({
      selector: this.formEditSelectors.address,
      handler: (e, address) => {
        const nodes = queryDomNodes(this.formEditSelectors, address)
        if (e && e.target === nodes.edit) {
          nodes.info.classList.add('m:hidden')
          nodes.wrapper.classList.remove('m:hidden')
          return
        }
        if (e && e.target === nodes.cancel) {
          nodes.wrapper.classList.add('m:hidden')
          nodes.info.classList.remove('m:hidden')
        }
      }
    })

    addEventDelegate({
      selector: this.formEditSelectors.delete,
      handler: (e, deleteForm) => {
        e.preventDefault()
        const { confirmMessage } = deleteForm.dataset
        if (window.confirm(confirmMessage)) {
          deleteForm.submit()
        }
      }
    })
  }

  toggleFormNew(show) {
    const { add, wrapper } = this.formNewNodes
    if (show) {
      add && add.classList.add('m:hidden')
      wrapper && wrapper.classList.remove('m:hidden')
    } else {
      wrapper && wrapper.classList.add('m:hidden')
      add && add.classList.remove('m:hidden')
    }
  }
}

MinimogTheme.Customer = new Customer()
