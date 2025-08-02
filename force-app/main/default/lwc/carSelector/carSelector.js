import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

import rayevImg from '@salesforce/resourceUrl/car_rayev';
import niroevImg from '@salesforce/resourceUrl/car_niroev';
import ev3Img from '@salesforce/resourceUrl/car_ev3';
import ev4Img from '@salesforce/resourceUrl/car_ev4';
import carHome from '@salesforce/resourceUrl/car_home';
import carHome2 from '@salesforce/resourceUrl/car_home2';
import carHome3 from '@salesforce/resourceUrl/car_home3';



export default class CarSelector extends NavigationMixin(LightningElement) {
    cars = [
        {
            name: 'Ray EV',
            label: '레이 EV',
            image: rayevImg
        },
        {
            name: 'niroev',
            label: '니로 ev',
            image: niroevImg,
        },
        {
            name: 'ev3',
            label: 'EV3',
            image: ev3Img
        },
        {
            name: 'EV4',
            label: 'EV4',
            image: ev4Img
        },
    ];

    mainImages = [
        {
            image:carHome,
            label: 'genesis',
        },
        {
            image:carHome2,
            label: 'IONIQ 9',
        },
        {
            image:carHome3,
            label: 'grandeur',
        }
    ]
    currentIndex = 0;
    get currentImage() {
        return this.mainImages && this.mainImages.length > 0
            ? this.mainImages[this.currentIndex]
            : {};
    }

    prevImage() {
        if (this.mainImages.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.mainImages.length) % this.mainImages.length;
    }

    nextImage() {
        if (this.mainImages.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.mainImages.length;
    }

    connectedCallback() {
        // 2초(2000ms)마다 nextImage 자동 호출
        this._interval = setInterval(() => {
            this.nextImage();
        }, 2000);
    }

    disconnectedCallback() {
        // 컴포넌트가 제거될 때 interval 해제
        clearInterval(this._interval);
    }

    handleCarSelect(event) {
        const carName = event.currentTarget.dataset.car;
        const carLabel = event.currentTarget.dataset.label;
        //alert(carName+carLabel);
        window.location.href = '/driveconfig?car=' + carName + '&label=' + carLabel;
        // this[NavigationMixin.Navigate]({
        //     type: 'comm__namedPage',
        //     attributes: {
        //         name: 'driveConfig' // Experience Builder에서 설정한 페이지 이름
        //     },
        //     state: {
        //         car: carName // URL 파라미터로 전달
        //     }
        // });
    }
}