public with sharing class CustomerInfoController {
    @AuraEnabled(cacheable=true)
    public static Account getCustomerInfo() {
        Id accountId = '001gL00000ECBUJQA5'; // 고정된 Account ID

        Account personAccount = [
            SELECT Id, Name, PersonMobilePhone, PersonEmail
            FROM Account
            WHERE Id = :accountId
            LIMIT 1
        ];

        return personAccount;
    }
}