public with sharing class NaverGeocodingService {
        
    
    @AuraEnabled(cacheable=false)
    public static String searchAddress(String query) {
        try {
            if (String.isBlank(query)) {
                throw new AuraHandledException('검색어가 비어있습니다.');
            }
            
            // HTTP 요청 생성
            HttpRequest request = new HttpRequest();
            // request.setEndpoint(API_URL + '/geocode?query=' + EncodingUtil.urlEncode(query, 'UTF-8'));
            request.setEndpoint('callout:Naver_Geocoding_API/map-geocode/v2/geocode?query=' + EncodingUtil.urlEncode(query, 'UTF-8'));
            request.setMethod('GET');
            // request.setHeader('X-NCP-APIGW-API-KEY-ID', CLIENT_ID);
            // request.setHeader('X-NCP-APIGW-API-KEY', CLIENT_SECRET);
            // request.setHeader('Accept', 'application/json');
            // request.setTimeout(10000); // 10초 타임아웃
            
            // System.debug('API 요청 URL: ' + request.getEndpoint());
            // System.debug('Client ID: ' + CLIENT_ID);
            
            // HTTP 호출
            Http http = new Http();
            HttpResponse response = http.send(request);
            
            System.debug('응답 상태 코드: ' + response.getStatusCode());
            System.debug('응답 본문: ' + response.getBody());
            
            if (response.getStatusCode() == 200) {
                return response.getBody();
            } else {
                String errorMsg = 'API 호출 실패: ' + response.getStatusCode() + ' - ' + response.getBody();
                System.debug(errorMsg);
                throw new AuraHandledException(errorMsg);
            }
            
        } catch (Exception e) {
            System.debug('Geocoding API 오류: ' + e.getMessage());
            throw new AuraHandledException('주소 검색 중 오류가 발생했습니다: ' + e.getMessage());
        }
    }
    
    // 역방향 지오코딩 (좌표 -> 주소)
    @AuraEnabled(cacheable=false)
    public static String reverseGeocode(Decimal latitude, Decimal longitude) {
        try {
            if (latitude == null || longitude == null) {
                throw new AuraHandledException('좌표 정보가 비어있습니다.');
            }
            
            String coords = longitude + ',' + latitude;
            HttpRequest request = new HttpRequest();
            //request.setEndpoint(REVERSE_GEOCODE_API_URL + '/gc?coords=' + coords + '&output=json&orders=roadaddr');
            request.setEndpoint('callout:Naver_Geocoding_API/map-reversegeocode/v2/gc?coords=' + coords + '&output=json&orders=roadaddr');
            request.setMethod('GET');
            // request.setHeader('X-NCP-APIGW-API-KEY-ID', CLIENT_ID);
            // request.setHeader('X-NCP-APIGW-API-KEY', CLIENT_SECRET);
            // request.setHeader('Accept', 'application/json');
            // request.setTimeout(10000);
            
            Http http = new Http();
            HttpResponse response = http.send(request);
            
            System.debug('역방향 지오코딩 응답: ' + response.getStatusCode());
            System.debug('응답 본문: ' + response.getBody());
            
            if (response.getStatusCode() == 200) {
                return response.getBody();
            } else {
                String errorMsg = '역방향 지오코딩 실패: ' + response.getStatusCode() + ' - ' + response.getBody();
                System.debug(errorMsg);
                throw new AuraHandledException(errorMsg);
            }
            
        } catch (Exception e) {
            System.debug('역방향 지오코딩 오류: ' + e.getMessage());
            throw new AuraHandledException('역방향 지오코딩 중 오류가 발생했습니다: ' + e.getMessage());
        }
    }
    
    // API 연결 테스트
    @AuraEnabled(cacheable=false)
    public static String testApiConnection() {
        try {
            return searchAddress('서초대로');
        } catch (Exception e) {
            return 'API 테스트 실패: ' + e.getMessage();
        }
    }
}