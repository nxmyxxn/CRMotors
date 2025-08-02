public with sharing class TestDriveController {
    @AuraEnabled
    public static void createLeadAndTestDrive(
        String userName,
        String userPhone,
        String userEmail,
        String selectedCar,
        String selectedCarLabel,
        String preferredDate,
        String preferredTime,
        String purchaseTimeline,
        String additionalNotes,
        String selectedDealer,
        String selectedDriveMethod
    )
    {
        String dateTimeStr = preferredDate + ' ' + preferredTime + ':00';
        Datetime testDriveDateTime = Datetime.valueOf(dateTimeStr);
        // 1. Lead 생성
        Lead newLead = new Lead(
            LastName = userName,
            Phone = userPhone,
            Email = userEmail,
            Status = '시승',
            LeadSource = '홈페이지'
        );
        insert newLead;

        // 2. 같은 이메일을 가진 CarConfigueQuote__c의 Lead__c 필드에 새로 생성된 리드 Id를 연결
        List<CarConfigueQuote__c> quotesToUpdate = [
            SELECT Id, Email__c
            FROM CarConfigueQuote__c
            WHERE Email__c = :userEmail
        ];
        for (CarConfigueQuote__c quote : quotesToUpdate) {
            quote.Lead__c = newLead.Id;
        }
        if (!quotesToUpdate.isEmpty()) {
            update quotesToUpdate;
        }

        // 2-1. Person Account에서 해당 이메일을 가진 Account 찾기
        List<Account> personAccounts = [
            SELECT Id, PersonEmail
            FROM Account
            WHERE PersonEmail = :userEmail
            AND IsPersonAccount = true
            LIMIT 1
        ];
        Id accountId = null;
        if (!personAccounts.isEmpty()) {
            accountId = personAccounts[0].Id;
        }

        // 3. TestDriveInfo__c 생성
        TestDriveInfo__c newTestDriveInfo = new TestDriveInfo__c(
            Lead__c = newLead.Id,
            Name = 'TestDrive 생성됨: ' + userName + '\'의 ' + selectedCar,
            VehicleModel__c = 'a0SgL0000005e4rUAA',
            FlagshipStore__c = selectedDealer,
            PreferredDate__c = testDriveDateTime.date(),
            PreferredTime__c = testDriveDateTime.time(),
            DriveMethod__c = selectedDriveMethod,
            Purchase_Timeline__c = purchaseTimeline,
            Notes__c = additionalNotes,
            Account__c = accountId,
            Status__c = 'Confirmed'
        );
        insert newTestDriveInfo;
    }
}