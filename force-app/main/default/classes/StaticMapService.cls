public with sharing class StaticMapService {
    
    private static final String CLIENT_ID = '1eiul254rh'; // 실제 클라이언트 ID
    private static final String CLIENT_SECRET = 'YOUR_CLIENT_SECRET'; // 실제 클라이언트 시크릿 필요
    
    @AuraEnabled(cacheable=false)
    public static String getStaticMapBase64(Decimal latitude, Decimal longitude, Integer zoom) {
        try {
            String apiUrl = 'https://naveropenapi.apigw.ntruss.com/map-static/v2/raster-cors';
            
            HttpRequest request = new HttpRequest();
            request.setEndpoint(apiUrl + '?w=450&h=400&center=' + longitude + ',' + latitude + '&level=' + zoom);
            request.setMethod('GET');
            request.setHeader('X-NCP-APIGW-API-KEY-ID', CLIENT_ID);
            request.setHeader('X-NCP-APIGW-API-KEY', CLIENT_SECRET);
            request.setTimeout(10000);
            
            Http http = new Http();
            HttpResponse response = http.send(request);
            
            if (response.getStatusCode() == 200) {
                // 이미지 데이터를 Base64로 인코딩
                Blob imageBlob = response.getBodyAsBlob();
                String base64Image = EncodingUtil.base64Encode(imageBlob);
                return 'data:image/png;base64,' + base64Image;
            } else {
                System.debug('Static Map API 오류: ' + response.getStatusCode() + ' - ' + response.getBody());
                return null;
            }
            
        } catch (Exception e) {
            System.debug('Static Map 호출 오류: ' + e.getMessage());
            return null;
        }
    }
}