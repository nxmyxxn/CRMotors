public with sharing class DriveConfigController {
    
    @AuraEnabled
    public static Id saveVehicleConfig(String carName, String trimValue, String colorValue, List<String> optionValues) {
        // 1. 트림, 색상, 옵션 값으로 Product 레코드 가져오기 
        Id trimId = getProductByValue(trimValue, 'Trim');
        Id colorId = getProductByValue(colorValue, 'Color');
        List<Id> optionIds = getProductsByValues(optionValues, 'Option');

        // 2. 구성 저장 → 커스텀 Quote 객체에 저장
        CarConfig_Quote__c config = new CarConfig_Quote__c();
        config.Car_Name__c = carName;       // 차량 모델명 (예: rayev)
        config.Trim__c = trimId;            // 트림 Product Id
        config.Color__c = colorId;          // 색상 Product Id

        // 옵션은 다대다 객체 없으면 문자열로 임시 저장
        config.Option_Summary__c = String.join(optionValues, ','); 

        insert config;

        List<CarConfig_Quote_Option__c> optionLinks = new List<CarConfig_Quote_Option__c>();
        for (Id optId : optionIds) {
            optionLinks.add(new CarConfig_Quote_Option__c(
                CarConfig_Quote__c = config.Id,
                Option__c = optId
            ));
        }
        insert optionLinks;

        return config.Id;
    }

    private static Id getProductByValue(String value, String recordTypeName) {
        return [
            SELECT Id FROM Product2 
            WHERE Name = :value 
            AND RecordType.DeveloperName = :recordTypeName 
            LIMIT 1
        ].Id;
    }

    private static List<Id> getProductsByValues(List<String> values, String recordTypeName) {
        return new List<Id>(
    new Map<Id, Product2>(
        [SELECT Id FROM Product2 
         WHERE Name IN :values 
         AND RecordType.DeveloperName = :recordTypeName]
    ).keySet()
);
    }
}
