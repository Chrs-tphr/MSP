var refLicObj = new licenseProfObject(LicenseModel.stateLicense, "Carrier");
if(refLicObj){
	var cied = refLicObj.getAttribute("Cargo Insurance Expiration Date");
	var pied = refLicObj.getAttribute("PL/PD Insurance Expiration Date");
	var ias = refLicObj.getAttribute("Intrastate Authority Status");
	
	refLicObj.refLicModel.setBusinessLicExpDate(aa.date.parseDate(cied));
	refLicObj.refLicModel.setInsuranceExpDate(aa.date.parseDate(pied));
	refLicObj.refLicModel.setInsuranceCo(ias);
	
	if(matches(ias,"Active","Revoked","Temporarily Discontinued","Suspended")){
		refLicObj.refLicModel.setAcaPermission(null);
	}else{
		refLicObj.refLicModel.setAcaPermission("N");
	}
	refLicObj.updateRecord();
}