public with sharing class WarrantyController {
    @AuraEnabled(cacheable=true)
    public static Warranty__c getWarrantyByAccountId(Id accountId) {
        return [
            SELECT Name, Registration_Date__c, Expiration_Date__c, Warranty_Period__c,
                   Warranty_Mileage__c,
                   Warranty_Related_Asset__r.Name,
                   Warranty_Related_Account__r.Name
            FROM Warranty__c
            WHERE Warranty_Related_Account__c = :accountId
            LIMIT 1
        ];
    }
}