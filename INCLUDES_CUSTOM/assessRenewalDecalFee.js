function assessRenewalDecalFee() { //CG 12/14/2015 added function to calculate and update renewal decal fee.
	
	exstngRnwlFeeAmt = 0;
	feeAmt = 0;
	equipTable = loadASITable("EQUIPMENT LIST");

	feeAmt = sumASITColumn(equipTable, "Plate Fee");

	if (feeExists("DECAL") == true){
		exstngRnwlFeeAmt = getFeeAmount("DECAL");
	}	

	if (feeAmt != exstngRnwlFeeAmt) {
		updateFee("DECAL", "MCD_AUTH_RENEW", "FINAL", feeAmt, "Y");
	}	
}