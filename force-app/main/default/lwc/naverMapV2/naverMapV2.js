import { api, wire, LightningElement } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { loadScript } from 'lightning/platformResourceLoader';
import NAVER_MAPS_JS from '@salesforce/resourceUrl/NaverMapsAPI';

const FIELDS = [
    'Order.OrderNumber',
    'Order.BillingCountry',
    'Order.BillingStreet',
    'Order.BillingState',
    'Order.BillingCity',
    'Order.BillingPostalCode',
    'Order.Naver_Latitude__c',
    'Order.Naver_Longitude__c'
];

export default class NaverMapV2 extends LightningElement {
    @api recordId;
    @api scaleLevel = 15;
    
    // 네이버 API 키 (ncpKeyId 사용)
    naverClientId = '1eiul254rh';
    
    map;
    marker;
    naverMapsLoaded = false;

    @wire(getRecord, {recordId: '$recordId', fields: FIELDS})
    order;

    // Getter 메서드들
    get orderNumber() {
        return this.order.data ? this.order.data.fields.OrderNumber.value : '';
    }

    get billingcountry() {
        return this.order.data ? this.order.data.fields.BillingCountry.value : '';
    }

    get billingstate() {
        return this.order.data ? this.order.data.fields.BillingState.value : '';
    }

    get billingstreet() {
        return this.order.data ? this.order.data.fields.BillingStreet.value : '';
    }

    get billingcity() {
        return this.order.data ? this.order.data.fields.BillingCity.value : '';
    }

    get billingpostalcode() {
        return this.order.data ? this.order.data.fields.BillingPostalCode.value : '';
    }

    get naver_latitude() {
        return this.order.data ? this.order.data.fields.Naver_Latitude__c.value : '';
    }

    get naver_longitude() {
        return this.order.data ? this.order.data.fields.Naver_Longitude__c.value : '';
    }

    get hasCoordinates() {
        return this.naver_latitude && this.naver_longitude;
    }

    // 컴포넌트가 렌더링된 후 실행
    renderedCallback() {
        console.log('=== renderedCallback 호출 ===');
        console.log('hasCoordinates:', this.hasCoordinates);
        console.log('naverMapsLoaded:', this.naverMapsLoaded);
        
        // 좌표가 있고 아직 로드되지 않았을 때만 실행
        if (this.hasCoordinates && !this.naverMapsLoaded) {
            this.naverMapsLoaded = true;
            console.log('정적 리소스로 지도 로딩 시작...');
            
            loadScript(this, NAVER_MAPS_JS)
                .then(() => {
                    console.log('✅ 정적 리소스 로딩 성공');
                    
                    // 약간의 지연 후 naver 객체 확인
                    setTimeout(() => {
                        console.log('window.naver:', window.naver);
                        if (window.naver && window.naver.maps) {
                            console.log('✅ 네이버 지도 API 로딩 완료');
                            this.initializeMap();
                        } else {
                            console.error('❌ 정적 리소스 로딩 후에도 네이버 객체 없음');
                        }
                    }, 1000);
                })
                .catch(error => {
                    console.error('❌ 정적 리소스 로딩 실패:', error);
                    this.naverMapsLoaded = false; // 재시도 가능하도록
                });
        }
    }

    // 네이버 지도 API 로드
    async loadNaverMaps() {
        try {
            console.log('네이버 지도 스크립트 로드 시작...');
            await this.loadNaverMapsScript();
            console.log('네이버 지도 스크립트 로드 완료');
            this.naverMapsLoaded = true;
            this.initializeMap();
        } catch (error) {
            console.error('네이버 지도 로드 실패:', error);
        }
    }

    // 네이버 지도 스크립트 로드
    loadNaverMapsScript() {
        return new Promise((resolve, reject) => {
            console.log('정적 리소스로 스크립트 로드 시작...');
            
            // 이미 로드된 경우
            if (window.naver && window.naver.maps) {
                console.log('네이버 지도 API 이미 로드됨');
                resolve();
                return;
            }

            // 정적 리소스에서 로드
            loadScript(this, NAVER_MAPS_JS)
                .then(() => {
                    console.log('정적 리소스 로드 성공');
                    console.log('window.naver:', window.naver);
                    
                    // 네이버 API가 로드될 때까지 약간 대기
                    setTimeout(() => {
                        if (window.naver && window.naver.maps) {
                            console.log('네이버 지도 API 정상 로드됨 (정적 리소스)');
                            resolve();
                        } else {
                            console.error('정적 리소스 로드 후에도 naver 객체 없음');
                            reject(new Error('네이버 지도 API 초기화 실패'));
                        }
                    }, 500);
                })
                .catch(error => {
                    console.error('정적 리소스 로드 실패:', error);
                    reject(error);
                });
        });
    }

    // 지도 초기화
    initializeMap() {
        console.log('=== initializeMap 호출됨 ===');
        const mapContainer = this.template.querySelector('.map-container');
        console.log('mapContainer:', mapContainer);
        console.log('hasCoordinates:', this.hasCoordinates);
        console.log('window.naver:', window.naver);
        console.log('window.naver.maps:', window.naver ? window.naver.maps : 'naver 객체 없음');
        
        if (!mapContainer || !this.hasCoordinates) {
            console.log('지도 초기화 실패 - 컨테이너 또는 좌표 없음');
            return;
        }

        if (!window.naver || !window.naver.maps) {
            console.error('네이버 지도 API가 로드되지 않음');
            return;
        }

        const latitude = parseFloat(this.naver_latitude);
        const longitude = parseFloat(this.naver_longitude);
        console.log('파싱된 좌표:', latitude, longitude);

        try {
            // 지도 생성
            console.log('지도 생성 시작...');
            this.map = new window.naver.maps.Map(mapContainer, {
                center: new window.naver.maps.LatLng(latitude, longitude),
                zoom: this.scaleLevel || 15,
                mapTypeControl: true
            });
            console.log('지도 생성 완료');

            // 마커 생성
            this.marker = new window.naver.maps.Marker({
                position: new window.naver.maps.LatLng(latitude, longitude),
                map: this.map,
                title: this.orderNumber,
                icon: {
                    content: '<div style="background: #ff6b6b; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>',
                    anchor: new window.naver.maps.Point(10, 10)
                }
            });

            // 정보창 생성
            const infoWindow = new window.naver.maps.InfoWindow({
                content: `
                    <div style="padding: 10px; min-width: 200px;">
                        <h4>주문번호: ${this.orderNumber}</h4>
                        <p><strong>주소:</strong> ${this.billingstreet || ''} ${this.billingcity || ''} ${this.billingstate || ''} ${this.billingcountry || ''}</p>
                        <p><strong>우편번호:</strong> ${this.billingpostalcode || 'N/A'}</p>
                    </div>
                `
            });

            // 마커 클릭 이벤트
            window.naver.maps.Event.addListener(this.marker, 'click', () => {
                if (infoWindow.getMap()) {
                    infoWindow.close();
                } else {
                    infoWindow.open(this.map, this.marker);
                }
            });
            
            console.log('지도 초기화 완료');
        } catch (error) {
            console.error('지도 생성 중 오류:', error);
        }
    }

    // 컴포넌트가 언마운트될 때 정리
    disconnectedCallback() {
        if (this.map) {
            this.map.destroy();
        }
    }
}