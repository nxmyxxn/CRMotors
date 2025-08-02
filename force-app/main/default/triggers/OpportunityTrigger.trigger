trigger OpportunityTrigger on Opportunity (after insert) {
    if (Trigger.isAfter && Trigger.isInsert) {
        CarConfigHandler.handleOpportunityCreated(Trigger.new);
    }


}