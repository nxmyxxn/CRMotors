import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import getProductPrices from '@salesforce/apex/PriceBookEntryController.getProductPrices';
import getOptionPrices from '@salesforce/apex/PriceBookEntryController.getOptionPrices';

import blue from '@salesforce/resourceUrl/ray_ev_blue';
import black from '@salesforce/resourceUrl/ray_ev_black';
import acuamint from '@salesforce/resourceUrl/ray_ev_acuamint';
import beige from '@salesforce/resourceUrl/ray_ev_beige';

export default class KiaQuoteSummary extends LightningElement {
    carName = '';
    carLabel = '';
    carImage = 'blue';
    selectedTrim = '';
    selectedColor = '';
    price = 0;
    selectedOptions = []; // 예: ['컴포트1', '스타일']
    optionPriceList = [];

    @wire(getOptionPrices, { optionNames: '$selectedOptions' })
    wiredOptionPrices({ error, data }) {
        if (data) {
            this.optionPriceList = data; // [{name: '컴포트1', price: 500000}, ...]
        } else if (error) {
            this.optionPriceList = [];
        }
    }


    // 아코디언 섹션이 기본적으로 펼쳐져 있도록 설정합니다.
    activeSections = ['vehiclePrice'];

    @wire(getProductPrices, { productName: '$selectedTrim' })
    productPriceResult({ error, data }) {
        if (data && data.length > 0) {
            this.price = data[0].UnitPrice;
        } else if (error) {
            // 에러 처리
            this.price = 0;
        }
    }

    get totalPrice() {
        // 옵션 가격 합산
        const optionTotal = this.optionPriceList
            ? this.optionPriceList.reduce((sum, opt) => sum + (opt.price || 0), 0)
            : 0;
        // 차량 기본 가격 + 옵션 가격 합산
        return this.price + optionTotal;
    }

    get selectedOptionsText() {
        if (this.selectedOptions && this.selectedOptions.length > 0) {
            return this.selectedOptions.join(', ');
        }
        return '선택된 옵션이 없습니다.';
    }

    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference && currentPageReference.state) {
            this.carName = currentPageReference.state.carName || '';
            this.carLabel = currentPageReference.state.carLabel || '';
            this.selectedTrim = currentPageReference.state.selectedTrim || '';
            this.selectedColor = currentPageReference.state.selectedColor || '';
            // selectedOptions는 배열로 복원
            try {
                this.selectedOptions = JSON.parse(currentPageReference.state.selectedOptions) || [];
            } catch {
                this.selectedOptions = [];
            }

            switch (this.selectedColor) {
                case '스모크블루': this.carImage = blue; break;
                case '오로라블랙펄': this.carImage = black; break;
                case '아쿠아민트': this.carImage = acuamint; break;
                case '밀키베이지': this.carImage = beige; break;
                default: this.carImage = blue; break;
            }
        }
    }

    // 견적 저장 버튼 클릭 핸들러
    handleSaveQuote() {
        // 토스트 메시지 표시
        this.dispatchEvent(new ShowToastEvent({
            title: '견적 저장 완료',
            message: '견적이 성공적으로 저장되었습니다.',
            variant: 'success'
        }));
    }

    // 시승 신청 버튼 클릭 핸들러
    handleDriveRequest() {
        // 시승신청 페이지로 이동
        //window.location.href = '/test/driveconfig?car=' + encodeURIComponent(this.carName) + '&label=' + encodeURIComponent(this.carLabel);
        window.location.href = '/test/testdrive';
    }
}