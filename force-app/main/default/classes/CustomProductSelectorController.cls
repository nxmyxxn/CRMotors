public without sharing class CustomProductSelectorController {
    
    @AuraEnabled(cacheable=true)
    public static List<Pricebook2> getActivePricebooks() {
        return [SELECT Id, Name FROM Pricebook2 WHERE IsActive = true];
    }
    
    // 기존 메서드 완전 삭제하고 새로 만들기
    @AuraEnabled(cacheable=true)
    public static List<PicklistWrapper> getTrimValues() {
        List<PicklistWrapper> result = new List<PicklistWrapper>();
        Schema.DescribeFieldResult fieldResult = Product2.Trim__c.getDescribe();
        
        for (Schema.PicklistEntry entry : fieldResult.getPicklistValues()) {
            if (entry.isActive()) {
                result.add(new PicklistWrapper(entry.getLabel(), entry.getValue()));
            }
        }
        return result;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<PicklistWrapper> getColorValues() {
        List<PicklistWrapper> result = new List<PicklistWrapper>();
        Schema.DescribeFieldResult fieldResult = Product2.Color__c.getDescribe();
        
        for (Schema.PicklistEntry entry : fieldResult.getPicklistValues()) {
            if (entry.isActive()) {
                result.add(new PicklistWrapper(entry.getLabel(), entry.getValue()));
            }
        }
        return result;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<PicklistWrapper> getOptionValues() {
        List<PicklistWrapper> result = new List<PicklistWrapper>();
        Schema.DescribeFieldResult fieldResult = Product2.Option__c.getDescribe();
        
        for (Schema.PicklistEntry entry : fieldResult.getPicklistValues()) {
            if (entry.isActive()) {
                result.add(new PicklistWrapper(entry.getLabel(), entry.getValue()));
            }
        }
        return result;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Product2> getFilteredProducts(String name, String trim, String color, String option, Id pricebookId) {
        return [
            SELECT Id, Name, ProductCode, Trim__c, Color__c, Option__c, IsActive 
            FROM Product2 
            WHERE IsActive = true
              AND Name = :name
              AND Trim__c = :trim
              AND Color__c = :color
              AND Option__c = :option
        ];
    }
    
    @AuraEnabled
    public static String addOpportunityLineItem(Id opportunityId, Id productId, Id pricebookId) {
        List<PricebookEntry> entries = [
            SELECT Id, UnitPrice 
            FROM PricebookEntry 
            WHERE Product2Id = :productId
              AND Pricebook2Id = :pricebookId
              AND IsActive = true 
            LIMIT 1
        ];
        
        if (entries.isEmpty()) {
            throw new AuraHandledException('선택한 제품이 해당 가격 책정표에 없습니다.');
        }
        
        OpportunityLineItem oli = new OpportunityLineItem(
            OpportunityId = opportunityId,
            PricebookEntryId = entries[0].Id,
            Quantity = 1,
            TotalPrice = entries[0].UnitPrice
        );
        insert oli;
        return 'SUCCESS';
    }
    
    // 래퍼 클래스
    public class PicklistWrapper {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
        
        public PicklistWrapper(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }
}