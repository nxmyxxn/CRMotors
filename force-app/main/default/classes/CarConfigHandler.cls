public with sharing class CarConfigHandler {

        public static void handleOpportunityCreated(List<Opportunity> opptys) {
            Set<String> emails = new Set<String>();
            Map<Id, Opportunity> oppMap = new Map<Id, Opportunity>();
    
            for (Opportunity opp : opptys) {
                if (opp.AccountId != null) {
                    Account acct = [SELECT Id, PersonEmail FROM Account WHERE Id = :opp.AccountId LIMIT 1];
                    if (acct.PersonEmail != null) {
                        emails.add(acct.PersonEmail);
                        oppMap.put(opp.Id, opp);
                    }
                }
            }
    
            if (emails.isEmpty()) return;
    
            List<CarConfigueQuote__c> matchedQuotes = [
                SELECT Id, Email__c, Option__c, Trim__c, Color__c, Opportunity__c
                FROM CarConfigueQuote__c
                WHERE Email__c IN :emails
            ];
    
            List<OpportunityLineItem> oliList = new List<OpportunityLineItem>();
            List<CarConfigueQuote__c> quotesToUpdate = new List<CarConfigueQuote__c>();
    
            for (CarConfigueQuote__c quote : matchedQuotes) {
                String formattedOptions = quote.Option__c != null ? quote.Option__c.replace(',', '+') : '';

                List<Product2> productMatch = [
                    SELECT Id, Name, Option__c
                    FROM Product2
                    WHERE Trim__c = :quote.Trim__c
                    AND Color__c = :quote.Color__c
                    AND Option__c = :formattedOptions
                    LIMIT 1
                ];
    
                if (productMatch.isEmpty()) continue;
    
                Product2 product = productMatch[0];
    
                List<PricebookEntry> entries = [
                    SELECT Id, UnitPrice FROM PricebookEntry
                    WHERE Product2Id = :product.Id
                    AND Pricebook2.IsStandard = true
                    LIMIT 1
                ];
    
                if (entries.isEmpty()) continue;
    
                PricebookEntry entry = entries[0];
    
                for (Opportunity opp : opptys) {
                    Account acct = [SELECT PersonEmail FROM Account WHERE Id = :opp.AccountId LIMIT 1];
                    if (acct.PersonEmail == quote.Email__c) {
                        OpportunityLineItem oli = new OpportunityLineItem(
                            OpportunityId = opp.Id,
                            PricebookEntryId = entry.Id,
                            Quantity = 1,
                            TotalPrice = entry.UnitPrice
                        );
                        oliList.add(oli);
    
                        quote.Opportunity__c = opp.Id;
                        quotesToUpdate.add(quote);
                    }
                }
            }
    
            if (!oliList.isEmpty()) insert oliList;
            if (!quotesToUpdate.isEmpty()) update quotesToUpdate;
        }
    }