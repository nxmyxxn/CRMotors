public with sharing class TestDriveLocationController {
    
    @AuraEnabled(cacheable=true)
    public static List<Flagship_Store__c> getFlagshipStoresWithLocation(String carName) {
        List<Flagship_Store__c> allStores = [
            SELECT Id, Name, Road_name__c, Store_Location__Latitude__s, Store_Location__Longitude__s, Store_Location__c
            FROM Flagship_Store__c
            WHERE AvailableModles__c = :'a0SgL0000005e4rUAA'
        ];

        List<Flagship_Store__c> storesWithLocation = new List<Flagship_Store__c>();
        for (Flagship_Store__c store : allStores) {
            if (store.Store_Location__Latitude__s != null && store.Store_Location__Longitude__s != null) {
                storesWithLocation.add(store);
            }
        }

        return storesWithLocation;
    
    }
}
