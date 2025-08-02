public with sharing class UserInfoController {
    @AuraEnabled(cacheable=true)
    public static User getCurrentUser() {
        Id userId = UserInfo.getUserId();
        return [
            SELECT Id, Name, Email, Title, Department, MediumPhotoUrl
            FROM User
            WHERE Id = :userId
            LIMIT 1
        ];
    }
}