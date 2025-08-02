public with sharing class WeatherDetailsClass {
    @AuraEnabled
    public static WeatherDetailsWrapper getWeatherDetails(String cityName) {
        try {
            // Input validation
            if (String.isBlank(cityName)) {
                throw new AuraHandledException('City name cannot be empty');
            }
            
            String apiKey = '972bb085489fc9caa5843ba49d51d994';
            String endpoint = 'https://api.openweathermap.org/data/2.5/weather';
            endpoint += '?q=' + EncodingUtil.urlEncode(cityName, 'UTF-8');
            endpoint += '&units=metric';
            endpoint += '&appid=' + apiKey;
            
            System.debug('Endpoint URL: ' + endpoint);

            Http http = new Http();
            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('GET');
            req.setTimeout(10000); // 10초 타임아웃
            
            HttpResponse res = http.send(req);
            System.debug('Response Status Code: ' + res.getStatusCode());
            System.debug('Response Body: ' + res.getBody());

            if (res.getStatusCode() != 200) {
                throw new AuraHandledException('Weather API Error: ' + res.getStatusCode() + ' - ' + res.getBody());
            }

            Map<String, Object> result = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
            Map<String, Object> main = (Map<String, Object>)result.get('main');

            WeatherDetailsWrapper det = new WeatherDetailsWrapper();
            det.city = String.valueOf(result.get('name'));
            det.temperature = String.valueOf(main.get('temp'));
            det.pressure = String.valueOf(main.get('pressure'));
            det.humidity = String.valueOf(main.get('humidity'));
            det.feelsLike = String.valueOf(main.get('feels_like'));
            det.tempMin = String.valueOf(main.get('temp_min'));
            det.tempMax = String.valueOf(main.get('temp_max'));
            
            return det;

        } catch (Exception e) {
            System.debug('Exception: ' + e.getMessage());
            throw new AuraHandledException('Error: ' + e.getMessage());
        }
    }

    public class WeatherDetailsWrapper {
        @AuraEnabled public String city {get;set;}
        @AuraEnabled public String temperature {get;set;}
        @AuraEnabled public String pressure {get;set;}
        @AuraEnabled public String humidity {get;set;}
        @AuraEnabled public String feelsLike {get;set;}
        @AuraEnabled public String tempMin {get;set;}
        @AuraEnabled public String tempMax {get;set;}
    }
}