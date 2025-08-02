import { LightningElement } from 'lwc';
import logoImg from '@salesforce/resourceUrl/logoImg';

export default class Navbar extends LightningElement {
    logoImage = logoImg;
    isMenuOpenOnMobile = false;

    toggleMenu() {
        this.isMenuOpenOnMobile = !this.isMenuOpenOnMobile;
    }
    closeMenu() {
        this.isMenuOpenOnMobile = false;
    }
}