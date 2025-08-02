import { LightningElement, wire, api } from 'lwc';
import getFlagshipStoresWithLocation from '@salesforce/apex/TestDriveLocationController.getFlagshipStoresWithLocation';
import City from '@salesforce/schema/Asset.City';

export default class TestDriveMapLocation extends LightningElement {
    @api selectedStoreId; 
    mapMarkers = [];
    storeList = [];
    error;

    @wire(getFlagshipStoresWithLocation)
    wiredStores({ data, error }) {
        if (data) {
            this.storeList = data;
            this.mapMarkers = data.map(store => ({
                location: {
                    Latitude: store.Store_Location__Latitude__s,
                    Longitude: store.Store_Location__Longitude__s,
                    Street: store.Road_name__c
                },
                title: store.Name, 
                icon: 'standard:address',
                description: `${store.Road_name__c}`,
                value: store.Id
            }));
        } else if (error) {
            this.error = error;
            console.error('지도 로딩 실패:', error);
        }
    }

    handleMarkerSelect(event) {
        const selectedId = event.detail.selectedMarkerValue;
        this.dispatchEvent(new CustomEvent('storeselect', { detail: selectedId }));
    }


    storeClass(id) {
        return 'store-list-item' + (id === this.selectedStoreId ? ' selected' : '');
    }

    get showMap() {
        return this.mapMarkers.length > 0;
    }
}
