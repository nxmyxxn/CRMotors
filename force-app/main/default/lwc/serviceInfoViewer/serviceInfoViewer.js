import { LightningElement, track } from 'lwc';
import searchAccounts from '@salesforce/apex/CaseAssetWarrantyController.searchAccounts';
import getInfoByAccount from '@salesforce/apex/CaseAssetWarrantyController.getInfoByAccount';

export default class ServiceInfoViewer extends LightningElement {
    @track searchKey = '';
    @track accountOptions = [];
    @track selectedAccountId = '';
    @track serviceData = [];

    handleSearchKeyChange(event) {
        this.searchKey = event.target.value;
        if (this.searchKey.length >= 2) {
            searchAccounts({ name: this.searchKey })
                .then(results => {
                    this.accountOptions = results.map(acc => ({
                        label: acc.Name,
                        value: acc.Id
                    }));
                });
        } else {
            this.accountOptions = [];
        }
    }

    handleAccountSelect(event) {
        this.selectedAccountId = event.detail.value;
        getInfoByAccount({ accountId: this.selectedAccountId })
            .then(data => {
                this.serviceData = data.map(item => ({
                    ...item,
                    caseUrl: `/lightning/r/Case/${item.caseId}/view`,
                    assetUrl: `/lightning/r/Asset/${item.assetId}/view`,
                    warrantyUrl: `/lightning/r/Warranty__c/${item.warrantyId}/view`
                }));
            });
    }
}