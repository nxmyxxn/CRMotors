public with sharing class CaseAssetWarrantyController {
    @AuraEnabled(cacheable=true)
    public static List<CaseAssetWarrantyWrapper> getInfoByAccount(Id accountId) {
        List<Case> cases = [
            SELECT Id, Subject, Service_Type__c, Preferred_Date__c, Status,
                   AssetId, Asset.Name, Asset.Product2.Name, Asset.Asset_Related_VIN__c, Asset.PurchaseDate,
                   Warranty__r.Id, Warranty__r.Name, Warranty__r.Registration_Date__c, Warranty__r.Expiration_Date__c
            FROM Case
            WHERE AccountId = :accountId
        ];

        List<CaseAssetWarrantyWrapper> result = new List<CaseAssetWarrantyWrapper>();
        for (Case c : cases) {
            CaseAssetWarrantyWrapper wrapper = new CaseAssetWarrantyWrapper();
            wrapper.caseId = c.Id;
            wrapper.caseSubject = c.Subject;
            wrapper.serviceType = c.Service_Type__c;
            wrapper.preferredDate = c.Preferred_Date__c != null ? c.Preferred_Date__c.date() : null;
            wrapper.caseStatus = c.Status;

            wrapper.assetId = c.AssetId;
            wrapper.assetName = c.Asset != null ? c.Asset.Name : null;
            wrapper.productName = c.Asset != null && c.Asset.Product2 != null ? c.Asset.Product2.Name : null;
            wrapper.vin = c.Asset != null ? c.Asset.Asset_Related_VIN__c : null;
            wrapper.purchaseDate = c.Asset != null ? c.Asset.PurchaseDate : null;

            wrapper.warrantyId = c.Warranty__r != null ? c.Warranty__r.Id : null;
            wrapper.warrantyName = c.Warranty__r != null ? c.Warranty__r.Name : null;
            wrapper.registrationDate = c.Warranty__r != null ? c.Warranty__r.Registration_Date__c : null;
            wrapper.expirationDate = c.Warranty__r != null ? c.Warranty__r.Expiration_Date__c : null;

            result.add(wrapper);
        }
        return result;
    }

    @AuraEnabled(cacheable=true)
    public static List<Account> searchAccounts(String name) {
        return [
            SELECT Id, Name
            FROM Account
            WHERE Name LIKE :('%' + name + '%')
            LIMIT 10
        ];
    }

    public class CaseAssetWarrantyWrapper {
        @AuraEnabled public String caseId;
        @AuraEnabled public String caseSubject;
        @AuraEnabled public String serviceType;
        @AuraEnabled public Date preferredDate;
        @AuraEnabled public String caseStatus;

        @AuraEnabled public String assetId;
        @AuraEnabled public String assetName;
        @AuraEnabled public String productName;
        @AuraEnabled public String vin;
        @AuraEnabled public Date purchaseDate;

        @AuraEnabled public String warrantyId;
        @AuraEnabled public String warrantyName;
        @AuraEnabled public Date registrationDate;
        @AuraEnabled public Date expirationDate;
    }
}