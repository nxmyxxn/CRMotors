public with sharing class PriceBookEntryController {

    public class CarProductInfo {
        @AuraEnabled public String name;
        @AuraEnabled public String productCode;
        @AuraEnabled public Decimal price;
    }
    
    @AuraEnabled(cacheable=true)
    public static CarProductInfo getCarProductInfo(String carName, String trimValue, String colorValue, String optionSummary) {
        CarProductInfo result = new CarProductInfo();
        try {
            List<Product2> products = [
                SELECT Id, Name, ProductCode
                FROM Product2
                WHERE Name = :carName
                AND Trim__c = :trimValue
                AND Color__c = :colorValue
                AND Option__c = :optionSummary
                LIMIT 1
            ];
            if (products.isEmpty()) return result;
    
            result.name = products[0].Name;
            result.productCode = products[0].ProductCode;
    
            List<PricebookEntry> entries = [
                SELECT UnitPrice
                FROM PricebookEntry
                WHERE Product2Id = :products[0].Id
                AND Pricebook2.IsStandard = true
                AND IsActive = true
                LIMIT 1
            ];
            if (!entries.isEmpty()) {
                result.price = entries[0].UnitPrice;
            }
            return result;
        } catch (Exception e) {
            System.debug('Error in getCarProductInfo: ' + e.getMessage());
            return result;
        }
    }
    
    // 옵션 래퍼 클래스
    public class OptionWrapper {
        @AuraEnabled public String id;
        @AuraEnabled public String name;
        @AuraEnabled public Decimal price;
        
        public OptionWrapper(String id, String name, Decimal price) {
            this.id = id;
            this.name = name;
            this.price = price;
        }
    }


    @AuraEnabled
    public static Boolean addProductToOpportunity(String opportunityId, String carName, String trimValue, String colorValue, String optionSummary) {
        try {

            System.debug('opportunityId: ' + opportunityId);
            System.debug('carName: ' + carName);
            System.debug('trimValue: ' + trimValue);
            System.debug('colorValue: ' + colorValue);
            System.debug('optionSummary: ' + optionSummary);

            // Product2 찾기
            List<Product2> products = [
                SELECT Id
                FROM Product2
                WHERE Name = :carName
                AND Trim__c = :trimValue
                AND Color__c = :colorValue
                AND Option__c = :optionSummary
                LIMIT 1
            ];
            if (products.isEmpty()) return false;
    
            // PricebookEntry 찾기
            List<PricebookEntry> entries = [
                SELECT Id, UnitPrice
                FROM PricebookEntry
                WHERE Product2Id = :products[0].Id
                AND Pricebook2.IsStandard = true
                AND IsActive = true
                LIMIT 1
            ];
            if (entries.isEmpty()) return false;
    
            // OpportunityLineItem 추가
            OpportunityLineItem oli = new OpportunityLineItem(
                OpportunityId = opportunityId,
                PricebookEntryId = entries[0].Id,
                Quantity = 1,
                UnitPrice = entries[0].UnitPrice
            );
            insert oli;
            return true;
        } catch (Exception e) {
            System.debug('Error in addProductToOpportunity: ' + e.getMessage());
            return false;
        }
    }


    // 리드견적을 Opportunity에 추가하는 메서드
    @AuraEnabled
    public static Boolean addProductToOpportunity(Id opportunityId, Id productId) {
        try {
            // PricebookEntry 찾기
            List<PricebookEntry> entries = [
                SELECT Id, UnitPrice
                FROM PricebookEntry
                WHERE Product2Id = :productId
                AND Pricebook2.IsStandard = true
                AND IsActive = true
                LIMIT 1
            ];
            
            if (entries.isEmpty()) {
                return false;
            }
            
            // OpportunityLineItem 추가
            OpportunityLineItem oli = new OpportunityLineItem(
                OpportunityId = opportunityId,
                PricebookEntryId = entries[0].Id,
                Quantity = 1,
                UnitPrice = entries[0].UnitPrice
            );
            insert oli;
            return true;
        } catch (Exception e) {
            System.debug('Error in addProductToOpportunity: ' + e.getMessage());
            return false;
        }
    }

    //제품 구조 쉽게 가기로 타협 후 추가로 가격 넣기 위한 메서드
    @AuraEnabled(cacheable=true)
    public static Decimal getCarPrice(String carName, String trimValue, String colorValue, String optionSummary) {
        try {
            Decimal totalPrice = 0;
            
            // 1. 트림 가격 조회 (기존 메서드 호출)
            totalPrice += getTrimPrice(carName, trimValue);
            
            // 2. 컬러 가격 조회 (기존 메서드 호출)
            totalPrice += getColorPrice(carName, colorValue);
            
            // 3. 옵션 가격 조회 (기존 메서드 호출)
            if (String.isNotBlank(optionSummary)) {
                List<String> optionNames = optionSummary.split('\\+');
                List<OptionWrapper> options = getOptionPrices(carName, optionNames);
                
                for (OptionWrapper option : options) {
                    totalPrice += option.price;
                }
            }
            
            return totalPrice;
        } catch (Exception e) {
            System.debug('Error calculating total car price: ' + e.getMessage());
            return 0;
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static Decimal getTrimPrice(String carName, String trimValue) {
        try {
            // Trim__c 오브젝트에서 가격 조회
            List<Trim__c> trims = [
                SELECT Id, Trim_price__c
                FROM Trim__c 
                WHERE Name = :carName + ' '+ trimValue 
                LIMIT 1
            ];
            
            if (!trims.isEmpty()) {
                return trims[0].Trim_price__c != null ? trims[0].Trim_price__c : 0;
            }
            return 0;
        } catch (Exception e) {
            System.debug('Error getting trim price: ' + e.getMessage());
            return 0;
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static Decimal getColorPrice(String carName, String colorValue) {
        try {
            // Color__c 오브젝트에서 가격 조회
            List<Color__c> colors = [
                SELECT Id, Color_Price__c 
                FROM Color__c 
                WHERE Name = :colorValue 
                LIMIT 1
            ];
            
            if (!colors.isEmpty()) {
                return colors[0].Color_Price__c != null ? colors[0].Color_Price__c : 0;
            }
            return 0;
        } catch (Exception e) {
            System.debug('Error getting color price: ' + e.getMessage());
            return 0;
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<OptionWrapper> getOptionPrices(String carName, List<String> optionNames) {
        try {
            List<OptionWrapper> result = new List<OptionWrapper>();
            
            // Option__c 오브젝트에서 가격 조회
            List<Option__c> options = [
                SELECT Id, Name, option_price__c
                FROM option__c 
                WHERE vehicle_name__c = :carName
                AND Name IN :optionNames
            ];
            
            for (option__c option : options) {
                result.add(new OptionWrapper(
                    option.Id,
                    option.Name,
                    option.option_price__c != null ? option.option_price__c : 0
                ));
            }
            
            return result;
        } catch (Exception e) {
            System.debug('Error getting option prices: ' + e.getMessage());
            return new List<OptionWrapper>();
        }
    }


// @AuraEnabled(cacheable=true)
    // public static Decimal getCarPrice(String carName, String trimValue, String colorValue, String optionSummary) {
    //     try {
    //         // null 체크
    //         if (String.isBlank(carName)) {
    //             return 0;
    //         }
    //         // 완성차 이름 + 트림 + 색상 + 옵션 요약으로 일치하는 Product2 조회
    //         List<Product2> products = [
    //             SELECT Id, Name, Trim__c, Color__c, Option__c
    //             FROM Product2
    //             WHERE Name = :carName
    //             AND Trim__c = :trimValue
    //             AND Color__c = :colorValue
    //             AND Option__c = :optionSummary
    //             LIMIT 1
    //         ];
 //         // 일치하는 Product2의 PricebookEntry에서 가격 조회
    //         List<PricebookEntry> entries = [
    //             SELECT UnitPrice
    //             FROM PricebookEntry
    //             WHERE Product2Id = :products[0].Id
    //             AND Pricebook2.IsStandard = true
    //             AND IsActive = true
    //             LIMIT 1
    //         ];
            
    //         if (!entries.isEmpty()) {
    //             return entries[0].UnitPrice != null ? entries[0].UnitPrice : 0;
    //         }
            
    //         return 0;
    //     } catch (Exception e) {
    //         System.debug('Error in getCarPrice: ' + e.getMessage());
    //         return 0;
    //     }
    // }

}