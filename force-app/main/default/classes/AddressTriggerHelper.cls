public class AddressTriggerHelper {
    
    // 재귀 호출 방지를 위한 플래그
    private static Boolean isProcessing = false;
    
    public static void processAddressChange(List<Order> newOrders, Map<Id, Order> oldOrderMap, Boolean isUpdate) {
        
        // 재귀 호출 방지
        if (isProcessing) {
            return;
        }
        
        List<Id> orderIdsToUpdate = new List<Id>();
        
        for (Order ord : newOrders) {
            // 주소 정보가 변경된 경우에만 좌표 업데이트
            Order oldOrder = isUpdate ? oldOrderMap.get(ord.Id) : null;
            
            if (shouldUpdateCoordinates(ord, oldOrder)) {
                System.debug('주소 변경 감지 - Order ID: ' + ord.Id);
                
                // 주소 정보가 있는 경우에만 처리
                if (ord.BillingStreet != null || ord.BillingCity != null || 
                    ord.BillingState != null || ord.BillingCountry != null) {
                    
                    orderIdsToUpdate.add(ord.Id);
                }
            }
        }
        
        // Future 메서드로 비동기 처리
        if (!orderIdsToUpdate.isEmpty()) {
            updateCoordinatesAsync(orderIdsToUpdate);
        }
    }
    
    @future(callout=true)
    public static void updateCoordinatesAsync(List<Id> orderIds) {
        try {
            // 재귀 호출 방지 플래그 설정
            isProcessing = true;
            
            List<Order> ordersToQuery = [SELECT Id, BillingStreet, BillingCity, BillingState, BillingCountry 
                                        FROM Order WHERE Id IN :orderIds];
            
            List<Order> ordersToUpdate = new List<Order>();
            
            for (Order ord : ordersToQuery) {
                Map<String, Object> coordinates = getCoordinatesFromAddress(ord);
                
                Order updateOrder = new Order();
                updateOrder.Id = ord.Id;
                updateOrder.Naver_Latitude__c = getLatitudeFromCoordinates(coordinates);
                updateOrder.Naver_Longitude__c = getLongitudeFromCoordinates(coordinates);
                
                ordersToUpdate.add(updateOrder);
            }
            
            if (!ordersToUpdate.isEmpty()) {
                update ordersToUpdate;
                System.debug('좌표 업데이트 완료: ' + ordersToUpdate.size() + '개 주문');
            }
            
        } catch (Exception e) {
            System.debug('좌표 업데이트 실패: ' + e.getMessage());
        } finally {
            // 플래그 해제
            isProcessing = false;
        }
    }
    
    // 좌표 업데이트가 필요한지 확인하는 메서드
    private static Boolean shouldUpdateCoordinates(Order newOrder, Order oldOrder) {
        if (oldOrder == null) return true; // 새로 생성된 경우
        
        // 주소 관련 필드가 변경된 경우
        return (newOrder.BillingStreet != oldOrder.BillingStreet ||
                newOrder.BillingCity != oldOrder.BillingCity ||
                newOrder.BillingState != oldOrder.BillingState ||
                newOrder.BillingCountry != oldOrder.BillingCountry ||
                newOrder.BillingPostalCode != oldOrder.BillingPostalCode);
    }
    
    // 주소로부터 위도를 가져오는 메서드 (실제 네이버 API 호출)
    private static Decimal getLatitudeFromAddress(Order ord) {
        Map<String, Object> coordinates = getCoordinatesFromAddress(ord);
        Object latitude = coordinates.get('latitude');
        return latitude != null ? Decimal.valueOf(String.valueOf(latitude)) : 37.5665;
    }
    
    // 주소로부터 경도를 가져오는 메서드 (실제 네이버 API 호출)
    private static Decimal getLongitudeFromAddress(Order ord) {
        Map<String, Object> coordinates = getCoordinatesFromAddress(ord);
        Object longitude = coordinates.get('longitude');
        return longitude != null ? Decimal.valueOf(String.valueOf(longitude)) : 126.9780;
    }
    
    // 좌표 맵에서 위도 추출
    private static Decimal getLatitudeFromCoordinates(Map<String, Object> coordinates) {
        Object latitude = coordinates.get('latitude');
        return latitude != null ? Decimal.valueOf(String.valueOf(latitude)) : 37.5665;
    }
    
    // 좌표 맵에서 경도 추출
    private static Decimal getLongitudeFromCoordinates(Map<String, Object> coordinates) {
        Object longitude = coordinates.get('longitude');
        return longitude != null ? Decimal.valueOf(String.valueOf(longitude)) : 126.9780;
    }
    
    // 네이버 Geocoding API를 통해 좌표 정보 가져오기
    private static Map<String, Object> getCoordinatesFromAddress(Order ord) {
        try {
            // 주소 문자열 구성
            String addressQuery = '';
            if (String.isNotBlank(ord.BillingStreet)) {
                addressQuery += ord.BillingStreet + ' ';
            }
            if (String.isNotBlank(ord.BillingCity)) {
                addressQuery += ord.BillingCity + ' ';
            }
            if (String.isNotBlank(ord.BillingState)) {
                addressQuery += ord.BillingState + ' ';
            }
            
            addressQuery = addressQuery.trim();
            
            if (String.isNotBlank(addressQuery)) {
                // 네이버 Geocoding API 호출
                String responseBody = NaverGeocodingService.searchAddress(addressQuery);
                if (String.isNotBlank(responseBody)) {
                    return NaverGeocodingService.parseAddressResponse(responseBody);
                }
            }
        } catch (Exception e) {
            System.debug('좌표 조회 중 오류: ' + e.getMessage());
        }
        
        // 기본값 반환 (서울)
        return new Map<String, Object>{
            'latitude' => '37.5665',
            'longitude' => '126.9780'
        };
    }
}