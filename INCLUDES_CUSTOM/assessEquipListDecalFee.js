function assessEquipListDecalFee() { //CG 12.17.2015 = GC = $100 and has half year discount, HHG = $50.
	feeAmt = 0;
	exstngFeeAmt = 0;
	feeDate = getTodayString();
	feeStartDate = "6/30/"+ new Date().getFullYear();
	feeEndDate = "11/01/"+ new Date().getFullYear();
	equipTable = loadASITable("EQUIPMENT LIST");
	if (feeDate > feeStartDate && feeDate < feeEndDate) {
		feeAmt = countASITRows(equipTable, "Vehicle Action", "INCLUDE", "Add Vehicle", "Equipment Use", "EXCLUDE", "Household Goods")*50;
	}
	else {
		feeAmt = countASITRows(equipTable, "Vehicle Action", "INCLUDE", "Add Vehicle", "Equipment Use", "EXCLUDE", "Household Goods")*100;
	}
	feeAmt += countASITRows(equipTable, "Vehicle Action", "INCLUDE", "Add Vehicle", "Equipment Use", "INCLUDE", "Household Goods")*50;
	
	if (feeExists("DECAL") == true) {
		exstngFeeAmt = getFeeAmount("DECAL");
	}
	if (feeAmt > 0 && feeAmt != exstngFeeAmt) {
		updateFee("DECAL", "MCD_EQUIP", "FINAL", feeAmt, "Y");
	}
	if (feeExists("DECAL") == true && feeAmt <= 0) {
		voidRemoveFees("DECAL");
	}
}