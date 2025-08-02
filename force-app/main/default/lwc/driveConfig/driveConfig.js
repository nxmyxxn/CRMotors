import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import saveVehicleConfig from '@salesforce/apex/DriveConfigController.saveVehicleConfig';
import { NavigationMixin } from 'lightning/navigation';

import blue from '@salesforce/resourceUrl/ray_ev_blue';
import black from '@salesforce/resourceUrl/ray_ev_black';
import acuamint from '@salesforce/resourceUrl/ray_ev_acuamint';
import beige from '@salesforce/resourceUrl/ray_ev_beige';

import niroevImg from '@salesforce/resourceUrl/car_niroev';
import ev3Img from '@salesforce/resourceUrl/car_ev3';
import ev4Img from '@salesforce/resourceUrl/car_ev4';

export default class DriveConfig extends NavigationMixin(LightningElement) {
    carName = '';
    carImage = '';
    selectedTrim = '';
    selectedOptions = [];
    selectedColor = 'blue';
    email = 'jhkim@example.com';

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.carName = currentPageReference.state?.car;
            this.carLabel = currentPageReference.state?.label;
            if (!this.carName) {
                this.carName = 'carname is not selected';
            }
        }
    
        // carName을 Product2에 저장된 실제 이름으로 매핑
        switch (this.carName) {
            case 'Ray EV': this.carImage = blue; break;
            case 'niroev': this.carImage = niroevImg; break;
            case 'ev3': this.carImage = ev3Img; break;
            case 'EV4': this.carImage = ev4Img; break;
            default: this.carImage = ''; break;
        }
    }


    get trimOptions() {
        return [
            { label: '라이트', value: '라이트' },
            { label: '에어', value: '에어' }
        ];
    }

    get optionChoices() {
        return [
            { label: '컴포트1', value: '컴포트1' },
            { label: '컴포트2', value: '컴포트2' },
            { label: '드라이브 와이즈2', value: '드라이브 와이즈2' },
            { label: '하이패스 자동결제 시스템', value: '하이패스 자동결제 시스템' },
            { label: '스타일', value: '스타일' },
        ];
    }

    get colorChoices() {
        return [
            { label: '스모크 블루', value: '스모크 블루' },
            { label: '오로라 블랙 펄', value: '오로라 블랙 펄' },
            { label: '아쿠아 민트', value: '아쿠아 민트' },
            { label: '밀키 베이지', value: '밀키 베이지' },
            
        ];
    }

    handleTrimChange(event) {
        this.selectedTrim = event.detail.value;
    }

    handleOptionChange(event) {
        this.selectedOptions = event.detail.value;
    }

    handleColorChange(event) {
        this.selectedColor = event.detail.value;
        switch (this.selectedColor) {
            case '스모크 블루': this.carImage = blue; break;
            case '오로라 블랙 펄': this.carImage = black; break;
            case '아쿠아 민트': this.carImage = acuamint; break;
            case '밀키 베이지': this.carImage = beige; break;
        }
    }

    // 견적완료 버튼 클릭 시 리다이렉트
    handleCompleteEstimate() {
        console.log('=== handleCompleteEstimate Debug ===');
        console.log('carName:', this.carName);
        console.log('selectedTrim:', this.selectedTrim);
        console.log('selectedColor:', this.selectedColor);
        console.log('selectedOptions:', this.selectedOptions);
        console.log('email:', this.email);
        
        saveVehicleConfig({
            carName: this.carName,
            trimValue: this.selectedTrim,
            colorValue: this.selectedColor,
            optionValues: this.selectedOptions,
            email: this.email,
        }).then(result => {
            console.log('Success result:', result);
            this.dispatchEvent(new ShowToastEvent({
                title: '성공',
                message: '견적이 저장되었습니다.',
                variant: 'success'
            }));

            window.location.href = '/quotesummary'+
                `?carName=${encodeURIComponent(this.carName)}` +
                `&carLabel=${encodeURIComponent(this.carLabel)}` +
                `&selectedTrim=${encodeURIComponent(this.selectedTrim)}` +
                `&selectedColor=${encodeURIComponent(this.selectedColor)}` +
                `&selectedOptions=${encodeURIComponent(JSON.stringify(this.selectedOptions))}`;
    
        }).catch(error => {
            console.error('Error details:', error);
            this.dispatchEvent(new ShowToastEvent({
                title: '오류 발생',
                message: error.body.message,
                variant: 'error'
            }));
        });
    }
}