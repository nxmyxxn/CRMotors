import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import getCarPrice from '@salesforce/apex/PriceBookEntryController.getCarPrice';
import getTrimPrice from '@salesforce/apex/PriceBookEntryController.getTrimPrice';
import getColorPrice from '@salesforce/apex/PriceBookEntryController.getColorPrice';
import getOptionPrices from '@salesforce/apex/PriceBookEntryController.getOptionPrices';
import saveVehicleConfig from '@salesforce/apex/DriveConfigController.saveVehicleConfig';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import blue from '@salesforce/resourceUrl/ray_ev_blue';
import black from '@salesforce/resourceUrl/ray_ev_black';
import acuamint from '@salesforce/resourceUrl/ray_ev_acuamint';
import beige from '@salesforce/resourceUrl/ray_ev_beige';

export default class QuoteSummary extends LightningElement {
    carName = '';
    carLabel = '';
    carImage = 'blue';
    selectedTrim = '';
    selectedColor = '';
    price = 0;
    selectedOptions = []; // 예: ['컴포트1', '스타일']
    
    TrimPrice = 0;
    ColorPrice = 0;
    OptionsTotalPrice = 0;
    OptionsData = []; // 실제 옵션 가격 데이터 저장

    // 아코디언 섹션이 기본적으로 펼쳐져 있도록 설정합니다.
    activeSections = ['vehiclePrice'];

    // 옵션 요약 문자열 생성 (Product2의 Option__c 필드와 일치하도록 '+'로 연결)
    get optionSummary() {
        return this.selectedOptions && this.selectedOptions.length > 0 
            ? this.selectedOptions.join('+') 
            : '';
    }

    // 모든 필수 값이 있을 때만 Apex 호출
    get shouldCallApex() {
        return this.carName && this.selectedTrim && this.selectedColor;
    }

    // 총 가격 (실제 가격들의 합계)
    get totalPrice() {
        return this.TrimPrice + this.ColorPrice + this.OptionsTotalPrice;
    }

    // 트림 가격 (실제 조회된 가격)
    get trimPrice() {
        return this.TrimPrice;
    }

    get colorPrice() {
        return this.ColorPrice;
    }

    get optionsTotalPrice() {
        return this.OptionsTotalPrice;
    }

    // 선택된 옵션들 (가격 포함) - 포맷된 가격으로
    get selectedOptionsWithPrice() {
        if (this.selectedOptions && this.selectedOptions.length > 0) {
            // 실제 옵션 가격 데이터가 있으면 사용
            if (this.OptionsData && this.OptionsData.length > 0) {
                return this.OptionsData.map(option => ({
                    ...option,
                    formattedPrice: this.formatPrice(option.price)
                }));
            }
        }
        return [];
    }

    // 천단위 콤마 포맷팅 함수
    formatPrice(price) {
        if (price === null || price === undefined) return '0';
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // 포맷된 총 가격
    get formattedTotalPrice() {
        return this.formatPrice(this.totalPrice);
    }

    // 포맷된 트림 가격
    get formattedTrimPrice() {
        return this.formatPrice(this.trimPrice);
    }

    // 포맷된 컬러 가격
    get formattedColorPrice() {
        return this.formatPrice(this.colorPrice);
    }

    // 포맷된 옵션 총 가격
    get formattedOptionsTotalPrice() {
        return this.formatPrice(this.optionsTotalPrice);
    }

    // 트림 가격 조회
    @wire(getTrimPrice, { 
        carName: '$carName', 
        trimValue: '$selectedTrim'
    })
    trimPriceResult({ error, data }) {
        if (data !== undefined && data !== null) {
            this.TrimPrice = data;
        } else if (error) {
            console.error('Error fetching trim price:', error);
            this.TrimPrice = 0;
        }
    }

    // 컬러 가격 조회
    @wire(getColorPrice, { 
        carName: '$carName', 
        colorValue: '$selectedColor'
    })
    colorPriceResult({ error, data }) {
        if (data !== undefined && data !== null) {
            this.ColorPrice = data;
        } else if (error) {
            console.error('Error fetching color price:', error);
            this.ColorPrice = 0;
        }
    }

    // 옵션 가격 조회
    @wire(getOptionPrices, { 
        carName: '$carName',
        optionNames: '$selectedOptions'
    })
    optionPricesResult({ error, data }) {
        if (data) {
            // 중복 제거 (같은 이름의 옵션 중 첫 번째만 사용)
            const uniqueOptions = [];
            const seenNames = new Set();
            
            for (const option of data) {
                if (!seenNames.has(option.name)) {
                    uniqueOptions.push(option);
                    seenNames.add(option.name);
                }
            }
            
            this.OptionsTotalPrice = uniqueOptions.reduce((sum, option) => sum + (option.price || 0), 0);
            this.OptionsData = uniqueOptions; // 중복 제거된 데이터 저장
        } else if (error) {
            console.error('Error fetching option prices:', error);
            this.OptionsTotalPrice = 0;
            this.OptionsData = []; // 오류 발생 시 빈 배열로 설정
        }
    }

    // 기존 가격 조회
    @wire(getCarPrice, { 
        carName: '$carName', 
        trimValue: '$selectedTrim', 
        colorValue: '$selectedColor', 
        optionSummary: '$optionSummary' 
    })
    productPriceResult({ error, data }) {
        if (data !== undefined && data !== null) {
            this.price = data;
        } else if (error) {
            console.error('Error fetching car price:', error);
            this.price = 0;
        }
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
                case '스모크 블루': this.carImage = blue; break;
                case '오로라 블랙 펄': this.carImage = black; break;
                case '아쿠아 민트': this.carImage = acuamint; break;
                case '밀키 베이지': this.carImage = beige; break;
                default: this.carImage = blue; break;
            }
        }
    }

    // 변경 링크 핸들러들
    handleModelChange() {
        window.location.href = '/driveconfig';
    }

    handleTrimChange() {
        window.location.href = '/driveconfig';
    }

    handleColorChange() {
        window.location.href = '/driveconfig';
    }

    handleOptionsChange() {
        window.location.href = '/driveconfig';
    }

    // 견적 저장 버튼 클릭 핸들러
    async handleSaveQuote() {
        try {
            // 로딩 상태 표시
            this.isLoading = true;
            
            // Apex 메서드 호출하여 CarConfig_Quote__c 레코드 생성
            const quoteId = await saveVehicleConfig({
                carName: this.carName,
                trimValue: this.selectedTrim,
                colorValue: this.selectedColor,
                optionValues: this.selectedOptions
            });
            
            // 성공 토스트 메시지 표시
            this.dispatchEvent(new ShowToastEvent({
                title: '견적 저장 완료',
                message: `견적이 성공적으로 저장되었습니다. (ID: ${quoteId})`,
                variant: 'success'
            }));
            
            console.log('Quote saved with ID:', quoteId);
            
        } catch (error) {
            // 에러 토스트 메시지 표시
            this.dispatchEvent(new ShowToastEvent({
                title: '견적 저장 실패',
                message: error.body?.message || '견적 저장 중 오류가 발생했습니다.',
                variant: 'error'
            }));
            
            console.error('Error saving quote:', error);
        } finally {
            // 로딩 상태 해제
            this.isLoading = false;
        }
    }

    // 시승 신청 버튼 클릭 핸들러
    handleDriveRequest() {
        // 시승신청 페이지로 이동
        //window.location.href = '/test/driveconfig?car=' + encodeURIComponent(this.carName) + '&label=' + encodeURIComponent(this.carLabel);
        window.location.href = '/testdrive';
    }
}