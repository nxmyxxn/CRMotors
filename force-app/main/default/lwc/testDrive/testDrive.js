import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createLeadAndTestDrive from '@salesforce/apex/TestDriveController.createLeadAndTestDrive';
import getFlagshipStoresWithLocation from '@salesforce/apex/TestDriveLocationController.getFlagshipStoresWithLocation';
import getAvailableDates from '@salesforce/apex/TestDriveScheduler.getAvailableDates';
import getAvailableTimes from '@salesforce/apex/TestDriveScheduler.getAvailableTimes';

// 차량 이미지 import
import rayevImg from '@salesforce/resourceUrl/car_rayev';
import niroevImg from '@salesforce/resourceUrl/car_niroev';
import ev3Img from '@salesforce/resourceUrl/car_ev3';
import ev4Img from '@salesforce/resourceUrl/car_ev4';

export default class TestDrive extends LightningElement {
    // 현재 단계
    currentStep = 1;
    
    // 단계별 표시 여부
    showStep1 = true;
    showStep2 = false;
    showStep3 = false;
    showStep4 = false;
    showStep5 = false;
    showStep6 = false;

    // Step 1: 개인정보 (로그인된 사용자 정보)
    userName = '김지현';
    userPhone = '010-1234-5678';
    userEmail = 'jhkim@example.com';
    userGrade = 'VIP';

    // Step 2: 차량 선택
    selectedCar = '';
    selectedCarLabel = '';
    
    // 차량 데이터 배열
    carOptions = [
        {
            id: 'rayev',
            name: 'Ray EV',
            image: rayevImg,
            class: ''
        },
        {
            id: 'niroev',
            name: 'Niro EV',
            image: niroevImg,
            class: ''
        },
        {
            id: 'ev3',
            name: 'EV3',
            image: ev3Img,
            class: ''
        },
        {
            id: 'ev4',
            name: 'EV4',
            image: ev4Img,
            class: ''
        }
    ];

    // Step 3: 시승 거점
    selectedDealer = '';
    selectedDealerLabel = '';

    // Step 4: 시승 방법
    selectedDriveMethod = '';
    selectedDriveMethodLabel = '';
    isAccompanimentAvailable = false;

    // 시승 방법 데이터 배열
    methodOptions = [
        {
            id: 'accompanied',
            name: '동승 시승 서비스',
            description: '고객님이 직접 플래그십 방문하시어 영업담당과 동승 시승하는 서비스',
            class: ''
        },
        {
            id: 'self',
            name: '셀프 시승 서비스',
            description: '고객님이 직접 드라이빙센터/지점 방문하시어 셀프시승하는 서비스(차량 설명 미포함)',
            class: ''
        }
    ];

    // Step 5: 일정 선택
    preferredDate = '';
    preferredTime = '';
    purchaseTimeline = '';
    additionalNotes = '';
    availableDateOptions = [];
    availableTimeOptions = []; //드롭다운에 바인딩될 시간옵션 배열
    
    // 구입 예정 시기 옵션
    purchaseTimelineOptions = [
        { label: '선택해주세요', value: '' },
        { label: '1개월 내', value: '1개월 내' },
        { label: '2개월 내', value: '2개월 내' },
        { label: '3개월 내', value: '3개월 내' },
        { label: '6개월 내', value: '6개월 내' },
        { label: '1년 내', value: '1년 내' },
        { label: '미정', value: '미정' }
    ];


    // Step 6: 동의
    privacyAgreement = false;
    marketingAgreement = false;

    // URL 파라미터에서 초기 차량 정보 받기
    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference && currentPageReference.state) {
            const car = currentPageReference.state.car;
            const label = currentPageReference.state.label;
            
            if (car && label) {
                // this.selectedCar = car;
                this.selectedCar = typeof car === 'object' ? car.Id : car;
                this.selectedCarLabel = label;
            }
        }
    }

    // 단계별 클래스 계산
    get step1Class() {
        return this.currentStep >= 1 ? 'active' : '';
    }

    get step2Class() {
        return this.currentStep >= 2 ? 'active' : '';
    }

    get step3Class() {
        return this.currentStep >= 3 ? 'active' : '';
    }

    get step4Class() {
        return this.currentStep >= 4 ? 'active' : '';
    }

    get step5Class() {
        return this.currentStep >= 5 ? 'active' : '';
    }

    get step6Class() {
        return this.currentStep >= 6 ? 'active' : '';
    }

    // 차량 선택 클래스 계산
    get carOptionsWithClass() {
        return this.carOptions.map(car => ({
            ...car,
            class: this.selectedCar === car.id ? 'car-option selected' : 'car-option',
            style: this.selectedCar === car.id ? 
                'border: 3px solid #0070d2; background-color: #f0f8ff; box-shadow: 0 4px 12px rgba(0, 112, 210, 0.3); padding: 1rem; border-radius: 8px; cursor: pointer;' : 
                'border: 2px solid #e0e0e0; background-color: white; padding: 1rem; border-radius: 8px; cursor: pointer; transition: all 0.3s ease;'
        }));
    }

    get methodOptionsWithClass() {
        return this.methodOptions.map(method => ({
            ...method,
            class: this.selectedDriveMethod === method.id ? 'method-option selected' : 'method-option',
            style: this.selectedDriveMethod === method.id ? 
                'position: relative; transition: all 0.3s ease; border-color: #0070d2; background-color: #f0f8ff; box-shadow: 0 4px 12px rgba(0, 112, 210, 0.3); border: 2px solid #0070d2; border-radius: 8px; padding: 2rem; cursor: pointer; text-align: center;' : 
                'position: relative; transition: all 0.3s ease; border: 2px solid #e0e0e0; border-radius: 8px; padding: 2rem; cursor: pointer; background-color: white; text-align: center;',
            showSelectedText: this.selectedDriveMethod === method.id
        }));
    }

    // 거점 선택 클래스
    get gangnamClass() {
        return this.selectedDealer === 'gangnam' ? 'selected' : '';
    }

    get seochoClass() {
        return this.selectedDealer === 'seocho' ? 'selected' : '';
    }

    get songpaClass() {
        return this.selectedDealer === 'songpa' ? 'selected' : '';
    }

    get mapoClass() {
        return this.selectedDealer === 'mapo' ? 'selected' : '';
    }

    // 라벨 getter
    get preferredTimeLabel() {
        if (this.preferredTime) {
            return this.formatTimeToKorean(this.preferredTime);
        }
        return '';
    }

    // 유효성 검사 getter (조건부 렌더링용)
    get isStep5Valid() {
        return this.preferredDate && this.preferredTime && this.purchaseTimeline;
    }

    get isStep6Valid() {
        return this.privacyAgreement;
    }

    // 날짜 범위 getter
    get minDate() {
        const today = new Date();
        return today.toISOString().split('T')[0]; // 오늘 날짜를 YYYY-MM-DD 형식으로
    }

    get maxDate() {
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3); // 3개월 후까지
        return maxDate.toISOString().split('T')[0];
    }

    // Step 1: 개인정보 확인
    handleNextStep1() {
        this.currentStep = 2;
        this.showStep1 = false;
        this.showStep2 = true;
        this.showStep3 = false;
        this.showStep4 = false;
        this.showStep5 = false;
        this.showStep6 = false;
    }

    // Step 2: 차량 선택
    handleCarSelect(event) {
        const car = event.currentTarget.dataset.car;
        this.selectedCar = car;
        
        // 차량 라벨 설정
        switch(car) {
            case 'rayev': this.selectedCarLabel = 'Ray EV'; break;
            case 'niroev': this.selectedCarLabel = 'Niro EV'; break;
            case 'ev3': this.selectedCarLabel = 'EV3'; break;
            case 'ev4': this.selectedCarLabel = 'EV4'; break;
        }
    }

    handlePreviousStep2() {
        this.currentStep = 1;
        this.showStep1 = true;
        this.showStep2 = false;
        this.showStep3 = false;
        this.showStep4 = false;
        this.showStep5 = false;
        this.showStep6 = false;
    }

    handleNextStep2() {
        if (!this.selectedCar) {
            this.dispatchEvent(new ShowToastEvent({
                title: '선택 필요',
                message: '차량을 선택해주세요.',
                variant: 'warning'
            }));
            return;
        }
        
        // 차량 선택 후 해당 차량의 스토어 로드
        this.loadStoresForSelectedCar();
        
        this.currentStep = 3;
        this.showStep1 = false;
        this.showStep2 = false;
        this.showStep3 = true;
        this.showStep4 = false;
        this.showStep5 = false;
        this.showStep6 = false;
    }

    // Step 3: 시승 거점 선택
    storeList = [];

    // 차량 선택 후 스토어 로드
    loadStoresForSelectedCar() {
        if (this.selectedCar) {
            // 차량 ID를 이름으로 변환
            let carName = '';
            switch(this.selectedCar) {
                case 'rayev': carName = 'Ray EV'; break;
                case 'niroev': carName = 'Niro EV'; break;
                case 'ev3': carName = 'EV3'; break;
                case 'ev4': carName = 'EV4'; break;
                default: carName = 'Ray EV'; // 기본값
            }
            
            getFlagshipStoresWithLocation({ carName: carName })
                .then(result => {
                    console.log('Loaded stores for', carName, ':', result);
                    this.storeList = result;
                })
                .catch(error => {
                    console.error('Error loading stores:', error);
                    console.log(carName)
                });
        }
    }
    handleDealerSelect(event) {
        const storeId = event.detail; // 지도 마커에서 전달된 매장 Id
        const store = this.storeList.find(s => s.Id === storeId);

        this.selectedDealer = storeId;
        this.selectedDealerLabel = store?.Name || '';
    }

    getDealerClass(storeId) {
        return this.selectedDealer === storeId ? 'dealer-option selected' : 'dealer-option';
    }

    handlePreviousStep3() {
        this.currentStep = 2;
        this.showStep1 = false;
        this.showStep2 = true;
        this.showStep3 = false;
        this.showStep4 = false;
        this.showStep5 = false;
        this.showStep6 = false;
    }

    handleNextStep3() {
        if (!this.selectedDealer) {
            this.dispatchEvent(new ShowToastEvent({
                title: '선택 필요',
                message: '시승 거점을 선택해주세요.',
                variant: 'warning'
            }));
            return;
        }
        
        this.currentStep = 4;
        this.showStep1 = false;
        this.showStep2 = false;
        this.showStep3 = false;
        this.showStep4 = true;
        this.showStep5 = false;
        this.showStep6 = false;
    }

    // Step 4: 시승 방법 선택
    handleMethodSelect(event) {
        const method = event.currentTarget.dataset.method;
        this.selectedDriveMethod = method;
        
        // 시승 방법 라벨 설정
        switch(method) {
            case 'accompanied': this.selectedDriveMethodLabel = '동승 시승 서비스'; break;
            case 'self': this.selectedDriveMethodLabel = '셀프 시승 서비스'; break;
            default: this.selectedDriveMethodLabel = '';
        }
    }

    handlePreviousStep4() {
        this.currentStep = 3;
        this.showStep1 = false;
        this.showStep2 = false;
        this.showStep3 = true;
        this.showStep4 = false;
        this.showStep5 = false;
        this.showStep6 = false;
    }

    handleNextStep4() {
        if (!this.selectedDriveMethod) {
            this.dispatchEvent(new ShowToastEvent({
                title: '선택 필요',
                message: '시승 방법을 선택해주세요.',
                variant: 'warning'
            }));
            return;
        }

        console.log('vehicleModelId:', this.selectedCar); //rayev로 나와 오류  id를 받아야 함
        
        getAvailableDates({
            vehicleModelId: 'a0SgL0000005e4rUAA',
            flagshipStoreId: this.selectedDealer,
            driveMethod: this.selectedDriveMethod,
            isAccompanimentAvailable: this.selectedDriveMethod === 'staff' // 동승 시승 서비스인 경우 true
        }).then(dates => {
            console.log('Apex에서 받은 dates:', dates);
            this.availableDateOptions = dates.map(date => ({
                label: new Date(date).toLocaleDateString('ko-KR'),
                value: date.slice(0, 10)
            }));

        this.currentStep = 5;
        this.showStep1 = false;
        this.showStep2 = false;
        this.showStep3 = false;
        this.showStep4 = false;
        this.showStep5 = true;
        this.showStep6 = false;
    }).catch(error => {
        this.dispatchEvent(new ShowToastEvent({
            title: '오류',
            message: error.body.message,
            variant: 'error'
        }));
    });
}

    // Step 5: 일정 선택
    handleDateChange(event) {
        this.preferredDate = event.target.value;
        console.log('flagshipStoreId: ' + this.selectedDealer);
        console.log('driveMethod: ' + this.selectedDriveMethod);
        console.log('preferredDate: ' + this.preferredDate);
    
        // 날짜가 선택되면 해당 날짜의 가능한 시간을 가져옴
        if (this.preferredDate) {
            getAvailableTimes({
                testDriveDate: this.preferredDate,
                vehicleModelId: 'a0SgL0000005e4rUAA',
                flagshipStoreId: this.selectedDealer,
                driveMethod: this.selectedDriveMethod
            }).then(times => {
                console.log('times: ' + JSON.stringify(times));

                this.availableTimeOptions = times.map(t => {
                    const timeLabel = this.formatTimeToKorean(t);
                    return {
                        label: timeLabel,
                        value: t
                    };
                });
                console.log('옵션 세팅 후 availableTimeOptions: ' + JSON.stringify(this.availableTimeOptions));

            }).catch(error => {
                this.dispatchEvent(new ShowToastEvent({
                    title: '오류',
                    message: error.body.message,
                    variant: 'error'
                }));
            });
        }
    }

    // 시간을 오전/오후 형식으로 변환하는 함수
    formatTimeToKorean(timeString) {
        try {
            // "11:00:00.000Z" 형식에서 시간과 분 추출
            const timeMatch = timeString.match(/(\d{1,2}):(\d{2}):\d{2}/);
            if (!timeMatch) {
                return timeString;
            }
            
            const hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            
            if (hours < 12) {
                return `오전 ${hours}:${minutes.toString().padStart(2, '0')}`;
            } else if (hours === 12) {
                return `오후 ${hours}:${minutes.toString().padStart(2, '0')}`;
            } else {
                // 13시 이상은 12를 빼서 표시 (13시 → 1시, 18시 → 6시)
                const displayHours = hours - 12;
                return `오후 ${displayHours}:${minutes.toString().padStart(2, '0')}`;
            }
        } catch (error) {
            console.error('시간 형식 변환 오류:', error);
            return timeString; // 변환 실패시 원본 반환
        }
    }

    handleTimeChange(event) {
        this.preferredTime = event.detail.value;
    }

    handlePurchaseTimelineChange(event) {
        this.purchaseTimeline = event.detail.value;
    }

    handleNotesChange(event) {
        this.additionalNotes = event.target.value;
    }

    handlePreviousStep5() {
        this.currentStep = 4;
        this.showStep1 = false;
        this.showStep2 = false;
        this.showStep3 = false;
        this.showStep4 = true;
        this.showStep5 = false;
        this.showStep6 = false;
    }

    handleNextStep5() {
        if (!this.isStep5Valid) {
            this.dispatchEvent(new ShowToastEvent({
                title: '입력 필요',
                message: '희망 날짜와 시간을 선택해주세요.',
                variant: 'warning'
            }));
            return;
        }
        
        this.currentStep = 6;
        this.showStep1 = false;
        this.showStep2 = false;
        this.showStep3 = false;
        this.showStep4 = false;
        this.showStep5 = false;
        this.showStep6 = true;
    }

    // Step 6: 동의
    handlePrivacyAgreement(event) {
        this.privacyAgreement = event.target.checked;
    }

    handleMarketingAgreement(event) {
        this.marketingAgreement = event.target.checked;
    }

    handlePreviousStep6() {
        this.currentStep = 5;
        this.showStep1 = false;
        this.showStep2 = false;
        this.showStep3 = false;
        this.showStep4 = false;
        this.showStep5 = true;
        this.showStep6 = false;
    }

    // 최종 제출
    handleSubmit() {
        if (!this.isStep6Valid) {
            this.dispatchEvent(new ShowToastEvent({
                title: '동의 필요',
                message: '개인정보 수집 및 이용에 동의해주세요.',
                variant: 'warning'
            }));
            return;
        }

        createLeadAndTestDrive({
            userName: this.userName,
            userPhone: this.userPhone,
            userEmail: this.userEmail,
            selectedCar: this.selectedCar,
            selectedCarLabel: this.selectedCarLabel,
            preferredDate: this.preferredDate,
            preferredTime: this.preferredTime,
            purchaseTimeline: this.purchaseTimeline,
            additionalNotes: this.additionalNotes || '',
            selectedDealer: this.selectedDealer,
            selectedDriveMethod: this.selectedDriveMethod
        })
        .then(() => {
            this.dispatchEvent(new ShowToastEvent({
                title: '시승 신청 완료',
                message: '시승 신청이 성공적으로 접수되었습니다. 담당자가 연락드리겠습니다.',
                variant: 'success'
            }));
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        })
        .catch(error => {
            this.dispatchEvent(new ShowToastEvent({
                title: '오류',
                message: error.body ? error.body.message : error.message,
                variant: 'error'
            }));
        });
}
}