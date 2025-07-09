import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

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
    userName = '김철수';
    userPhone = '010-1234-5678';
    userEmail = 'kim@example.com';
    userGrade = 'VIP';

    // Step 2: 차량 선택
    selectedCar = '';
    selectedCarLabel = '';
    rayevImage = rayevImg;
    niroevImage = niroevImg;
    ev3Image = ev3Img;
    ev4Image = ev4Img;

    // Step 3: 시승 거점
    selectedDealer = '';
    selectedDealerLabel = '';

    // Step 4: 시승 방법
    selectedDriveMethod = '';
    selectedDriveMethodLabel = '';

    // Step 5: 일정 선택
    preferredDate = '';
    preferredTime = '';
    additionalNotes = '';

    // Step 6: 동의
    privacyAgreement = false;
    marketingAgreement = false;

    // 옵션 데이터
    timeOptions = [
        { label: '선택해주세요', value: '' },
        { label: '09:00', value: '09:00' },
        { label: '10:00', value: '10:00' },
        { label: '11:00', value: '11:00' },
        { label: '13:00', value: '13:00' },
        { label: '14:00', value: '14:00' },
        { label: '15:00', value: '15:00' },
        { label: '16:00', value: '16:00' },
        { label: '17:00', value: '17:00' }
    ];

    // URL 파라미터에서 초기 차량 정보 받기
    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        if (currentPageReference && currentPageReference.state) {
            const car = currentPageReference.state.car;
            const label = currentPageReference.state.label;
            
            if (car && label) {
                this.selectedCar = car;
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

    // 차량 선택 클래스
    get rayevClass() {
        return this.selectedCar === 'rayev' ? 'selected' : '';
    }

    get niroevClass() {
        return this.selectedCar === 'niroev' ? 'selected' : '';
    }

    get ev3Class() {
        return this.selectedCar === 'ev3' ? 'selected' : '';
    }

    get ev4Class() {
        return this.selectedCar === 'ev4' ? 'selected' : '';
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

    // 시승 방법 선택 클래스
    get showroomClass() {
        return this.selectedDriveMethod === 'showroom' ? 'selected' : '';
    }

    get homeClass() {
        return this.selectedDriveMethod === 'home' ? 'selected' : '';
    }

    // 라벨 getter
    get preferredTimeLabel() {
        const time = this.timeOptions.find(option => option.value === this.preferredTime);
        return time ? time.label : '';
    }

    // 유효성 검사 getter (조건부 렌더링용)
    get isStep5Valid() {
        return this.preferredDate && this.preferredTime;
    }

    get isStep6Valid() {
        return this.privacyAgreement;
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
        
        this.currentStep = 3;
        this.showStep1 = false;
        this.showStep2 = false;
        this.showStep3 = true;
        this.showStep4 = false;
        this.showStep5 = false;
        this.showStep6 = false;
    }

    // Step 3: 시승 거점 선택
    handleDealerSelect(event) {
        const dealer = event.currentTarget.dataset.dealer;
        this.selectedDealer = dealer;
        
        // 거점 라벨 설정
        switch(dealer) {
            case 'gangnam': this.selectedDealerLabel = '강남점'; break;
            case 'seocho': this.selectedDealerLabel = '서초점'; break;
            case 'songpa': this.selectedDealerLabel = '송파점'; break;
            case 'mapo': this.selectedDealerLabel = '마포점'; break;
        }
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
            case 'showroom': this.selectedDriveMethodLabel = '전시장 방문'; break;
            case 'home': this.selectedDriveMethodLabel = '홈 시승'; break;
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
        
        this.currentStep = 5;
        this.showStep1 = false;
        this.showStep2 = false;
        this.showStep3 = false;
        this.showStep4 = false;
        this.showStep5 = true;
        this.showStep6 = false;
    }

    // Step 5: 일정 선택
    handleDateChange(event) {
        this.preferredDate = event.target.value;
    }

    handleTimeChange(event) {
        this.preferredTime = event.target.value;
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
        
        // 여기에 실제 제출 로직을 구현할 수 있습니다
        this.dispatchEvent(new ShowToastEvent({
            title: '시승 신청 완료',
            message: '시승 신청이 성공적으로 접수되었습니다. 담당자가 연락드리겠습니다.',
            variant: 'success'
        }));

        // 완료 후 메인 페이지로 이동
        setTimeout(() => {
            window.location.href = '/test';
        }, 2000);
    }
}