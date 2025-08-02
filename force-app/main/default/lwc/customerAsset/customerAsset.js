import { LightningElement, wire, track } from 'lwc';
import getAssetsByAccount from '@salesforce/apex/CustomerAssetController.getAssetsByAccount';

export default class CustomerAsset extends LightningElement {
    @track assets = [];

    @wire(getAssetsByAccount)
    wiredAssets({ error, data }) {
        if (data) {
            this.assets = data;
        } else if (error) {
            console.error('Error fetching assets:', error);
        }
    }

    handleNext() {
        if (!this.assets || this.assets.length === 0) {
            this.dispatchEvent(new CustomEvent('nextstep', {
                detail: {
                    assetInfo: null
                }
            }));
        } else {
            this.dispatchEvent(new CustomEvent('nextstep', {
                detail: {
                    assetInfo: this.assets[0] // 첫 번째 차량만 전달 (필요 시 다중 선택 구조로 확장 가능)
                }
            }));
        }
    }
}