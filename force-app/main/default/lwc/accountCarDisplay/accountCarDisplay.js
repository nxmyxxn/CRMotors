import { LightningElement, api, wire } from 'lwc';
// 정적 자원 가져오기
import CAR_IMAGE_EV4 from '@salesforce/resourceUrl/carImage'; // EV4 차량 이미지
import CAR_IMAGE_RAY_EV from '@salesforce/resourceUrl/carImageRay'; // 레이 EV 차량 이미지

// Account에 연결된 Asset 관련 목록 데이터를 가져오기 위한 모듈
import { getRelatedListRecords } from 'lightning/uiRelatedListApi';

export default class AccountCarDisplay extends LightningElement {
    @api recordId; // 현재 Account 레코드의 ID를 받아옵니다.

    currentImageUrl; // 표시될 이미지의 URL을 저장합니다.
    showImage = false; // 이미지를 보여줄지 말지 결정하는 플래그 변수입니다.
    currentProductType = null; // 현재 어떤 Product의 이미지를 표시하는지 저장합니다 (예: 'EV4', '레이 EV').

    // @wire 데코레이터를 사용하여 Account에 연결된 Assets 관련 목록을 가져옵니다.
    // 'Assets'는 Account 객체에서 Asset 관련 목록의 표준 API 이름입니다.
    // fields에 Asset의 Product2Id와 Product2.Name을 포함하여 가져옵니다.
    @wire(getRelatedListRecords, {
        parentRecordId: '$recordId', // 현재 Account 레코드의 ID
        relatedListId: 'Assets',     // Account에 연결된 Assets 관련 목록
        fields: ['Asset.Product2Id', 'Asset.Product2.Name'] // 가져올 필드 (Asset의 Product 이름)
    })
    wiredAssets({ error, data }) {
        if (data) {
            let foundEv4 = false;     // 'EV4' Product를 가진 자산이 있는지 여부
            let foundRayEv = false;   // '레이 EV' Product를 가진 자산이 있는지 여부

            // 가져온 자산 목록을 순회합니다.
            for (const asset of data.records) {
                // 자산의 Product 이름을 가져옵니다. Product가 없으면 null로 처리합니다.
                const productName = asset.fields.Product2.value ? asset.fields.Product2.value.fields.Name.value : null;
                
                if (productName === 'EV4') {
                    foundEv4 = true;
                    // EV4 자산을 찾았다면 더 이상 다른 자산을 검색할 필요 없이 반복문을 종료합니다.
                    // (여기서는 EV4가 레이 EV보다 우선 순위가 높다고 가정합니다.)
                    break; 
                } else if (productName === '레이 EV') {
                    foundRayEv = true;
                    // 레이 EV를 찾았지만, EV4가 있을 수도 있으므로 계속 검색합니다.
                }
            }

            // 찾은 Product 유형에 따라 이미지 URL과 표시 여부를 설정합니다.
            if (foundEv4) {
                this.currentImageUrl = CAR_IMAGE_EV4; // EV4 이미지를 설정
                this.currentProductType = 'EV4';      // Product 유형을 'EV4'로 설정
                this.showImage = true;                // 이미지를 표시하도록 설정
            } else if (foundRayEv) {
                this.currentImageUrl = CAR_IMAGE_RAY_EV; // 레이 EV 이미지를 설정
                this.currentProductType = '레이 EV';     // Product 유형을 '레이 EV'로 설정
                this.showImage = true;                   // 이미지를 표시하도록 설정
            } else {
                // 어떤 조건도 만족하지 않는 경우, 이미지 표시를 비활성화하고 URL을 초기화합니다.
                this.showImage = false;
                this.currentImageUrl = null;
                this.currentProductType = null;
            }

        } else if (error) {
            // 데이터 로드 중 오류가 발생한 경우 콘솔에 오류 메시지를 출력하고 이미지 표시를 비활성화합니다.
            console.error('Error retrieving related assets: ', error);
            this.showImage = false;
            this.currentImageUrl = null;
            this.currentProductType = null;
        }
    }

    // HTML에서 `src={carImageUrl}`로 참조할 수 있도록 getter를 정의합니다.
    get carImageUrl() {
        return this.currentImageUrl;
    }

    // HTML에서 `title={cardTitle}`로 참조할 수 있도록 getter를 정의합니다.
    // 현재 표시되는 Product 유형에 따라 카드 제목을 동적으로 변경합니다.
    get cardTitle() {
        if (this.currentProductType === 'EV4') {
            return "EV4 구매 차량";
        } else if (this.currentProductType === '레이 EV') {
            return "레이 EV 구매 차량";
        }
        return "구매 차량 정보"; // 기본 제목 (어떤 차량도 구매하지 않았을 경우)
    }
}