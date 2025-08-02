public with sharing class OpptyQuoteController {
    
    @AuraEnabled(cacheable=true)
    public static List<CarConfigueQuote__c> getLeadQuotes(Id opportunityId) {
        try {
            // Opportunity에서 Account ID 가져오기
            Opportunity opp = [
                SELECT AccountId, Account.PersonEmail 
                FROM Opportunity 
                WHERE Id = :opportunityId 
                LIMIT 1
            ];
            
            if (opp.AccountId == null) {
                return new List<CarConfigueQuote__c>();
            }
            
            // Account의 이메일로 리드견적 조회
            List<CarConfigueQuote__c> quotes = [
                SELECT Id, Name, Car_Name__c, Trim__c, Color__c, Option__c, 
                       Email__c, product__c, CreatedDate
                FROM CarConfigueQuote__c
                WHERE Email__c = :opp.Account.PersonEmail
                ORDER BY CreatedDate DESC
            ];
            
            return quotes;
        } catch (Exception e) {
            System.debug('Error in getLeadQuotes: ' + e.getMessage());
            throw new AuraHandledException('리드견적을 조회하는 중 오류가 발생했습니다: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Quote> getQuotes(Id opportunityId) {
        try {
            List<Quote> quotes = [
                SELECT Id, Name, Status, ExpirationDate, Description, GrandTotal,
                       (SELECT Id, PricebookEntry.Product2.Name, PricebookEntry.Product2.Trim__c, 
                               PricebookEntry.Product2.Color__c, PricebookEntry.Product2.Option__c,
                               Quantity, UnitPrice, TotalPrice
                        FROM QuoteLineItems)
                FROM Quote
                WHERE OpportunityId = :opportunityId
                ORDER BY CreatedDate DESC
            ];
            
            return quotes;
        } catch (Exception e) {
            System.debug('Error in getQuotes: ' + e.getMessage());
            throw new AuraHandledException('Quote를 조회하는 중 오류가 발생했습니다: ' + e.getMessage());
        }
    }
} 