// ✅ reservationFlow.js 통합 - STEP6 핸들러 추가
import { LightningElement, track } from 'lwc';

export default class ReservationFlow extends LightningElement {
    @track step = 1;

    @track customerInfo = {};
    @track assetInfo = {};
    @track serviceDetails = {};
    @track repairShopId = '';
    @track repairShopName = '';
    @track selectedDate = '';
    @track selectedSlotTime = '';

    get isStep1() { return this.step === 1; }
    get isStep2() { return this.step === 2; }
    get isStep3() { return this.step === 3; }
    get isStep4() { return this.step === 4; }
    get isStep5() { return this.step === 5; }
    get isStep6() { return this.step === 6; }
    get isStep7() { return this.step === 7; } // 완료 화면

    handleStep1(event) {
        console.log('🔄 STEP 1 → 2');
        this.customerInfo = event.detail.customerInfo;
        this.step = 2;
    }

    handleStep2(event) {
        console.log('🔄 STEP 2 → 3');
        this.assetInfo = event.detail.assetInfo;
        this.step = 3;
    }

    handleStep3(event) {
        console.log('🔄 STEP 3 → 4');
        this.serviceDetails = event.detail.serviceReservationData;
        this.step = 4;
    }

    handleStep4(event) {
        console.log('🔄 STEP 4 → 5');
        this.repairShopId = event.detail.repairShopId;
        this.repairShopName = event.detail.repairShopName;
        this.step = 5;
    }

    handleStep5(event) {
        console.log('🔄 STEP 5 → 6');
        this.selectedDate = event.detail.selectedDate;
        this.selectedSlotTime = event.detail.selectedSlotTime;
        this.step = 6;
    }

    handleStep6(event) {
        console.log('🔄 STEP 6 → 7 (완료)');
        console.log('예약 완료 이벤트 받음:', event.detail);
        
        if (event.detail.success) {
            this.step = 7; // 완료 화면으로 이동
        }
    }
}