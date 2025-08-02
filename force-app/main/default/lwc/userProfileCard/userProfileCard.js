import { LightningElement, wire, track } from 'lwc';
import getCurrentUser from '@salesforce/apex/UserInfoController.getCurrentUser';

export default class UserProfileCard extends LightningElement {
    @track user = {};

    @wire(getCurrentUser)
    wiredUser({ error, data }) {
        if (data) {
            this.user = data;
        } else if (error) {
            console.error('User fetch error:', error);
        }
    }
}