import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';

import blue from '@salesforce/resourceUrl/ray_ev_blue';
import black from '@salesforce/resourceUrl/ray_ev_black';
import acuamint from '@salesforce/resourceUrl/ray_ev_acuamint';
import beige from '@salesforce/resourceUrl/ray_ev_beige';

import rayevImg from '@salesforce/resourceUrl/car_rayev';
import niroevImg from '@salesforce/resourceUrl/car_niroev';
import ev3Img from '@salesforce/resourceUrl/car_ev3';
import ev4Img from '@salesforce/resourceUrl/car_ev4';

export default class DriveConfig extends LightningElement {
    carName = '';
    carImage = '';
    selectedTrim = '';
    selectedOptions = [];
    selectedColor = 'blue';

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference) {
            this.carName = currentPageReference.state?.car;
            this.carLabel = currentPageReference.state?.label;
            alert('driveConfig에서 받은 carName: ' + this.carName);
            if (!this.carName) {
                this.carName = 'carname is not selected';
            }
        }
    

        switch (this.carName) {
            case 'rayev': this.carImage = rayevImg; break;
            case 'niroev': this.carImage = niroevImg; break;
            case 'ev3': this.carImage = ev3Img; break;
            case 'ev4': this.carImage = ev4Img; break;
            default: this.carImage = ''; break;
        }

    }

    


    get trimOptions() {
        return [
            { label: '라이트', value: 'light' },
            { label: '에어', value: 'air' }
        ];
    }

    get optionChoices() {
        return [
            { label: '컴포트1', value: 'comfort1' },
            { label: '컴포트2', value: 'comfort2' },
            { label: '드라이브 와이즈2', value: 'drivewise2' },
            { label: '하이패스 자동결제 시스템', value: 'highpass' },
            { label: '스타일', value: 'style' },
        ];
    }

    get colorChoices() {
        return [
            { label: '스모크블루', value: 'blue' },
            { label: '오로라블랙펄', value: 'black' },
            { label: '아쿠아민트', value: 'acuamint' },
            { label: '밀키베이지', value: 'beige' },
            
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
            case 'blue': this.carImage = blue; break;
            case 'black': this.carImage = black; break;
            case 'acuamint': this.carImage = acuamint; break;
            case 'beige': this.carImage = beige; break;
        }
    }
    //alert('carImage: ' + this.carImage);

    // 견적완료 버튼 클릭 시 리다이렉트
    handleCompleteEstimate() {
        window.location.href = 'https://www.naver.com'; 
    }
}