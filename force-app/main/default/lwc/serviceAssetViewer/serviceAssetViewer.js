import { LightningElement, track } from 'lwc';
import getCaseAssetInfo from '@salesforce/apex/CaseAssetController.getCaseAssetInfo';

export default class CaseAssetViewer extends LightningElement {
    @track searchKey = '';
    @track assetInfo;
    @track columns = [
        {
            label: '자산 이름',
            fieldName: 'assetLink',
            type: 'url',
            typeAttributes: {
                label: { fieldName: 'assetName' },
                target: '_blank',
                tooltip: '자산 레코드로 이동'
            }
        },
        { label: '제품명', fieldName: 'productName' },
        { label: '차대번호', fieldName: 'vin' },
        { label: '구매일자', fieldName: 'purchaseDate', type: 'date' }
    ];

    get tableData() {
        if (!this.assetInfo) return [];
        return [{
            id: '1',
            assetName: this.assetInfo.assetName,
            assetLink: `/lightning/r/Asset/${this.assetInfo.assetId}/view`,
            productName: this.assetInfo.productName,
            vin: this.assetInfo.vin,
            purchaseDate: this.assetInfo.purchaseDate
        }];
    }

    handleSearchKeyChange(event) {
        this.searchKey = event.target.value;
    }

    handleSearch() {
        getCaseAssetInfo({ subjectKeyword: this.searchKey })
            .then(result => {
                this.assetInfo = result;
            })
            .catch(error => {
                console.error('오류 발생:', error);
            });
    }
}