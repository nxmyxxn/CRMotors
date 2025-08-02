trigger LeadTrigger on Lead (after update) {
    if (Trigger.isAfter && Trigger.isUpdate) {
        LeadTriggerHandler.handleConvertedLeads(Trigger.new, Trigger.oldMap);
    }
}