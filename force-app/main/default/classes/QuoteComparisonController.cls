public with sharing class QuoteComparisonController {
    
    // Account ID를 받아서, 관련된 모든 Opportunity 목록을 반환합니다.
    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getOpportunities(Id accountId) {
        return [
            SELECT 
                Id, 
                Name, 
                Amount, 
                CloseDate,
                (SELECT PricebookEntry.Product2.Name, TotalPrice FROM OpportunityLineItems ORDER BY CreatedDate)
            FROM Opportunity
            WHERE AccountId = :accountId
            ORDER BY CreatedDate DESC
        ];
    }
}