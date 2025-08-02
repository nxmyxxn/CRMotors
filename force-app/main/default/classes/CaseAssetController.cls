public with sharing class CaseAssetController {
    @AuraEnabled(cacheable=true)
    public static CaseWrapper getCaseAssetInfo(String subjectKeyword) {
        Case selectedCase = [
            SELECT Id, Subject, AssetId
            FROM Case
            WHERE Subject LIKE :('%' + subjectKeyword + '%')
            LIMIT 1
        ];

        Asset asset = selectedCase.AssetId != null
            ? [
                SELECT Id, Name, Product2Id, Asset_Related_VIN__c, PurchaseDate
                FROM Asset
                WHERE Id = :selectedCase.AssetId
              ]
            : null;

        Product2 product = (asset != null && asset.Product2Id != null)
            ? [
                SELECT Id, Name
                FROM Product2
                WHERE Id = :asset.Product2Id
              ]
            : null;

        return new CaseWrapper(selectedCase, asset, product);
    }

    public class CaseWrapper {
        @AuraEnabled public String caseSubject;
        @AuraEnabled public String assetName;
        @AuraEnabled public String vin;
        @AuraEnabled public Date purchaseDate;
        @AuraEnabled public String productName;

        public CaseWrapper(Case c, Asset a, Product2 p) {
            this.caseSubject = c.Subject;
            this.assetName = a != null ? a.Name : null;
            this.vin = a != null ? a.Asset_Related_VIN__c : null;
            this.purchaseDate = a != null ? a.PurchaseDate : null;
            this.productName = p != null ? p.Name : null;
        }
    }
}