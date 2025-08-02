import { LightningElement, track, wire } from 'lwc';
import getServiceDetailsPicklistValues from '@salesforce/apex/RepairReservationScheduler.getServiceDetailsPicklistValues';

export default class RepairSelector extends LightningElement {
    @track availableOptions = [];
    @track selectedServiceTypeDetails = [];
    @track description = '';

    @wire(getServiceDetailsPicklistValues)
    wiredOptions({ error, data }) {
        if (data) {
            this.availableOptions = data.map(item => ({
                label: item.label,
                value: item.value,
                isSelected: this.selectedServiceTypeDetails.includes(item.value)
            }));
        } else if (error) {
            console.error('Picklist 옵션 로드 실패:', error);
        }
    }

    handleDetailChange(event) {
        const value = event.target.dataset.value;
        const isChecked = event.target.checked;

        if (isChecked) {
            if (!this.selectedServiceTypeDetails.includes(value)) {
                this.selectedServiceTypeDetails = [...this.selectedServiceTypeDetails, value];
            }
        } else {
            this.selectedServiceTypeDetails = this.selectedServiceTypeDetails.filter(v => v !== value);
        }

        // isSelected 다시 반영
        this.availableOptions = this.availableOptions.map(opt => ({
            ...opt,
            isSelected: this.selectedServiceTypeDetails.includes(opt.value)
        }));
    }

    handleDescriptionChange(event) {
        this.description = event.detail.value;
    }

    get isNextDisabled() {
        return this.selectedServiceTypeDetails.length === 0;
    }

    // 🟡 선택된 세부 항목에 따라 Controlling Field 값 자동 결정
    determineServiceType(selectedDetails) {
        if (!selectedDetails || selectedDetails.length === 0) {
            return 'GeneralRepair'; // 기본값
        }

        // 소모품 관련 항목들
        const partsRepairItems = new Set([
            'engine_oil_filter',              // 엔진오일 및 필터
            'transmission_oil',               // 변속기 오일
            'wiper_blades',                  // 와이퍼 블레이드
            'fuse_lamp_battery',             // 퓨즈/램프/배터리
            'air_conditioning_refrigerant',   // 에어컨 냉매
            'washer_fluid_coolant',          // 워셔액/냉각수
            'other_consumables'              // 기타 소모품
        ]);

        // 선택된 항목 중 하나라도 소모품에 해당하면 PartsRepair
        for (let item of selectedDetails) {
            if (partsRepairItems.has(item)) {
                return 'PartsRepair';
            }
        }

        // 그 외는 일반/품질 정비
        return 'GeneralRepair';
    }

    handleNext() {
        // 🟡 동적으로 Controlling Field 값 결정
        const serviceType = this.determineServiceType(this.selectedServiceTypeDetails);
        console.log('🔧 자동 결정된 서비스 타입:', serviceType);
        console.log('📋 선택된 세부 항목들:', this.selectedServiceTypeDetails);

        this.dispatchEvent(new CustomEvent('nextstep', {
            detail: {
                serviceReservationData: {
                    ServiceReservationType__c: serviceType, // 🟡 Controlling Field 자동 추가
                    ServiceReservationTypeDetails__c: this.selectedServiceTypeDetails.join(';'),
                    Description__c: this.description
                },
                step: 4
            }
        }));
    }
}