public with sharing class RepairReservationScheduler {
    public class TimeSlotWrapper {
        @AuraEnabled public String label;
        @AuraEnabled public Integer remaining;
        @AuraEnabled public String startTime;

        public TimeSlotWrapper(String label, Integer remaining, String startTime) {
            this.label = label;
            this.remaining = remaining;
            this.startTime = startTime;
        }
    }

    // ✅ STEP.5 시간 슬롯 조회
    @AuraEnabled(cacheable=true)
    public static List<TimeSlotWrapper> getAvailableTimeSlots(Date selectedDate, Id repairShopId) {
        List<TimeSlotWrapper> result = new List<TimeSlotWrapper>();
        String[] weekdays = new List<String>{'일', '월', '화', '수', '목', '금', '토'};
        Integer dayIndex = (Integer)selectedDate.toStartOfWeek().daysBetween(selectedDate);
        String dayOfWeek = weekdays[dayIndex];

        List<OperatingHours__c> ops = [
            SELECT Id, StartOperation__c, EndOperation__c
            FROM OperatingHours__c
            WHERE OperationRepairShop__c = :repairShopId AND Name = :dayOfWeek
        ];
        if (ops.isEmpty()) return result;

        OperatingHours__c op = ops[0];
        Time startTime = op.StartOperation__c;
        Time endTime = op.EndOperation__c;

        List<WorkingHour__c> working = [
            SELECT SelectTechnician__c
            FROM WorkingHour__c
            WHERE OperationTechnician__c = :op.Id
        ];
        Set<Id> workingTechIds = new Set<Id>();
        for (WorkingHour__c wh : working) {
            workingTechIds.add(wh.SelectTechnician__c);
        }
        if (workingTechIds.isEmpty()) return result;

        DateTime startOfDay = DateTime.newInstance(selectedDate, Time.newInstance(0,0,0,0));
        DateTime endOfDay = DateTime.newInstance(selectedDate, Time.newInstance(23,59,59,0));

        List<Case> existingCases = [
            SELECT Preferred_Date__c, TechnicianPerCase__c
            FROM Case
            WHERE TechnicianPerCase__c IN :workingTechIds
              AND Preferred_Date__c >= :startOfDay AND Preferred_Date__c <= :endOfDay
        ];

        Map<Time, Integer> slotCount = new Map<Time, Integer>();
        for (Case c : existingCases) {
            Time slotTime = Time.newInstance(c.Preferred_Date__c.hour(), c.Preferred_Date__c.minute(), 0, 0);
            slotCount.put(slotTime, slotCount.containsKey(slotTime) ? slotCount.get(slotTime) + 1 : 1);
        }

        for (Time t = startTime; t.addMinutes(90) <= endTime; t = t.addMinutes(90)) {
            if (t >= Time.newInstance(13,0,0,0) && t < Time.newInstance(14,30,0,0)) continue;

            Time tEnd = t.addMinutes(90);
            String label = pad(t.hour()) + ':' + pad(t.minute()) + ' - ' + pad(tEnd.hour()) + ':' + pad(tEnd.minute());
            Integer used = slotCount.containsKey(t) ? slotCount.get(t) : 0;
            Integer remaining = workingTechIds.size() - used;

            result.add(new TimeSlotWrapper(label, remaining, pad(t.hour()) + ':' + pad(t.minute())));
        }
        return result;
    }

    private static String pad(Integer n) {
        return n < 10 ? '0' + String.valueOf(n) : String.valueOf(n);
    }

    // ✅ STEP.3 Picklist 값 가져오기 (기존 코드 유지)
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getServiceDetailsPicklistValues() {
        System.debug('🔍 [getServiceDetailsPicklistValues] 호출됨');
        
        List<Map<String, String>> results = new List<Map<String, String>>();
        
        try {
            Schema.DescribeFieldResult fieldResult = Case.ServiceReservationTypeDetails__c.getDescribe();
            List<Schema.PicklistEntry> picklistValues = fieldResult.getPicklistValues();
            
            System.debug('📋 총 Picklist 값 개수: ' + picklistValues.size());
            
            for (Schema.PicklistEntry entry : picklistValues) {
                if (entry.isActive()) {
                    System.debug('✅ 활성 값 - Label: "' + entry.getLabel() + '", Value: "' + entry.getValue() + '"');
                    results.add(new Map<String, String>{
                        'label' => entry.getLabel(),
                        'value' => entry.getValue()
                    });
                } else {
                    System.debug('❌ 비활성 값 - Label: "' + entry.getLabel() + '", Value: "' + entry.getValue() + '"');
                }
            }
        } catch (Exception e) {
            System.debug('❌ Picklist 조회 실패: ' + e.getMessage());
        }
        
        System.debug('🔄 반환할 결과: ' + JSON.serialize(results));
        return results;
    }

    // ✅ STEP.5 예약 및 기술자 배정 (Frontend에서 전달받은 값 사용)
    @AuraEnabled
    public static void assignTechnicianAndCreateCase(
        Id accountId,
        Id repairShopId,
        String preferredDate,
        String selectedDetails,
        String serviceType  // 🟡 Frontend에서 계산된 값 받기
    ) {
        System.debug('🚀 [assignTechnicianAndCreateCase] 시작');
        System.debug('selectedDetails: ' + selectedDetails);
        System.debug('serviceType: ' + serviceType);

        DateTime parsedDateTime;
        try {
            parsedDateTime = DateTime.valueOf(preferredDate);
        } catch (Exception e) {
            throw new AuraHandledException('날짜 형식이 잘못되었습니다.');
        }

        Case c = new Case(
            AccountId = accountId,
            Repair_Shop__c = repairShopId,
            Preferred_Date__c = parsedDateTime,
            Status = 'New',
            Subject = '정비 예약 - ' + String.valueOf(parsedDateTime.date()),
            ServiceReservationType__c = serviceType, // 🟡 Frontend에서 전달받은 값 사용
            ServiceReservationTypeDetails__c = selectedDetails
        );

        try {
            insert c;
            System.debug('✅ Case 생성 성공: ' + c.Id);
        } catch (DmlException e) {
            System.debug('❌ DML 실패: ' + e.getMessage());
            throw new AuraHandledException('예약 접수 중 오류가 발생했습니다: ' + e.getDmlMessage(0));
        }
    }


}