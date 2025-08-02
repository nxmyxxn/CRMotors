import { LightningElement, api, track } from 'lwc';
import getActivePricebooks from '@salesforce/apex/CustomProductSelectorController.getActivePricebooks';
import getTrimValues from '@salesforce/apex/CustomProductSelectorController.getTrimValues';
import getColorValues from '@salesforce/apex/CustomProductSelectorController.getColorValues';
import getOptionValues from '@salesforce/apex/CustomProductSelectorController.getOptionValues';
import getFilteredProducts from '@salesforce/apex/CustomProductSelectorController.getFilteredProducts';
import addOpportunityLineItem from '@salesforce/apex/CustomProductSelectorController.addOpportunityLineItem';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class CustomVehicleConfigurator extends LightningElement {
    @api recordId; // Opportunity ID
    @track pricebooks = [];
    @track productNames = ['EV4', '레이 EV'];
    @track trims = [];
    @track colors = [];
    @track options = [];

    @track selectedPricebook;
    @track selectedProductName;
    @track selectedTrim;
    @track selectedColor;
    @track selectedOption;
    @track matchingProduct;

    // Lightning combobox용 옵션 포맷
    get pricebookOptions() {
        return Array.isArray(this.pricebooks) ? this.pricebooks.map(pb => ({
            label: pb.Name,
            value: pb.Id
        })) : [];
    }

    get productNameOptions() {
        return Array.isArray(this.productNames) ? this.productNames.map(name => ({
            label: name,
            value: name
        })) : [];
    }

    get trimOptions() {
        return Array.isArray(this.trims) ? this.trims : [];
    }

    get colorOptions() {
        return Array.isArray(this.colors) ? this.colors : [];
    }

    get optionOptions() {
        return Array.isArray(this.options) ? this.options : [];
    }

    connectedCallback() {
        console.log('connectedCallback 시작');
        
        // Pricebooks 로드
        getActivePricebooks()
            .then(result => {
                console.log('Pricebooks 결과:', result);
                this.pricebooks = result;
            })
            .catch(error => {
                console.error('Pricebooks 오류:', error);
                this.showToast('Pricebook 로드 실패', 'error');
            });

        // Trims 로드 - 새로운 메서드 사용
        getTrimValues()
            .then(result => {
                console.log('Trims 결과:', result);
                this.trims = result;
            })
            .catch(error => {
                console.error('Trims 오류:', error);
                this.showToast('트림 로드 실패', 'error');
            });

        // Colors 로드 - 새로운 메서드 사용
        getColorValues()
            .then(result => {
                console.log('Colors 결과:', result);
                this.colors = result;
            })
            .catch(error => {
                console.error('Colors 오류:', error);
                this.showToast('컬러 로드 실패', 'error');
            });

        // Options 로드 - 새로운 메서드 사용
        getOptionValues()
            .then(result => {
                console.log('Options 결과:', result);
                this.options = result;
            })
            .catch(error => {
                console.error('Options 오류:', error);
                this.showToast('옵션 로드 실패', 'error');
            });
    }

    handleChange(event) {
        const field = event.target.name;
        this[`selected${field}`] = event.target.value;
        console.log(`${field} 선택됨:`, event.target.value);
    }

    handleSearch() {
        console.log('검색 시작:', {
            name: this.selectedProductName,
            trim: this.selectedTrim,
            color: this.selectedColor,
            option: this.selectedOption,
            pricebookId: this.selectedPricebook
        });

        getFilteredProducts({
            name: this.selectedProductName,
            trim: this.selectedTrim,
            color: this.selectedColor,
            option: this.selectedOption,
            pricebookId: this.selectedPricebook
        }).then(result => {
            console.log('검색 결과:', result);
            this.matchingProduct = result.length > 0 ? result[0] : null;
            if (!this.matchingProduct) {
                this.showToast('해당 조건의 제품이 없습니다.', 'error');
            }
        }).catch(error => {
            console.error('검색 오류:', error);
            this.showToast('검색 중 오류 발생', 'error');
        });
    }

    handleAdd() {
        if (!this.matchingProduct) {
            this.showToast('먼저 제품을 검색해 주세요.', 'error');
            return;
        }
        
        addOpportunityLineItem({
            opportunityId: this.recordId,
            productId: this.matchingProduct.Id,
            pricebookId: this.selectedPricebook
        }).then(() => {
            this.showToast('제품이 추가되었습니다!', 'success');
        }).catch(err => {
            console.error('추가 오류:', err);
            this.showToast(err.body?.message || '추가 중 오류 발생', 'error');
        });
    }

    showToast(msg, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: variant === 'success' ? '성공' : '오류',
            message: msg,
            variant: variant
        }));
    }
}