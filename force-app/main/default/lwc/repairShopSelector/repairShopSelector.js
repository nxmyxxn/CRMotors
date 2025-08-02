import { LightningElement, track } from 'lwc';
import getRepairShops from '@salesforce/apex/RepairShopController.getRepairShops';
import getPlaceSuggestions from '@salesforce/apex/GoogleMapsController.getPlaceSuggestions';
import getPlaceDetails from '@salesforce/apex/GoogleMapsController.getPlaceDetails';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class RepairShopSelector extends LightningElement {
    @track selectedProvince = '';
    @track selectedCity = '';
    @track repairShops = [];
    @track selectedRepairShopId = null;
    @track searchPerformed = false;

    map;
    markers = [];
    mapInitialized = false;

    get isSearchDisabled() {
        return !(this.selectedProvince && this.selectedCity);
    }

    get hasRepairShops() {
        return this.repairShops.length > 0;
    }

    get showNoResults() {
        return this.searchPerformed && this.repairShops.length === 0;
    }

    get isNextDisabled() {
        return !this.selectedRepairShopId;
    }

    handleProvinceChange(event) {
        this.selectedProvince = event.target.value;
        this.selectedCity = '';
        this.repairShops = [];
        this.searchPerformed = false;
    }

    handleCityChange(event) {
        this.selectedCity = event.target.value;
    }

    async handleSearch() {
        try {
            const data = await getRepairShops({
                province: this.selectedProvince,
                city: this.selectedCity
            });

            this.repairShops = data;
            this.searchPerformed = true;
            this.initializeMap();
        } catch (error) {
            console.error('Error searching repair shops:', error);
            this.repairShops = [];
            this.searchPerformed = true;
        }
    }

    renderedCallback() {
        if (window.google && window.google.maps && !this.mapInitialized) {
            this.mapInitialized = true;
        }
    }

    initializeMap() {
        const mapContainer = this.template.querySelector('#map');
        if (!mapContainer || !window.google || !window.google.maps) return;

        const geocoder = new google.maps.Geocoder();
        const searchQuery = `${this.selectedProvince} ${this.selectedCity}`;

        geocoder.geocode({ address: searchQuery }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const centerLocation = results[0].geometry.location;

                if (!this.map) {
                    this.map = new google.maps.Map(mapContainer, {
                        center: centerLocation,
                        zoom: 14,
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                    });
                } else {
                    this.map.setCenter(centerLocation);
                    this.map.setZoom(14);
                }

                this.clearMarkers();
                this.addRepairShopMarkers();
            }
        });
    }

    clearMarkers() {
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];
    }

    addRepairShopMarkers() {
        if (!this.map || !window.google) return;

        const geocoder = new google.maps.Geocoder();

        this.repairShops.forEach(shop => {
            if (shop.Address__c) {
                geocoder.geocode({ address: shop.Address__c }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const marker = new google.maps.Marker({
                            map: this.map,
                            position: results[0].geometry.location,
                            title: shop.Name,
                            animation: google.maps.Animation.DROP
                        });

                        const infoWindow = new google.maps.InfoWindow({
                            content: `
                                <div>
                                    <h4>${shop.Name}</h4>
                                    <p>${shop.Address__c}</p>
                                    ${shop.Phone_Number__c ? `<p>📞 ${shop.Phone_Number__c}</p>` : ''}
                                </div>
                            `
                        });

                        marker.addListener('click', () => {
                            this.markers.forEach(m => m.infoWindow?.close());
                            infoWindow.open(this.map, marker);
                        });

                        marker.infoWindow = infoWindow;
                        this.markers.push(marker);
                    }
                });
            }
        });
    }

    handleShopClick(event) {
        const shopId = event.currentTarget.dataset.id;
        const shop = this.repairShops.find(s => s.Id === shopId);
        this.selectedRepairShopId = shopId;

        if (!shop || !shop.Address__c || !this.map) return;

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: shop.Address__c }, (results, status) => {
            if (status === 'OK' && results[0]) {
                this.map.setCenter(results[0].geometry.location);
                this.map.setZoom(16);

                const targetMarker = this.markers.find(marker => marker.getTitle() === shop.Name);
                if (targetMarker?.infoWindow) {
                    this.markers.forEach(m => m.infoWindow?.close());
                    targetMarker.infoWindow.open(this.map, targetMarker);
                }
            }
        });
    }

    handleNext() {
        if (!this.selectedRepairShopId) {
            this.dispatchEvent(new ShowToastEvent({
                title: '정비소 미선택',
                message: '정비소를 선택해주세요.',
                variant: 'warning'
            }));
            return;
        }

        this.dispatchEvent(new CustomEvent('nextstep', {
            detail: { repairShopId: this.selectedRepairShopId }
        }));
    }
}