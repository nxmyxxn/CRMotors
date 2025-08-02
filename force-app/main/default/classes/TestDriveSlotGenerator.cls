public with sharing class TestDriveSlotGenerator {

    public TestDriveSlotGenerator() {
    }

    public static void generateSlots(Date startDate, Integer numberOfDays) {

        List<Flagship_Store__c> stores = [
            SELECT Id, Name, Opening_Time__c, Closing_Time__c 
            FROM Flagship_Store__c 
            WHERE AvailableModles__c != null
        ];

        List<VehicleModel__c> models = [
            SELECT Id, Name, DriveMethod__c, EligibleStore__c 
            FROM VehicleModel__c 
            WHERE AllowTestDrive__c = TRUE
        ];

        for (VehicleModel__c model : models) {
            System.debug('모델 ID: ' + model.Id + ', 이름: ' + model.Name);
        }

        //Junction object에서 매핑 가져오기
        List<VehicleModelStore__c> modelStoreLinks = [
            SELECT VehicleModel__c, FlagshipStore__c 
            FROM VehicleModelStore__c
        ];
    
        // 모델별 허용 매장 맵 생성
        Map<Id, Set<Id>> modelToStores = new Map<Id, Set<Id>>();
        for (VehicleModelStore__c link : modelStoreLinks) {
            if (!modelToStores.containsKey(link.VehicleModel__c)) {
                modelToStores.put(link.VehicleModel__c, new Set<Id>());
            }
            modelToStores.get(link.VehicleModel__c).add(link.FlagshipStore__c);
            System.debug(modelToStores);
        }

        List<TestDriveStaff__c> staffList = [
            SELECT Id, Name, AssignedFlagshipStore__c, WorkStart__c, WorkEnd__c, OffDays__c 
            FROM TestDriveStaff__c 
            WHERE AssignedFlagshipStore__c != null
        ];

        // 직원별 배정 가능한 매장 맵 생성 (기존 배정 + 추가 배정 가능 매장)
        Map<Id, List<Id>> staffToAvailableStores = new Map<Id, List<Id>>();
        
        // 각 직원의 기존 배정 매장과 추가 배정 가능한 매장들을 수집
        for (TestDriveStaff__c staff : staffList) {
            List<Id> availableStores = new List<Id>();
            
            // 기존 배정 매장 추가
            if (staff.AssignedFlagshipStore__c != null) {
                availableStores.add(staff.AssignedFlagshipStore__c);
            }
            
            // 추가로 배정 가능한 매장들 (모든 매장에서 랜덤 선택)
            for (Flagship_Store__c store : stores) {
                if (!availableStores.contains(store.Id)) {
                    availableStores.add(store.Id);
                }
            }
            
            staffToAvailableStores.put(staff.Id, availableStores);
        }

        List<TestDriveSlot__c> slotsToInsert = new List<TestDriveSlot__c>();

        for (Integer i = 0; i < numberOfDays; i++) {
            Date currentDate = startDate.addDays(i);
            DateTime dt = DateTime.newInstance(currentDate, Time.newInstance(0, 0, 0, 0));
            Integer dow = dt.format('u', 'en_US').isNumeric() ? Integer.valueOf(dt.format('u', 'en_US')) : 1;
            // u = ISO day of week (1=Monday, 7=Sunday)
            String[] dayCodes = new List<String>{'MON','TUE','WED','THU','FRI','SAT','SUN'};
            String dayCode = dayCodes[dow - 1];
            
            for (VehicleModel__c model : models) {
                for (Flagship_Store__c store : stores) {
                    
                    if (!modelToStores.containsKey(model.Id)) continue;
                    if (!modelToStores.get(model.Id).contains(store.Id)) continue;

                    System.debug('Store: ' + store.Id + ', Name: ' + store.Name);
                    System.debug('modelToStores: ' + modelToStores.get(model.Id));

                    if (!modelToStores.containsKey(model.Id)) {
                        System.debug('모델 ' + model.Name + ' 은 어떤 매장에도 연결되어 있지 않음');
                        continue;
                    }
            
                    // 해당 매장에 배정 가능한 직원들을 찾기
                    List<TestDriveStaff__c> availableStaffForStore = new List<TestDriveStaff__c>();
                    for (TestDriveStaff__c staff : staffList) {
                        List<Id> staffStores = staffToAvailableStores.get(staff.Id);
                        if (staffStores != null && staffStores.contains(store.Id)) {
                            // 휴무일 체크
                            if (staff.OffDays__c != null && staff.OffDays__c.contains(dayCode)) continue;
                            availableStaffForStore.add(staff);
                        }
                    }
                    
                    // 직원이 없으면 다음 매장으로
                    if (availableStaffForStore.isEmpty()) continue;
                    
                    // 매장별로 직원을 랜덤하게 선택 (균등 분배)
                    Integer staffIndex = Math.mod(i + Math.mod(store.Id.hashCode(), availableStaffForStore.size()), availableStaffForStore.size());
                    TestDriveStaff__c selectedStaff = availableStaffForStore[staffIndex];
                    
                    System.debug('매장: ' + store.Name + ' / 선택된 직원: ' + selectedStaff.Name + ' / 매장ID: ' + store.Id + ' / 직원배정매장: ' + selectedStaff.AssignedFlagshipStore__c);

                    // 시간 루프
                    Time slotStart = selectedStaff.WorkStart__c;
                    Time slotEnd = selectedStaff.WorkEnd__c;

                    // ➕ 시작/종료 범위 조정
                    Time dayStart = Time.newInstance(10, 0, 0, 0);
                    Time dayEnd = Time.newInstance(18, 0, 0, 0);
                    Time lunchStart = Time.newInstance(12, 0, 0, 0);
                    Time lunchEnd = Time.newInstance(13, 0, 0, 0);

                    // ✅ 범위 교집합 설정
                    slotStart = (slotStart < dayStart) ? dayStart : slotStart;
                    slotEnd = (slotEnd > dayEnd) ? dayEnd : slotEnd;

                    while (slotStart.addMinutes(60) <= slotEnd) {
                        Time next = slotStart.addMinutes(60);

                        // 🚫 점심시간 제외
                        if (
                            (slotStart >= lunchStart && slotStart < lunchEnd) ||
                            (next > lunchStart && next <= lunchEnd)
                        ) {
                            slotStart = next;
                            continue;
                        }

                        TestDriveSlot__c slot = new TestDriveSlot__c(
                            Name = String.valueOf(currentDate)+ ' ' + String.valueOf(slotStart),
                            Date__c = currentDate,
                            DayCode__c = dayCode, // 요일 저장
                            StartTime__c = slotStart,
                            EndTime__c = next,
                            FlagshipStore__c = store.Id,
                            VehicleModel__c = model.Id,
                            DriveMethod__c = model.DriveMethod__c,
                            AssignedStaff__c = selectedStaff.Id,
                            isAvailable__c = true
                        );

                        System.debug('근무시간 - 시작: ' + slotStart + ' / 종료: ' + slotEnd);

                        slotsToInsert.add(slot);
                        slotStart = next;
                    }
                }
            }
        }

        System.debug('Stores: ' + stores.size());
        System.debug('Models: ' + models.size());
        System.debug('Staff: ' + staffList.size());
        System.debug('Slots to insert: ' + slotsToInsert.size());
        
        if (!slotsToInsert.isEmpty()) {
            insert slotsToInsert;
        }
    }
}

