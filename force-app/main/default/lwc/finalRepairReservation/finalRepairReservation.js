import { LightningElement, api, track } from 'lwc';
import getAvailableTimeSlots from '@salesforce/apex/RepairReservationScheduler.getAvailableTimeSlots';

export default class FinalRepairReservation extends LightningElement {
    @api accountId;
    @api repairShopId;
    @api selectedServiceDetails;

    @track selectedDate = null;
    @track availableTimeSlots = [];
    @track selectedSlot = null;

    // 디버그: 모든 API 속성값 확인
    connectedCallback() {
        console.log('🔍 [디버그] 컴포넌트 로드시 API 속성값 확인:');
        console.log('accountId:', this.accountId);
        console.log('repairShopId:', this.repairShopId);
        console.log('selectedServiceDetails:', this.selectedServiceDetails);
        console.log('selectedServiceDetails type:', typeof this.selectedServiceDetails);
    }

    get hasSlots() {
        return this.availableTimeSlots.length > 0;
    }

    handleDateChange(event) {
        this.selectedDate = event.detail.value;
        this.selectedSlot = null;

        console.log('[예약 날짜 선택됨]', this.selectedDate);
        console.log('[repairShopId 확인]', this.repairShopId);

        if (this.selectedDate && this.repairShopId) {
            getAvailableTimeSlots({
                selectedDate: this.selectedDate,
                repairShopId: this.repairShopId
            }).then(result => {
                console.log('[받아온 타임슬롯]', result);

                this.availableTimeSlots = result.map(slot => ({
                    ...slot,
                    fullLabel: `${slot.label} (${slot.remaining}명 가능)`,
                    variant: slot.remaining > 0 ? 'neutral' : 'destructive',
                    isDisabled: slot.remaining <= 0
                }));
            }).catch(error => {
                console.error('타임 슬롯 불러오기 오류:', error);
                this.availableTimeSlots = [];
            });
        } else {
            console.warn('조건 미충족: 날짜 또는 정비소 ID 누락');
        }
    }

    handleSlotSelect(event) {
        console.log('🎯 [디버그] handleSlotSelect 호출됨');
        this.selectedSlot = event.currentTarget.dataset.time;
        console.log('✅ [디버그] selectedSlot 설정됨:', this.selectedSlot);
    }

    get isNextDisabled() {
        return !this.selectedSlot;
    }

    handleNext() {
        console.log('🚀 [디버그] handleNext 호출됨');
        
        // 모든 필수값 체크
        console.log('🔍 [디버그] 필수값 체크:');
        console.log('selectedSlot:', this.selectedSlot);
        console.log('selectedDate:', this.selectedDate);
        console.log('accountId:', this.accountId);
        console.log('repairShopId:', this.repairShopId);
        console.log('selectedServiceDetails:', this.selectedServiceDetails);

        if (!this.selectedSlot || !this.selectedDate || !this.accountId || !this.repairShopId || !this.selectedServiceDetails) {
            console.log('❌ [디버그] 조건문에서 막힘 - 필수값 누락');
            return;
        }

        console.log('✅ [디버그] 조건문 통과 - STEP 6로 직접 이동');

        // API 호출 없이 바로 다음 단계로 이동
        this.dispatchEvent(new CustomEvent('nextstep', { 
            detail: {
                step: 6,
                selectedDate: this.selectedDate,
                selectedSlotTime: this.selectedSlot
            } 
        }));
    }
}