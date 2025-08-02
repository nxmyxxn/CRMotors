import { LightningElement, api, track } from 'lwc';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import searchAddress from '@salesforce/apex/NaverGeocodingService.searchAddress';

export default class AddressSearch extends LightningElement {
    @api recordId;
    @api objectApiName = 'Order';
    
    @track searchQuery = '';
    @track detailAddress = '';
    @track searchResults = [];
    @track isLoading = false;
    @track showResults = false;
    
    searchTimeout;
    
    // 실시간 검색 - 입력할 때마다 호출
    handleSearchInput(event) {
    this.searchQuery = event.target.value;

    if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
    }

    if (this.searchQuery.length >= 2) {
        this.searchTimeout = setTimeout(() => {
            this.searchAddressFromNaver();
        }, 500);
    } else {
        this.hideResults();
    }
}

    
    // 상세주소 입력 처리
    handleDetailAddressChange(event) {
        this.detailAddress = event.target.value;
    }
    
    // 진짜 네이버 API만 호출 (더미 데이터 완전 제거)
    async searchAddressFromNaver() {
        if (!this.searchQuery || this.searchQuery.length < 2) return;
        
        this.isLoading = true;
        console.log('네이버 API 호출 시작:', this.searchQuery);
        
        try {
            // Apex 클래스를 통해 진짜 네이버 API만 호출
            const responseJson = await searchAddress({ query: this.searchQuery });
            
            console.log('네이버 API 원본 응답:', responseJson);
            
            if (responseJson) {
                const response = JSON.parse(responseJson);
                console.log('파싱된 응답:', response);
                
                if (response && response.addresses && Array.isArray(response.addresses) && response.addresses.length > 0) {
                    // 진짜 네이버 API 응답 구조에 맞게 파싱
                    this.searchResults = response.addresses.map((address, index) => {
                        console.log(`주소 ${index}:`, address);
                        
                        return {
                            id: index,
                            roadAddress: address.roadAddress || '',
                            jibunAddress: address.jibunAddress || '',
                            englishAddress: address.englishAddress || '',
                            latitude: address.y || '',
                            longitude: address.x || '',
                            
                            // addressElements에서 상세 정보 추출
                            sido: this.extractElement(address.addressElements, 'SIDO'),
                            sigugun: this.extractElement(address.addressElements, 'SIGUGUN'),
                            dongmyun: this.extractElement(address.addressElements, 'DONGMYUN'),
                            roadName: this.extractElement(address.addressElements, 'ROAD_NAME'),
                            buildingNumber: this.extractElement(address.addressElements, 'BUILDING_NUMBER'),
                            buildingName: this.extractElement(address.addressElements, 'BUILDING_NAME'),
                            postalCode: this.extractElement(address.addressElements, 'POSTAL_CODE'),
                            
                            // 표시용 전체 주소
                            fullAddress: address.roadAddress || address.jibunAddress || ''
                        };
                    });
                    
                    console.log('최종 검색 결과:', this.searchResults);
                    this.showResults = true;
                } else {
                    console.log('검색 결과 없음 또는 잘못된 응답 구조');
                    this.searchResults = [];
                    this.showResults = false;
                    this.showToast('알림', '검색 결과가 없습니다.', 'info');
                }
            } else {
                console.log('API 응답이 비어있음');
                this.searchResults = [];
                this.showResults = false;
                this.showToast('알림', '검색 결과가 없습니다.', 'info');
            }
        } catch (error) {
            console.error('네이버 API 호출 오류:', error);
            this.searchResults = [];
            this.showResults = false;
            
            let errorMessage = '주소 검색 중 오류가 발생했습니다.';
            if (error.body && error.body.message) {
                errorMessage = error.body.message;
            }
            this.showToast('오류', errorMessage, 'error');
        } finally {
            this.isLoading = false;
        }
    }
    
    // 네이버 API addressElements에서 특정 타입 정보 추출
    extractElement(elements, type) {
        if (!elements || !Array.isArray(elements)) return '';
        
        const element = elements.find(el => 
            el.types && Array.isArray(el.types) && el.types.includes(type)
        );
        
        return element ? (element.longName || element.shortName || '') : '';
    }
    
    // 주소 선택 처리
    handleAddressSelect(event) {
        event.preventDefault();
        const selectedId = event.currentTarget.dataset.id;
        const selectedAddress = this.searchResults.find(addr => addr.id == selectedId);
        
        if (selectedAddress) {
            this.searchQuery = selectedAddress.fullAddress;
            this.hideResults();
            
            // Order 레코드 업데이트
            this.updateOrderRecord(selectedAddress);
        }
    }
    
    // Order 레코드 업데이트
    async updateOrderRecord(addressData) {
        const fields = {};
        fields.Id = this.recordId;
        
        // 도로명주소 + 상세주소 결합
        let fullBillingStreet = addressData.fullAddress;
        if (this.detailAddress && this.detailAddress.trim()) {
            fullBillingStreet += ' ' + this.detailAddress.trim();
        }
        
        fields.BillingStreet = fullBillingStreet;
        fields.BillingCity = (addressData.sido + ' ' + addressData.sigugun).trim();
        fields.BillingState = addressData.dongmyun || '';
        fields.BillingPostalCode = addressData.postalCode || '';
        fields.BillingCountry = 'Korea, Republic of';
        
        // 좌표 정보
        if (addressData.latitude && addressData.longitude) {
            fields.Naver_Latitude__c = parseFloat(addressData.latitude);
            fields.Naver_Longitude__c = parseFloat(addressData.longitude);
        }
        
        const recordInput = { fields };
        
        try {
            await updateRecord(recordInput);
            this.showToast('성공', '주소가 업데이트되었습니다.', 'success');
            
            // 상세주소 필드 클리어
            this.detailAddress = '';
        } catch (error) {
            console.error('레코드 업데이트 오류:', error);
            this.showToast('오류', '주소 업데이트 중 오류가 발생했습니다.', 'error');
        }
    }
    
    // 검색 결과 숨기기
    hideResults() {
        this.showResults = false;
        this.searchResults = [];
    }
    
    // 토스트 메시지 표시
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }
    
    // 외부 클릭시 결과 숨기기
    handleBlur() {
        setTimeout(() => {
            this.hideResults();
        }, 200);
    }
}