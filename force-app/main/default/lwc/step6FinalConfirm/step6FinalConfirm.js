import { LightningElement, api, track } from 'lwc';
import assignTechnicianAndCreateCase from '@salesforce/apex/RepairReservationScheduler.assignTechnicianAndCreateCase';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class Step6FinalConfirm extends LightningElement {
    @api selectedServiceDetails; // string (semicolon-delimited)
    @api repairShopName;
    @api repairShopId;
    @api selectedDate; // YYYY-MM-DD
    @api selectedSlotTime; // HH:mm
    @api accountId;

    @track description = '';
    @track submitting = false;

    connectedCallback() {
        console.log('🔍 [STEP6 디버그] 받은 데이터:');
        console.log('selectedServiceDetails:', this.selectedServiceDetails);
        console.log('repairShopId:', this.repairShopId);
        console.log('selectedDate:', this.selectedDate);
        console.log('selectedSlotTime:', this.selectedSlotTime);
        console.log('accountId:', this.accountId);
    }

    get serviceDetailsLabel() {
        if (!this.selectedServiceDetails) return '';
        return this.selectedServiceDetails.split(';').join(', ');
    }

    get fullDateTime() {
        return `${this.selectedDate} ${this.selectedSlotTime}`;
    }

    handleDescriptionChange(event) {
        this.description = event.detail.value;
    }

    handleSubmit() {
        console.log('🚀 [STEP6] 최종 예약 처리 시작');
        
        if (!this.accountId || !this.repairShopId || !this.selectedDate || !this.selectedSlotTime || !this.selectedServiceDetails) {
            this.showToast('입력 누락', '예약 정보를 모두 확인해주세요.', 'error');
            return;
        }

        this.submitting = true;

        const preferredDateString = `${this.selectedDate} ${this.selectedSlotTime}:00`;
        console.log('📅 [STEP6] 전송할 날짜:', preferredDateString);

        assignTechnicianAndCreateCase({
            accountId: this.accountId,
            repairShopId: this.repairShopId,
            preferredDate: preferredDateString,
            selectedDetails: this.selectedServiceDetails
        }).then(() => {
            console.log('✅ [STEP6] 예약 성공');
            this.showToast('예약 완료', '정비 예약이 성공적으로 접수되었습니다.', 'success');
            
            // 예약 완료 후 처리 - nextstep 이벤트 발생
            this.dispatchEvent(new CustomEvent('nextstep', {
                detail: { 
                    success: true,
                    step: 7 // 완료 단계로 이동
                }
            }));
        }).catch(error => {
            console.error('❌ [STEP6] 예약 실패:', error);
            this.showToast('예약 실패', '예약 중 문제가 발생했습니다.', 'error');
        }).finally(() => {
            this.submitting = false;
        });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}