public with sharing class PriceBookEntryController {

    
    @AuraEnabled(cacheable=true)
    public static List<PricebookEntry> getProductPrices(String productName) {
        return [
            SELECT Id, UnitPrice, Product2.Name, Pricebook2.Name
            FROM PricebookEntry
            WHERE Product2.Name = :productName
            AND Pricebook2.IsStandard = true
            AND IsActive = true
            LIMIT 1
        ];
    }


    @AuraEnabled(cacheable=true)
    public static List<OptionPriceWrapper> getOptionPrices(List<String> optionNames) {
        List<OptionPriceWrapper> results = new List<OptionPriceWrapper>();
        if (optionNames == null || optionNames.isEmpty()) return results;

        // 여러 옵션명에 해당하는 PricebookEntry 조회
        List<PricebookEntry> entries = [
            SELECT UnitPrice, Product2.Name
            FROM PricebookEntry
            WHERE Product2.Name IN :optionNames
            AND Pricebook2.IsStandard = true
            AND IsActive = true
        ];

        // 결과를 래퍼로 변환
        for (PricebookEntry entry : entries) {
            results.add(new OptionPriceWrapper(entry.Product2.Name, entry.UnitPrice));
        }
        return results;
    }

    public class OptionPriceWrapper {
        @AuraEnabled public String name;
        @AuraEnabled public Decimal price;
        public OptionPriceWrapper(String name, Decimal price) {
            this.name = name;
            this.price = price;
        }
    }
}
