trigger addressTrigger1 on Account (after insert, after update) {
  System.debug('=== Sunny : Trigger to invoke update naverLongitude, naverLatitude');

  if (Trigger.isBefore) {
    System.debug('*****Trigger isBefore values*****');
    System.debug('*****SFDC: Trigger.old is: ' + Trigger.old);
    System.debug('*****SFDC: Trigger.new is: ' + Trigger.new);
  }

  if (Trigger.isAfter) {
    System.debug('*****Trigger isAfter values*****');
    System.debug('*****SFDC: Trigger.old is: ' + Trigger.old);
    System.debug('*****SFDC: Trigger.new is: ' + Trigger.new);
  }

  for (account acc : Trigger.new) {
  }
  
}