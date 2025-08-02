public with sharing class ReservationScheduler {
    
    @AuraEnabled
    public static Id createReservation(Id shopId, Datetime preferredDate, List<String> skillsetNames, Id accountId) {
        // 1. 요일 계산
        String dayOfWeek = preferredDate.format('E', 'ko_KR');

        // 2. 운영시간 정보 가져오기
        OperatingHours__c operating = [
            SELECT Id, StartOperation__c, EndOperation__c
            FROM OperatingHours__c
            WHERE Name = :dayOfWeek AND OperationRepairShop__c = :shopId
            LIMIT 1
        ];

        Time startOperationTime = operating.StartOperation__c;
        Time endOperationTime = operating.EndOperation__c;
        Time requestedTime = preferredDate.time();

        if (requestedTime < startOperationTime || requestedTime > endOperationTime) {
            throw new AuraHandledException('선택한 시간은 정비소 운영 시간에 포함되지 않습니다.');
        }

        // 3. 예약 타임 범위 계산 (1시간 30분 단위)
        Datetime endTime = preferredDate.addMinutes(90);

        // 4. 요구 기술역량을 가진 정비사 ID 목록 조회
        Set<Id> skillsetIds = new Set<Id>();
        for (Skillset__c s : [
            SELECT Id FROM Skillset__c WHERE Name IN :skillsetNames
        ]) {
            skillsetIds.add(s.Id);
        }

        Set<Id> technicianIdsWithSkills = new Set<Id>();
        for (TechnicianSkillset__c ts : [
            SELECT SkillsetTechnician__c
            FROM TechnicianSkillset__c
            WHERE SkillsetperTechnician__c IN :skillsetIds
        ]) {
            technicianIdsWithSkills.add(ts.SkillsetTechnician__c);
        }

        // 5. 정비소에 소속된 정비사 중 근무 중이고, 기술역량이 있는 정비사 조회
        List<WorkingHour__c> workingHours = [
            SELECT Id, SelectTechnician__c,
                OperationTechnician__r.Name,
                SelectTechnician__r.Name
            FROM WorkingHour__c
            WHERE OperationTechnician__r.Name = :dayOfWeek
                AND SelectTechnician__r.TechnicianRepairShop__c = :shopId
                AND SelectTechnician__c IN :technicianIdsWithSkills
        ];

        if (workingHours.isEmpty()) {
            throw new AuraHandledException('해당 시간에 가능한 정비사가 없습니다.');
        }

        // 6. 정비사별 기존 예약 확인 (중복 방지)
        Set<Id> occupiedTechnicianIds = new Set<Id>();
        for (Case c : [
            SELECT TechnicianPerCase__c, Preferred_Date__c
            FROM Case
            WHERE Preferred_Date__c >= :preferredDate
              AND Preferred_Date__c < :endTime
              AND TechnicianPerCase__c != null
        ]) {
            occupiedTechnicianIds.add(c.TechnicianPerCase__c);
        }

        // 7. 가능한 정비사 찾기
        for (WorkingHour__c wh : workingHours) {
            if (!occupiedTechnicianIds.contains(wh.SelectTechnician__c)) {
                // 8. Case 생성
                Case c = new Case();
                c.AccountId = accountId;
                c.Repair_Shop__c = shopId;
                c.Preferred_Date__c = preferredDate;
                c.TechnicianPerCase__c = wh.SelectTechnician__c;
                c.ServiceReservationTypeDetails__c = String.join(skillsetNames, ';');
                c.Status = 'Open'; // 필요시 수정
                insert c;
                return c.Id;
            }
        }

        throw new AuraHandledException('해당 시간에 가능한 정비사가 모두 예약되었습니다.');
    }
}