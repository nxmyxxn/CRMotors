import { LightningElement, api, wire } from 'lwc';
// 1. EV4 이미지 정적 자원 가져오기 (기존 carImage)
import CAR_IMAGE_EV4 from '@salesforce/resourceUrl/carImage'; 

// 2. 레이 EV 이미지 정적 자원 가져오기 (새로운 carImageRay)
import CAR_IMAGE_RAY_EV from '@salesforce/resourceUrl/carImageRay'; // 💡 변경된 부분: carImageRay

// Asset의 Product2.Name 필드를 가져옵니다.
import { getRecord } from 'lightning/uiRecordApi';
import ASSET_PRODUCT_NAME_FIELD from '@salesforce/schema/Asset.Product2.Name'; 

export default class Ev4ImageDisplay extends LightningElement {
    @api recordId; 

    // 현재 표시될 이미지의 URL을 저장할 변수
    currentImageUrl; 
    // 이미지를 보여줄지 말지 결정하는 플래그 변수
    showImage = false; 

    @wire(getRecord, { recordId: '$recordId', fields: [ASSET_PRODUCT_NAME_FIELD] })
    wiredAsset({ error, data }) {
        if (data) {
            // Product 이름이 존재하는 경우에만 가져오고, 없으면 null로 설정
            const productName = data.fields.Product2.value ? data.fields.Product2.value.fields.Name.value : null;

            if (productName === 'EV4') {
                this.currentImageUrl = CAR_IMAGE_EV4; // Product가 'EV4'일 때 EV4 이미지 설정
                this.showImage = true;
            } else if (productName === '레이 EV') { // 💡 '레이 EV' 조건 추가
                this.currentImageUrl = CAR_IMAGE_RAY_EV; // Product가 '레이 EV'일 때 레이 EV 이미지 설정
                this.showImage = true;
            } else {
                this.showImage = false; // 다른 Product이거나 Product가 없을 때는 이미지 표시 안함
                this.currentImageUrl = null; // 이미지 URL 초기화
            }
        } else if (error) {
            console.error('Error retrieving asset record: ', error);
            this.showImage = false; 
            this.currentImageUrl = null;
        }
    }

    // HTML에서 img src={carImageUrl}로 참조할 수 있도록 getter 정의
    // 이 getter는 currentImageUrl의 값을 반환합니다.
    get carImageUrl() {
        return this.currentImageUrl;
    }

    // HTML에서 lightning-card title={cardTitle}로 참조할 수 있도록 getter 정의
    // Product에 따라 카드 제목을 다르게 표시합니다.
    get cardTitle() {
        if (this.currentImageUrl === CAR_IMAGE_EV4) {
            return "EV4";
        } else if (this.currentImageUrl === CAR_IMAGE_RAY_EV) {
            return "레이 EV";
        }
        return "차량 사진"; // 기본 타이틀 (만약 이미지가 표시되지 않는 경우)
    }
}