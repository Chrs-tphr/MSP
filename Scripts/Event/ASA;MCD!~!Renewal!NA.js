prepareAppForRenewal();
assessRenewalDecalFee();

if(feeExists("RENEWAL") == false){
	 updateFee("RENEWAL","MCD_AUTH_RENEW","FINAL",1,"Y");
}