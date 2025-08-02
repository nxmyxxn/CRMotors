// caseAsset.js
import { LightningElement, api, wire } from 'lwc';
import getAssetForCase from '@salesforce/apex/CaseAssetController.getAssetForCase';

export default class CaseAsset extends LightningElement {
    @api recordId;
    asset;

    @wire(getAssetForCase, { caseId: '$recordId' })
    wiredAsset({ error, data }) {
        if (data) this.asset = data;
    }
}