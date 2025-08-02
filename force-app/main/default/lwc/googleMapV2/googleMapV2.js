import { api, wire, LightningElement } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

const FIELDS = [
    'Order.OrderNumber',
    'Order.BillingCountry',
    'Order.BillingStreet',
    'Order.BillingState',
    'Order.BillingCity',
    'Order.BillingPostalCode',
    'Order.Naver_Latitude__c',
    'Order.Naver_Longitude__c'
];

export default class GoogleMapV2 extends LightningElement {
    @api recordId;
    @api scaleLevel = 15;
    
    // Google Maps API 키 (없어도 제한적으로 작동)
    googleApiKey = '';

    @wire(getRecord, {recordId: '$recordId', fields: FIELDS})
    order;

    // Getter 메서드들
    get orderNumber() {
        return this.order.data ? this.order.data.fields.OrderNumber.value : '';
    }

    get billingcountry() {
        return this.order.data ? this.order.data.fields.BillingCountry.value : '';
    }

    get billingstate() {
        return this.order.data ? this.order.data.fields.BillingState.value : '';
    }

    get billingstreet() {
        return this.order.data ? this.order.data.fields.BillingStreet.value : '';
    }

    get billingcity() {
        return this.order.data ? this.order.data.fields.BillingCity.value : '';
    }

    get billingpostalcode() {
        return this.order.data ? this.order.data.fields.BillingPostalCode.value : '';
    }

    get naver_latitude() {
        return this.order.data ? this.order.data.fields.Naver_Latitude__c.value : '';
    }

    get naver_longitude() {
        return this.order.data ? this.order.data.fields.Naver_Longitude__c.value : '';
    }

    get hasCoordinates() {
        return this.naver_latitude && this.naver_longitude;
    }

    // Google Maps Static API URL 생성
    get staticMapUrl() {
        if (!this.hasCoordinates) return '';
        
        const lat = this.naver_latitude;
        const lng = this.naver_longitude;
        const zoom = this.scaleLevel;
        
        // Google Maps Static API
        let url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=450x400&markers=color:red%7C${lat},${lng}`;
        
        if (this.googleApiKey) {
            url += `&key=${this.googleApiKey}`;
        }
        
        return url;
    }

    // Google 지도 새창 열기
    openGoogleMap() {
        if (!this.hasCoordinates) return;
        
        const lat = this.naver_latitude;
        const lng = this.naver_longitude;
        
        const googleMapUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        window.open(googleMapUrl, '_blank');
    }

    renderedCallback() {
        console.log('=== Google Map 렌더링 ===');
        console.log('hasCoordinates:', this.hasCoordinates);
        console.log('staticMapUrl:', this.staticMapUrl);
    }
}