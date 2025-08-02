import { LightningElement, track } from 'lwc';
import RAY_EV_IMAGE from '@salesforce/resourceUrl/ray_ev_image';
import EV4_IMAGE from '@salesforce/resourceUrl/ev4_image';

// 차량 데이터
const ALL_VEHICLES = [
    { name: 'Ray EV', imageUrl: RAY_EV_IMAGE, power: 64.3, torque: 147, battery: 35.2, range: 205, chargeTime: 40 },
    { name: 'EV4', imageUrl: EV4_IMAGE, power: 160, torque: 350, battery: 81.4, range: 513, chargeTime: 31 }
];

export default class VehicleComparator extends LightningElement {
    @track currentStep = 'selection';
    @track vehicle1Name = '';
    @track vehicle2Name = '';
    @track selectedVehicles = [];

    get allVehicleOptions() {
        return ALL_VEHICLES.map(vehicle => ({ label: vehicle.name, value: vehicle.name }));
    }

    handleVehicle1Change(event) {
        this.vehicle1Name = event.detail.value;
    }
    handleVehicle2Change(event) {
        this.vehicle2Name = event.detail.value;
    }

    get isCompareButtonDisabled() {
        return !this.vehicle1Name
            || !this.vehicle2Name
            || this.vehicle1Name === this.vehicle2Name;
    }

    showComparison() {
        // 선택된 2대만 배열로 추출
        this.selectedVehicles = ALL_VEHICLES.filter(vehicle =>
            [this.vehicle1Name, this.vehicle2Name].includes(vehicle.name)
        );
        this.currentStep = 'comparison';
    }

    showSelection() {
        // 선택 초기화
        this.currentStep = 'selection';
        this.vehicle1Name = '';
        this.vehicle2Name = '';
        this.selectedVehicles = [];
    }

    get isSelectionStep() { return this.currentStep === 'selection'; }
    get isComparisonStep() { return this.currentStep === 'comparison'; }

    get comparisonMetrics() {
        if (this.selectedVehicles.length !== 2) return [];
        const [vehicle1, vehicle2] = this.selectedVehicles;
        const metrics = [
            { label: '최고출력', apiName: 'power', unit: 'kW' },
            { label: '최대토크', apiName: 'torque', unit: 'Nm' },
            { label: '배터리 용량', apiName: 'battery', unit: 'kWh' },
            { label: '1회 충전 주행거리', apiName: 'range', unit: 'km' },
            { label: '충전시간(급속)', apiName: 'chargeTime', unit: '분' }
        ];
        return metrics.map(metric => {
            const v1Val = vehicle1[metric.apiName];
            const v2Val = vehicle2[metric.apiName];
            // 충전시간은 낮을수록 좋은 값이므로, 처리 옵션에 따라 비교 방법 달리할 수도 있음
            const maxVal = metric.apiName === 'chargeTime'
                ? Math.min(v1Val, v2Val)
                : Math.max(v1Val, v2Val);
            return {
                ...metric,
                vehicles: [
                    {
                        name: vehicle1.name,
                        value: v1Val,
                        style: `width: ${(v1Val / maxVal) * 100}%; background-color: #00529e;`
                    },
                    {
                        name: vehicle2.name,
                        value: v2Val,
                        style: `width: ${(v2Val / maxVal) * 100}%; background-color: #0096d3;`
                    }
                ]
            };
        });
    }
}