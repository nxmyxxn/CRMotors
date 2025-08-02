// File: step5RepairReservation.js (LWC JavaScript Controller)
import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAvailableTestDriveSlots from '@salesforce/apex/TestDriveScheduler.getAvailableTestDriveSlots';
import createTestDriveReservation from '@salesforce/apex/TestDriveScheduler.createTestDriveReservation';

export default class Step5RepairReservation extends LightningElement {
    @api accountId; // 고객 정보
    @api flagshipStoreId; // 선택된 플래그십 스토어
    @api carModel; // 선택된 차량 모델
    @api trim; // 선택된 트림
    @api color; // 선택된 컬러
    @api options; // 선택된 옵션

    @track selectedDate = null;
    @track availableTimeSlots = [];
    @track selectedSlot = null;
    @track submitting = false;

    get hasSlots() {
        return this.availableTimeSlots.length > 0;
    }

    get availableSlots() {
        return this.availableTimeSlots.filter(slot => slot.isAvailable);
    }

    handleDateChange(event) {
        this.selectedDate = event.detail.value;
        this.selectedSlot = null;

        if (this.selectedDate && this.flagshipStoreId) {
            getAvailableTestDriveSlots({
                selectedDate: this.selectedDate,
                flagshipStoreId: this.flagshipStoreId
            }).then(result => {
                this.availableTimeSlots = result;
                console.log('시승 슬롯 조회 결과:', result);
            }).catch(error => {
                console.error('시승 슬롯 조회 오류:', error);
                this.availableTimeSlots = [];
                this.dispatchEvent(new ShowToastEvent({
                    title: '오류',
                    message: '시승 시간을 불러오는 중 오류가 발생했습니다.',
                    variant: 'error'
                }));
            });
        }
    }

    handleSlotSelect(event) {
        const slotId = event.currentTarget.dataset.slotId;
        const slot = this.availableTimeSlots.find(s => s.slotId === slotId);
        
        if (slot && slot.isAvailable) {
            this.selectedSlot = slot;
        }
    }

    get isNextDisabled() {
        return !this.selectedSlot;
    }

    handleNext() {
        if (!this.selectedSlot || !this.selectedDate || !this.accountId || !this.flagshipStoreId) {
            this.dispatchEvent(new ShowToastEvent({
                title: '경고',
                message: '모든 필수 정보를 입력해주세요.',
                variant: 'warning'
            }));
            return;
        }

        this.submitting = true;

        createTestDriveReservation({
            accountId: this.accountId,
            flagshipStoreId: this.flagshipStoreId,
            slotId: this.selectedSlot.slotId,
            preferredDate: this.selectedDate,
            carModel: this.carModel,
            trim: this.trim,
            color: this.color,
            options: this.options
        }).then(result => {
            this.dispatchEvent(new ShowToastEvent({
                title: '성공',
                message: '시승 예약이 완료되었습니다.',
                variant: 'success'
            }));
            this.dispatchEvent(new CustomEvent('nextstep', { 
                detail: { 
                    step: 5,
                    reservationId: result
                } 
            }));
        }).catch(error => {
            console.error('시승 예약 실패:', error);
            this.dispatchEvent(new ShowToastEvent({
                title: '오류',
                message: error.body ? error.body.message : '시승 예약 중 오류가 발생했습니다.',
                variant: 'error'
            }));
        }).finally(() => {
            this.submitting = false;
        });
    }
}