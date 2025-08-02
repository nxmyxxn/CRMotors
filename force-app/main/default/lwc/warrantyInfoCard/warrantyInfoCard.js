import { LightningElement, api, wire } from 'lwc';
import getWarrantyByAccountId from '@salesforce/apex/WarrantyController.getWarrantyByAccountId';

export default class WarrantyInfoCard extends LightningElement {
    @api recordId; // 현재 보고 있는 Account 레코드 ID
    warranty;

    @wire(getWarrantyByAccountId, { accountId: '$recordId' })
    wiredWarranty({ error, data }) {
        if (data) {
            this.warranty = data;
        } else if (error) {
            console.error('Error fetching warranty data:', error);
            this.warranty = null;
        }
    }
}