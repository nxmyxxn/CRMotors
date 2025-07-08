import { LightningElement } from 'lwc';
// 1단계에서 만든 정적 리소스(Static Resource)를 import 합니다.
import blue from '@salesforce/resourceUrl/ray_ev_blue';

export default class KiaQuoteSummary extends LightningElement {
    carImageUrl = blue;

    // 아코디언 섹션이 기본적으로 펼쳐져 있도록 설정합니다.
    activeSections = ['vehiclePrice'];
}