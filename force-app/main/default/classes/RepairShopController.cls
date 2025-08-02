public with sharing class RepairShopController {
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getProvinceOptions() {
        List<Map<String, String>> options = new List<Map<String, String>>();
        
        try {
            Schema.DescribeFieldResult fieldResult = Repair_Shop__c.Province__c.getDescribe();
            List<Schema.PicklistEntry> picklistValues = fieldResult.getPicklistValues();
            
            for(Schema.PicklistEntry entry : picklistValues) {
                if(entry.isActive()) {
                    Map<String, String> option = new Map<String, String>();
                    option.put('label', entry.getLabel());
                    option.put('value', entry.getValue());
                    options.add(option);
                }
            }
        } catch(Exception e) {
            System.debug('Error getting province options: ' + e.getMessage());
        }
        
        return options;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Repair_Shop__c> getRepairShops(String province, String city) {
        List<Repair_Shop__c> repairShops = new List<Repair_Shop__c>();
        
        try {
            repairShops = [
                SELECT Id, Name, Address__c, Province__c, City__c, Phone_Number__c 
                FROM Repair_Shop__c 
                WHERE Province__c = :province AND City__c = :city
                ORDER BY Name
            ];
        } catch(Exception e) {
            System.debug('Error getting repair shops: ' + e.getMessage());
        }
        
        return repairShops;
    }
}