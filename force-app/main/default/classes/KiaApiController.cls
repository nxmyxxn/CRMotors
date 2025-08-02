public with sharing class KiaApiController {
    // 1. 토큰 요청 (Authorization Code → Access Token)
    @AuraEnabled
    public static String getAccessToken(String code) {
        try {
            String clientId = '2c3a2d96-67bd-4f6f-9505-5dc19c36abc6';
            String clientSecret = 'eihPjCBo9aGMCk7MyRyoiSOL2mxh0jsnFUfmGNor75Sxrpt6';
            String redirectUri = 'https://oauth.pstmn.io/v1/callback';
            String tokenUrl = 'https://prd.kr-ccapi.kia.com/api/v1/user/oauth2/token';

            HttpRequest req = new HttpRequest();
            req.setEndpoint(tokenUrl);
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
            req.setBody(
                'grant_type=authorization_code' +
                '&code=' + EncodingUtil.urlEncode(code, 'UTF-8') +
                '&client_id=' + clientId +
                '&client_secret=' + clientSecret +
                '&redirect_uri=' + EncodingUtil.urlEncode(redirectUri, 'UTF-8')
            );
            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {
                Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                return (String)result.get('access_token');
            } else {
                throw new AuraHandledException('Failed to get access token: ' + res.getBody());
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    // 2. 개인정보 제공 동의 요청
    @AuraEnabled
    public static void requestPersonalInfoAgreement(String accessToken, String state) {
        String apiUrl = 'callout:KiaAPI/api/v1/car-service/terms/agreement';
        HttpRequest req = new HttpRequest();
        req.setEndpoint(apiUrl);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        req.setBody('token=' + EncodingUtil.urlEncode(accessToken, 'UTF-8') +
                    '&state=' + EncodingUtil.urlEncode(state, 'UTF-8'));
        Http http = new Http();
        HttpResponse res = http.send(req);
        if (res.getStatusCode() != 200 && res.getStatusCode() != 302) {
            throw new AuraHandledException('Failed to request agreement: ' + res.getBody());
        }
    }

    // 3. 차량 리스트 조회 및 Asset upsert
    @AuraEnabled
    public static void fetchAndSaveCarList(String accessToken) {
        String apiUrl = 'callout:KiaAPI/api/v1/car/profile/carlist';
        HttpRequest req = new HttpRequest();
        req.setEndpoint(apiUrl);
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + accessToken);
        Http http = new Http();
        HttpResponse res = http.send(req);
        if (res.getStatusCode() == 200) {
            Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            List<Object> cars = (List<Object>) result.get('cars');
            for (Object carObj : cars) {
                Map<String, Object> car = (Map<String, Object>) carObj;
                String carId = (String)car.get('carId');
                String carNickname = (String)car.get('carNickname');
                String carType = (String)car.get('carType');
                String carName = (String)car.get('carName');
                String carSellname = (String)car.get('carSellname');
                // Asset upsert (KiaCarId__c 기준)
                List<Asset> assets = [SELECT Id, KiaCarId__c, Name FROM Asset WHERE KiaCarId__c = :carId LIMIT 1];
                Asset asset;
                if (!assets.isEmpty()) {
                    asset = assets[0];
                } else {
                    asset = new Asset();
                    asset.KiaCarId__c = carId;
                }
                asset.Name = carNickname != null ? carNickname : (carSellname != null ? carSellname : 'Kia 차량 ' + carId);
                // 필요시 carType, carName 등 추가 필드 매핑
                upsert asset;
            }
        } else {
            throw new AuraHandledException('Failed to fetch car list: ' + res.getBody());
        }
    }
    @AuraEnabled
public static void updateAssetOdometer(String accessToken, String carId) {
    String apiUrl = 'callout:KiaAPI/api/v1/car/status/' + carId + '/odometer';
    HttpRequest req = new HttpRequest();
    req.setEndpoint(apiUrl);
    req.setMethod('GET');
    req.setHeader('Authorization', 'Bearer ' + accessToken);
    req.setHeader('Content-Type', 'application/json');
    Http http = new Http();
    HttpResponse res = http.send(req);
    if (res.getStatusCode() == 200) {
        Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        Map<String, Object> odometers = (Map<String, Object>) result.get('odometers');
        Decimal odometerValue = (Decimal) odometers.get('value');
        // 해당 carId의 Asset만 업데이트
        List<Asset> assets = [SELECT Id, Odometer__c FROM Asset WHERE KiaCarId__c = :carId LIMIT 1];
        if (!assets.isEmpty()) {
            Asset asset = assets[0];
            asset.Odometer__c = odometerValue;
            update asset;
        }
    } else {
        throw new AuraHandledException('Failed to fetch odometer: ' + res.getBody());
    }
}
}