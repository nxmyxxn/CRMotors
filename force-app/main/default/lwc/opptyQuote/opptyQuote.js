import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import addProductToOpportunity from '@salesforce/apex/PriceBookEntryController.addProductToOpportunity';
import getCarProductInfo from '@salesforce/apex/PriceBookEntryController.getCarProductInfo';
import getLeadQuotes from '@salesforce/apex/OpptyQuoteController.getLeadQuotes';

import rayevImg from '@salesforce/resourceUrl/car_rayev';
import niroevImg from '@salesforce/resourceUrl/car_niroev';
import ev3Img from '@salesforce/resourceUrl/car_ev3';
import ev4Img from '@salesforce/resourceUrl/car_ev4';

import blue from '@salesforce/resourceUrl/ray_ev_blue';
import black from '@salesforce/resourceUrl/ray_ev_black';
import acuamint from '@salesforce/resourceUrl/ray_ev_acuamint';
import beige from '@salesforce/resourceUrl/ray_ev_beige';

export default class OpptyQuote extends NavigationMixin(LightningElement) {
    @api recordId; // Opportunity ID
    
    // 견적 데이터
    quotes = [];
    showQuotes = true;
    showCarSelector = false;

    // 차량 선택 관련 변수들
    cars = [
        {
            name: 'rayev',
            label: '레이 EV',
            image: rayevImg
        },
        {
            name: 'niroev',
            label: '니로 ev',
            image: niroevImg,
        },
        {
            name: 'ev3',
            label: 'EV3',
            image: ev3Img
        },
        {
            name: 'ev4',
            label: 'EV4',
            image: ev4Img
        },
    ];

    carName = '';
    carLabel = '';
    carImage = '';
    selectedTrim = '';
    selectedOptions = [];
    selectedColor = 'blue';

    // 검색 결과 변수들
    foundPrice = null;
    foundProductName = '';
    showResult = false;
    foundProductCode = '';

    // 견적 조회
    @wire(getLeadQuotes, { opportunityId: '$recordId' })
    wiredLeadQuotes({ error, data }) {
        if (data) {
            this.quotes = data;
            console.log('견적 데이터:', this.quotes);
        } else if (error) {
            console.error('견적 조회 오류:', error);
            this.dispatchEvent(new ShowToastEvent({
                title: '오류',
                message: '견적을 불러오는 중 오류가 발생했습니다.',
                variant: 'error'
            }));
        }
    }

    // 리드견적을 Opportunity Line Item으로 추가
    handleAddLeadQuote(event) {
        const quoteId = event.currentTarget.dataset.quoteId;
        const quote = this.quotes.find(q => q.Id === quoteId);
        
        if (quote && quote.product__c) {
            addProductToOpportunity({
                opportunityId: this.recordId,
                productId: quote.product__c
            }).then(result => {
                if (result) {
                    this.dispatchEvent(new ShowToastEvent({
                        title: '성공',
                        message: '리드견적이 Opportunity에 추가되었습니다.',
                        variant: 'success'
                    }));
                } else {
                    this.dispatchEvent(new ShowToastEvent({
                        title: '실패',
                        message: '리드견적 추가에 실패했습니다.',
                        variant: 'error'
                    }));
                }
            }).catch(error => {
                this.dispatchEvent(new ShowToastEvent({
                    title: '오류',
                    message: error.body ? error.body.message : error.message,
                    variant: 'error'
                }));
            });
        }
    }

    // 차량 선택 화면으로 전환
    handleShowCarSelector() {
        this.showQuotes = false;
        this.showCarSelector = true;
    }

    // 견적 화면으로 전환
    handleShowQuotes() {
        this.showQuotes = true;
        this.showCarSelector = false;
    }

    handleCarSelect(event) {
        
        const carName = event.currentTarget.dataset.car;
        const carLabel = event.currentTarget.dataset.label;
        //alert(carName+carLabel);

        this.carName = carName;
        this.carLabel = carLabel;


        // 부모로 보내기
        // this.dispatchEvent(new CustomEvent('carselect', {
        //     detail: { carName, carLabel }
        // }));

        switch (this.carName) {
            case 'rayev': this.carImage = blue; break;
            case 'niroev': this.carImage = niroevImg; break;
            case 'ev3': this.carImage = ev3Img; break;
            case 'ev4': this.carImage = ev4Img; break;
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

    get isQuoteDisabled() {
        return !this.formattedQuotes || this.formattedQuotes.length === 0;
    }

    // 견적 데이터 포맷팅을 위한 getter
    get formattedQuotes() {
        if (!this.quotes || this.quotes.length === 0) {
            return [];
        }
        
        return this.quotes.map(quote => ({
            ...quote,
            // CarConfigueQuote__c 필드들을 표준 Quote 형식으로 매핑
            Status: quote.Status__c || 'Active',
            ExpirationDate: quote.ExpirationDate__c || '',
            Description: `${quote.Car_Name__c} - ${quote.Trim__c} - ${quote.Color__c}`,
            GrandTotal: quote.TotalPrice__c || 0,
            QuoteLineItems: [{
                Id: quote.Id,
                PricebookEntry: {
                    Product2: {
                        Name: quote.Car_Name__c,
                        Trim__c: quote.Trim__c,
                        Color__c: quote.Color__c,
                        Option__c: quote.Option__c
                    }
                },
                Quantity: 1,
                //TotalPrice: quote.TotalPrice__c || 0
            }]
        }));
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
    //alert('carImage: ' + this.carImage);


handleSearch() {
    const optionSummary = this.selectedOptions.length > 0
    ? this.selectedOptions.join(' + ')
    : '';
    console.log('Apex 호출 파라미터:', {
        carName: this.carLabel,
        trimValue: this.selectedTrim,
        colorValue: this.selectedColor,
        optionSummary: optionSummary
    });
    getCarProductInfo({
        carName: this.carLabel,
        trimValue: this.selectedTrim,
        colorValue: this.selectedColor,
        optionSummary: optionSummary
    }).then(result => {
        console.log('Apex result:', result);
        this.foundProductName = result.name;
        this.foundProductCode = result.productCode; 
        this.foundPrice = result.price;
        this.showResult = true;
    }).catch(error => {
        console.error('Apex error:', error);
        this.dispatchEvent(new ShowToastEvent({
            title: '오류 발생',
            message: error.body ? error.body.message : error.message,
            variant: 'error'
        }));
    });
}

    //oppty line item에 추가
handleAddToOLI() {
    // 예시: 현재 Opportunity Id를 this.recordId로 받는다고 가정
    const optionSummary = this.selectedOptions.join(' + ');
    addProductToOpportunity({
        opportunityId: this.recordId,
        carName: this.carLabel,
        trimValue: this.selectedTrim,
        colorValue: this.selectedColor,
        optionSummary: optionSummary
    }).then(result => {
        if (result) {
            this.dispatchEvent(new ShowToastEvent({
                title: '성공',
                message: 'oppty line item에 추가되었습니다.',
                variant: 'success'
            }));
        } else {
            this.dispatchEvent(new ShowToastEvent({
                title: '실패',
                message: '추가에 실패했습니다.',
                variant: 'error'
            }));
        }
    }).catch(error => {
        this.dispatchEvent(new ShowToastEvent({
            title: '오류 발생',
            message: error.body ? error.body.message : error.message,
            variant: 'error'
        }));
    });
}
}
