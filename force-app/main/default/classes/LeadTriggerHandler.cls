public class LeadTriggerHandler {
    public static void handleConvertedLeads(List<Lead> newLeads, Map<Id, Lead> oldMap) {
        // 리드 ID → 전환된 기회 ID 매핑
        Map<Id, Id> leadToOpportunityMap = new Map<Id, Id>();
        Map<String, Id> emailToOpportunityMap = new Map<String, Id>();

        for (Lead l : newLeads) {
            if (l.IsConverted && l.ConvertedOpportunityId != null) {
                leadToOpportunityMap.put(l.Id, l.ConvertedOpportunityId);
                if (l.Email != null) {
                    emailToOpportunityMap.put(l.Email, l.ConvertedOpportunityId);
                }
            }
        }

        if (leadToOpportunityMap.isEmpty()) {
            return; // 전환된 리드 없으면 종료
        }

        // 1. 관련된 시승신청정보(TestDriveInfo__c) 레코드 업데이트
        List<TestDriveInfo__c> relatedTestDrives = [
            SELECT Id, Lead3__c, Opportunity__c
            FROM TestDriveInfo__c
            WHERE Lead3__c IN :leadToOpportunityMap.keySet()
        ];

        List<TestDriveInfo__c> testDrivesToUpdate = new List<TestDriveInfo__c>();

        for (TestDriveInfo__c td : relatedTestDrives) {
            if (leadToOpportunityMap.containsKey(td.Lead3__c)) {
                td.Opportunity__c = leadToOpportunityMap.get(td.Lead3__c);
                testDrivesToUpdate.add(td);
            }
        }

        if (!testDrivesToUpdate.isEmpty()) {
            update testDrivesToUpdate;
        }

        // 2. CarConfigueQuote__c 처리 - 이메일로 매칭하여 Quote 생성
        if (!emailToOpportunityMap.isEmpty()) {
            processCarConfigQuotes(emailToOpportunityMap);
        }
    }

    private static void processCarConfigQuotes(Map<String, Id> emailToOpportunityMap) {
        try {
            // 이메일로 CarConfigueQuote__c 조회
            List<CarConfigueQuote__c> quotes = [
                SELECT Id, Name, Car_Name__c, Trim__c, Color__c, Option__c, 
                       Email__c, product__c, opportunity__c
                FROM CarConfigueQuote__c
                WHERE Email__c IN :emailToOpportunityMap.keySet()
                AND product__c != null
            ];

            List<CarConfigueQuote__c> quotesToUpdate = new List<CarConfigueQuote__c>();
            List<OpportunityLineItem> oliList = new List<OpportunityLineItem>();
            List<Quote> quotesToCreate = new List<Quote>();

            for (CarConfigueQuote__c quote : quotes) {
                Id opportunityId = emailToOpportunityMap.get(quote.Email__c);
                
                // CarConfigueQuote__c의 opportunity__c 필드 업데이트
                quote.opportunity__c = opportunityId;
                quotesToUpdate.add(quote);

                // Quote 생성
                Quote newQuote = createQuote(opportunityId, quote);
                if (newQuote != null) {
                    quotesToCreate.add(newQuote);
                }

                // Opportunity Line Item 생성
                // if (quote.product__c != null) {
                //     OpportunityLineItem oli = createOpportunityLineItem(opportunityId, quote.product__c);
                //     if (oli != null) {
                //         oliList.add(oli);
                //     }
                // }
            }

            // 업데이트 및 삽입
            if (!quotesToUpdate.isEmpty()) {
                update quotesToUpdate;
            }
            if (!quotesToCreate.isEmpty()) {
                insert quotesToCreate;
                
                // Quote Line Items 생성
                createQuoteLineItems(quotesToCreate, quotes);
            }
            if (!oliList.isEmpty()) {
                insert oliList;
            }

        } catch (Exception e) {
            System.debug('Error in processCarConfigQuotes: ' + e.getMessage());
            System.debug('Stack trace: ' + e.getStackTraceString());
        }
    }

    private static Quote createQuote(Id opportunityId, CarConfigueQuote__c carQuote) {
        try {
            // Opportunity 정보 가져오기
            Opportunity opp = [
                SELECT Id, Name, AccountId, Account.Name
                FROM Opportunity
                WHERE Id = :opportunityId
                LIMIT 1
            ];

            // Quote 생성
            Quote newQuote = new Quote(
                OpportunityId = opportunityId,
                Name = '견적 - ' + carQuote.Car_Name__c + ' (' + opp.Account.Name + ')',
                Status = 'Draft',
                ExpirationDate = Date.today().addDays(30),
                Description = '리드 견적에서 자동 생성된 견적\n차량: ' + carQuote.Car_Name__c + 
                             '\n트림: ' + carQuote.Trim__c + 
                             '\n컬러: ' + carQuote.Color__c + 
                             '\n옵션: ' + carQuote.Option__c
            );

            return newQuote;
        } catch (Exception e) {
            System.debug('Error creating Quote: ' + e.getMessage());
            return null;
        }
    }

    private static void createQuoteLineItems(List<Quote> quotes, List<CarConfigueQuote__c> carQuotes) {
        try {
            List<QuoteLineItem> qliList = new List<QuoteLineItem>();
            
            for (Integer i = 0; i < quotes.size(); i++) {
                Quote quote = quotes[i];
                CarConfigueQuote__c carQuote = carQuotes[i];
                
                if (carQuote.product__c != null) {
                    // PricebookEntry 찾기
                    List<PricebookEntry> entries = [
                        SELECT Id, UnitPrice
                        FROM PricebookEntry
                        WHERE Product2Id = :carQuote.product__c
                        AND Pricebook2.IsStandard = true
                        AND IsActive = true
                        LIMIT 1
                    ];

                    if (!entries.isEmpty()) {
                        QuoteLineItem qli = new QuoteLineItem(
                            QuoteId = quote.Id,
                            PricebookEntryId = entries[0].Id,
                            Quantity = 1,
                            UnitPrice = entries[0].UnitPrice
                        );
                        qliList.add(qli);
                    }
                }
            }

            if (!qliList.isEmpty()) {
                insert qliList;
            }

        } catch (Exception e) {
            System.debug('Error creating QuoteLineItems: ' + e.getMessage());
        }
    }

    private static OpportunityLineItem createOpportunityLineItem(Id opportunityId, Id productId) {
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
                System.debug('No PricebookEntry found for Product2Id: ' + productId);
                return null;
            }

            // OpportunityLineItem 생성
            OpportunityLineItem oli = new OpportunityLineItem(
                OpportunityId = opportunityId,
                PricebookEntryId = entries[0].Id,
                Quantity = 1,
                UnitPrice = entries[0].UnitPrice
            );

            return oli;
        } catch (Exception e) {
            System.debug('Error creating OpportunityLineItem: ' + e.getMessage());
            return null;
        }
    }
}