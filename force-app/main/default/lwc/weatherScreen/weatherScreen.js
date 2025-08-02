import { LightningElement } from 'lwc';
import getWeatherDetails from '@salesforce/apex/WeatherDetailsClass.getWeatherDetails';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class WeatherScreen extends LightningElement {
    inputCityName = '';
    weatherDetails = {}; // 빈 객체로 초기화
    showWeatherDetails = false;

    handleInputChange(event) {
        this.inputCityName = event.detail.value;
    }

    handleWeatherDetails() {
        if (!this.inputCityName) {
            this.showToast('Error', 'Please enter a city name', 'error');
            return;
        }

        // 이전 데이터 초기화
        this.showWeatherDetails = false;
        this.weatherDetails = {};
        
        getWeatherDetails({cityName: this.inputCityName})
            .then(result => {
                console.log('API Response:', JSON.stringify(result));
                
                // 결과 검증 후 설정
                if (result && result.city) {
                    this.weatherDetails = {
                        city: result.city || '',
                        temperature: result.temperature || '',
                        feelsLike: result.feelsLike || '',
                        pressure: result.pressure || '',
                        humidity: result.humidity || '',
                        tempMin: result.tempMin || '',
                        tempMax: result.tempMax || ''
                    };
                    this.showWeatherDetails = true;
                } else {
                    this.showToast('Error', 'No weather data received', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                this.showWeatherDetails = false;
                this.weatherDetails = {};
                this.showToast('Error', error.body?.message || 'Failed to fetch weather data', 'error');
            });
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }
}