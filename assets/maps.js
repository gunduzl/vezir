if (!customElements.get("m-gmaps")) {
  class MGmaps extends HTMLElement {
    constructor() {
      super();
      this.mapElm = this.querySelector("#m-gmaps-inner");
      this.mapAddress = this.mapElm.dataset.mapTitle;
      this.mapZoom = this.mapElm.dataset.mapZoom;
      this.mapX = this.mapElm.dataset.mapX;
      this.mapY = this.mapElm.dataset.mapY;
      this.key = this.mapElm.dataset.key;
      if (!this.mapElm.dataset.key) {
        return;
      }
    }

    connectedCallback() {
      this.prepMapApi();
    }

    prepMapApi() {
      this.loadScript().then(this.initMap.bind(this));
    }

    loadScript() {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        document.body.appendChild(script);
        script.onload = resolve;
        script.onerror = reject;
        script.async = true;
        script.src = "https://maps.googleapis.com/maps/api/js?key=" + this.mapElm.dataset.key;
      });
    }

    initMap() {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: this.mapAddress }, (results, status) => {
        if (status !== google.maps.GeocoderStatus.OK) {
          if (Shopify.designMode) {
          }
        } else {
          const mapOptions = {
            zoom: parseInt(this.mapZoom),
            center: new google.maps.LatLng(this.mapX, this.mapY),
            draggable: true,
            clickableIcons: false,
            scrollwheel: false,
            disableDoubleClickZoom: true,
            disableDefaultUI: true,
            styles: [
              { featureType: "water", elementType: "geometry", stylers: [{ color: "#e9e9e9" }, { lightness: 17 }] },
              { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f5f5f5" }, { lightness: 20 }] },
              {
                featureType: "road.highway",
                elementType: "geometry.fill",
                stylers: [{ color: "#ffffff" }, { lightness: 17 }],
              },
              {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#ffffff" }, { lightness: 29 }, { weight: 0.2 }],
              },
              {
                featureType: "road.arterial",
                elementType: "geometry",
                stylers: [{ color: "#ffffff" }, { lightness: 18 }],
              },
              {
                featureType: "road.local",
                elementType: "geometry",
                stylers: [{ color: "#ffffff" }, { lightness: 16 }],
              },
              { featureType: "poi", elementType: "geometry", stylers: [{ color: "#f5f5f5" }, { lightness: 21 }] },
              { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#dedede" }, { lightness: 21 }] },
              {
                elementType: "labels.text.stroke",
                stylers: [{ visibility: "on" }, { color: "#ffffff" }, { lightness: 16 }],
              },
              {
                elementType: "labels.text.fill",
                stylers: [{ saturation: 36 }, { color: "#333333" }, { lightness: 40 }],
              },
              { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
              { featureType: "transit", elementType: "geometry", stylers: [{ color: "#f2f2f2" }, { lightness: 19 }] },
              {
                featureType: "administrative",
                elementType: "geometry.fill",
                stylers: [{ color: "#fefefe" }, { lightness: 20 }],
              },
              {
                featureType: "administrative",
                elementType: "geometry.stroke",
                stylers: [{ color: "#fefefe" }, { lightness: 17 }, { weight: 1.2 }],
              },
            ],
          };
          const map = new google.maps.Map(this.mapElm, mapOptions);
          new google.maps.Marker({
            map: map,
            position: new google.maps.LatLng(this.mapX, this.mapY),
            title: this.mapAddress,
          });

          google.maps.event.addDomListener(window, "resize", function () {
            google.maps.event.trigger(map, "resize");
          });
        }
      });
    }
  }

  customElements.define("m-gmaps", MGmaps);
}
