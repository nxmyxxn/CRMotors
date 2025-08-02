public with sharing class CustomerAssetController {
    @AuraEnabled(cacheable=true)
    public static List<Asset> getAssetsByAccount() {
        Id accountId = '001gL00000ECBUJQA5'; // 고정된 고객 계정 ID

        return [
            SELECT Id, Name, RangeKm__c, Asset_Related_VIN__c, Year__c
            FROM Asset
            WHERE AccountId = :accountId
        ];
    }
}