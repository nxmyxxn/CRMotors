import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

import rayevImg from '@salesforce/resourceUrl/car_rayev';
import niroevImg from '@salesforce/resourceUrl/car_niroev';
import ev3Img from '@salesforce/resourceUrl/car_ev3';
import ev4Img from '@salesforce/resourceUrl/car_ev4';

export default class CarSelector extends NavigationMixin(LightningElement) {
    cars = [
        {
            name: 'rayev',
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
            name: 'ev4',
            label: 'EV4',
            image: ev4Img
        },
    ];

    handleCarSelect(event) {
        const carName = event.currentTarget.dataset.car;
        const carLabel = event.currentTarget.dataset.label;
        alert(carName+carLabel);
        window.location.href = '/test/driveconfig?car=' + carName + '&label=' + carLabel;
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
