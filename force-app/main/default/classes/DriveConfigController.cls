public with sharing class DriveConfigController {

    @AuraEnabled
    public static Id saveVehicleConfig(String carName, String trimValue, String colorValue, List<String> optionValues, String email) {
        System.debug('=== saveVehicleConfig Input ===');
        System.debug('carName: ' + carName);
        System.debug('trimValue: ' + trimValue);
        System.debug('colorValue: ' + colorValue);
        System.debug('optionValues: ' + optionValues);
        System.debug('email: ' + email);

        // 옵션 요약 생성
        String optionSummary = createOptionSummary(optionValues);
        System.debug('Generated Option Summary: ' + optionSummary);

        Id completeCarId = null;

        try {
            completeCarId = getCompleteCarProduct(carName, trimValue, colorValue, optionSummary);
            System.debug('Found Product2 ID: ' + completeCarId);
        } catch (Exception e) {
            System.debug('Error finding complete car Product2: ' + e.getMessage());
            System.debug('Stack trace: ' + e.getStackTraceString());
        }

        CarConfigueQuote__c config = new CarConfigueQuote__c();
        config.Car_Name__c = mapCarName(carName); // 매핑된 carName 사용
        config.Trim__c = trimValue;
        config.Color__c = colorValue;
        config.Option__c = optionSummary;
        config.Email__c = email;
        config.Name = email + ' | ' + mapCarName(carName) + ' | ' + trimValue + ' | ' + colorValue + ' | ' + optionSummary;

        if (completeCarId != null) {
            config.product__c = completeCarId;
        }       

        System.debug('About to insert CarConfigueQuote__c: ' + config);
        System.debug('CarConfigueQuote__c fields:');
        System.debug('  Car_Name__c: ' + config.Car_Name__c);
        System.debug('  Trim__c: ' + config.Trim__c);
        System.debug('  Color__c: ' + config.Color__c);
        System.debug('  Option__c: ' + config.Option__c);
        System.debug('  Email__c: ' + config.Email__c);
        System.debug('  Name: ' + config.Name);
        System.debug('  product__c: ' + config.product__c);
        
        try {
            insert config;
            System.debug('Successfully inserted CarConfigueQuote__c with ID: ' + config.Id);
            
            // 생성된 레코드를 다시 조회하여 확인
            CarConfigueQuote__c insertedRecord = [
                SELECT Id, Name, Car_Name__c, Trim__c, Color__c, Option__c, Email__c, product__c, CreatedDate
                FROM CarConfigueQuote__c
                WHERE Id = :config.Id
            ];
            System.debug('Inserted record details: ' + insertedRecord);
            
            return config.Id;
        } catch (Exception e) {
            System.debug('Error inserting CarConfigueQuote__c: ' + e.getMessage());
            System.debug('Stack trace: ' + e.getStackTraceString());
            System.debug('Error type: ' + e.getTypeName());
            throw e;
        }
    }

    private static String createOptionSummary(List<String> optionValues) {
        if (optionValues == null || optionValues.isEmpty()) return '';
        List<String> validOptions = new List<String>();
        for (String opt : optionValues) {
            if (String.isNotBlank(opt)) validOptions.add(opt);
        }
        return String.join(validOptions, ' +');
    }

    private static Id getCompleteCarProduct(String carName, String trimValue, String colorValue, String optionSummary) {
        if (String.isBlank(carName)) return null;

        // carName 매핑
        String mappedCarName = mapCarName(carName);
        String mappedTrim = mapTrimValue(trimValue);
        String mappedColor = mapColorValue(colorValue);
        String mappedOption = mapOptionSummary(optionSummary);

        System.debug('--- getCompleteCarProduct Query Values ---');
        System.debug('Original carName: ' + carName);
        System.debug('Mapped carName: ' + mappedCarName);
        System.debug('Trim__c = ' + mappedTrim);
        System.debug('Color__c = ' + mappedColor);
        System.debug('Option__c = ' + mappedOption);

        List<Product2> products = [
            SELECT Id, Name, Trim__c, Color__c, Option__c
            FROM Product2
            WHERE Name = :mappedCarName
            AND Trim__c = :mappedTrim
            AND Color__c = :mappedColor
            AND Option__c = :mappedOption
            LIMIT 1
        ];

        if (!products.isEmpty()) {
            System.debug('✅ Matching Product Found: ' + products[0].Id);
            return products[0].Id;
        } else {
            System.debug('❌ No matching Product2 found');
            
            // 디버깅을 위해 해당 차종의 모든 Product2 조회
            List<Product2> allProductsForCar = [
                SELECT Id, Name, Trim__c, Color__c, Option__c
                FROM Product2
                WHERE Name = :mappedCarName
            ];
            System.debug('All Product2 records for car ' + mappedCarName + ': ' + allProductsForCar);
            
            // Trim__c, Color__c, Option__c 필드가 있는 Product2만 조회
            List<Product2> productsWithFields = [
                SELECT Id, Name, Trim__c, Color__c, Option__c
                FROM Product2
                WHERE Name = :mappedCarName
                AND Trim__c != null
                AND Color__c != null
                AND Option__c != null
            ];
            System.debug('Product2 records with Trim__c, Color__c, Option__c fields: ' + productsWithFields);
        }

        return null;
    }

    private static String mapCarName(String carName) {
        Map<String, String> carNameMapping = new Map<String, String>{
            'Ray EV' => '레이 EV',
            'niroev' => '니로 EV',
            'ev3' => 'EV3',
            'EV4' => 'EV4'
        };
        return carNameMapping.containsKey(carName) ? carNameMapping.get(carName) : carName;
    }

    private static String mapTrimValue(String trimValue) {
        Map<String, String> trimMapping = new Map<String, String>{
            '에어' => '에어',
            '에어 스탠다드' => '에어 스탠다드',
            '에어 롱레인지' => '에어 롱레인지',
            '라이트' => '라이트'
        };
        return trimMapping.containsKey(trimValue) ? trimMapping.get(trimValue) : trimValue;
    }

    private static String mapColorValue(String colorValue) {
        Map<String, String> colorMapping = new Map<String, String>{
            '오로라 블랙 펄' => '오로라 블랙 펄',
            '스모크 블루' => '스모크 블루',
            '아쿠아 민트' => '아쿠아 민트',
            '밀키 베이지' => '밀키 베이지'
        };
        return colorMapping.containsKey(colorValue) ? colorMapping.get(colorValue) : colorValue;
    }

    private static String mapOptionSummary(String optionSummary) {
        Map<String, String> optionMapping = new Map<String, String>{
            '컴포트1' => '컴포트1',
            '컴포트2' => '컴포트2',
            '스타일' => '스타일',
            '드라이브 와이즈2' => '드라이브 와이즈2',
            '하이패스 자동결제 시스템' => '하이패스 자동결제 시스템',
            '스타일+드라이브 와이즈2+하이패스 자동결제 시스템' => '스타일 + 드라이브 와이즈2 + 하이패스 자동결제 시스템',
            '드라이브 와이즈2+하이패스 자동결제 시스템' => '드라이브 와이즈2 + 하이패스 자동결제 시스템',
            '스타일 + 드라이브 와이즈2 + 하이패스 자동결제 시스템' => '스타일 + 드라이브 와이즈2 + 하이패스 자동결제 시스템',
            '드라이브 와이즈2 + 하이패스 자동결제 시스템' => '드라이브 와이즈2 + 하이패스 자동결제 시스템'
        };
        return optionMapping.containsKey(optionSummary) ? optionMapping.get(optionSummary) : optionSummary;
    }
}