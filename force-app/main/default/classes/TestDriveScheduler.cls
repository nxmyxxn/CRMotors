public with sharing class TestDriveScheduler {
    
    public class TimeSlotWrapper {
        @AuraEnabled public String label;
        @AuraEnabled public String startTime;
        @AuraEnabled public String endTime;
        @AuraEnabled public Boolean isAvailable;
        @AuraEnabled public Id slotId;

        public TimeSlotWrapper(String label, String startTime, String endTime, Boolean isAvailable, Id slotId) {
            this.label = label;
            this.startTime = startTime;
            this.endTime = endTime;
            this.isAvailable = isAvailable;
            this.slotId = slotId;
        }
    }

    // 시승 가능한 시간 슬롯 조회
    @AuraEnabled(cacheable=true)
    public static List<TimeSlotWrapper> getAvailableTestDriveSlots(Date selectedDate, Id flagshipStoreId) {
        List<TimeSlotWrapper> result = new List<TimeSlotWrapper>();
        
        try {
            // 해당 날짜의 시승 슬롯 조회
            List<TestDriveSlot__c> slots = [
                SELECT Id, StartTime__c, EndTime__c, isAvailable__c, AssignedStaff__c
                FROM TestDriveSlot__c
                WHERE Date__c = :selectedDate 
                AND FlagshipStore__c = :flagshipStoreId
                ORDER BY StartTime__c
            ];
            
            for (TestDriveSlot__c slot : slots) {
                String startTimeStr = formatTime(slot.StartTime__c);
                String endTimeStr = formatTime(slot.EndTime__c);
                String label = startTimeStr + ' - ' + endTimeStr;
                
                // 이미 예약된 슬롯인지 확인
                Boolean isAvailable = slot.isAvailable__c && !isSlotBooked(slot.Id, selectedDate);
                
                result.add(new TimeSlotWrapper(
                    label, 
                    startTimeStr, 
                    endTimeStr, 
                    isAvailable, 
                    slot.Id
                ));
            }
        } catch (Exception e) {
            System.debug('Error in getAvailableTestDriveSlots: ' + e.getMessage());
            throw new AuraHandledException('시승 시간 슬롯을 조회하는 중 오류가 발생했습니다: ' + e.getMessage());
        }
        
        return result;
    }
    
    // 시승 예약 생성
    @AuraEnabled
    public static Id createTestDriveReservation(
        Id accountId, 
        Id flagshipStoreId, 
        Id slotId, 
        String preferredDate,
        String carModel,
        String trim,
        String color,
        String options
    ) {
        try {
            // TestDriveSlot__c에서 시간 정보 가져오기
            TestDriveSlot__c slot = [
                SELECT Id, StartTime__c, EndTime__c, AssignedStaff__c
                FROM TestDriveSlot__c
                WHERE Id = :slotId
                LIMIT 1
            ];
            
            // 예약 시간 생성
            DateTime reservationDateTime = DateTime.valueOf(preferredDate + ' ' + formatTime(slot.StartTime__c) + ':00');
            
            // Test_Drive__c 레코드 생성
            Test_Drive__c testDrive = new Test_Drive__c(
                Account__c = accountId,
                Test_drive_Date__c = reservationDateTime,
                Model_Name__c = carModel,
                trim__c = trim,
                color__c = color,
                option__c = options,
                User__c = slot.AssignedStaff__c
            );
            
            insert testDrive;
            
            // 슬롯을 사용 불가로 변경
            slot.isAvailable__c = false;
            update slot;
            
            return testDrive.Id;
            
        } catch (Exception e) {
            System.debug('Error in createTestDriveReservation: ' + e.getMessage());
            throw new AuraHandledException('시승 예약을 생성하는 중 오류가 발생했습니다: ' + e.getMessage());
        }
    }
    
    // 슬롯이 이미 예약되었는지 확인
    private static Boolean isSlotBooked(Id slotId, Date selectedDate) {
        List<Test_Drive__c> existingReservations = [
            SELECT Id
            FROM Test_Drive__c
            WHERE Test_drive_Date__c = :DateTime.newInstance(selectedDate, Time.newInstance(0,0,0,0))
            AND Test_drive_Date__c < :DateTime.newInstance(selectedDate, Time.newInstance(23,59,59,0))
        ];
        
        return !existingReservations.isEmpty();
    }
    
    // 시간 포맷팅
    private static String formatTime(Time t) {
        if (t == null) return '';
        return String.valueOf(t.hour()).leftPad(2, '0') + ':' + String.valueOf(t.minute()).leftPad(2, '0');
    }
}
