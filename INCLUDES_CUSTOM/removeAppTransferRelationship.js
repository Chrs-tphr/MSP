function removeAppTransferRelationship(){
	if(!cap.isCreatedByACA() && getParent() != null){
		pId = getParent();
	}else{
		pId = null;
	}
	if(pId){
		pCap = aa.cap.getCap(pId).getOutput();
		parentAppType = pCap.getCapType().toString();
		logDebug(parentAppType);
		if(parentAppType == "MCD/Intrastate Motor Carrier/Transfer/NA"){
			editAppSpecific("Transfer Application Number", pId.getCustomID());
		}
		pId ^ removeParent(pId.getCustomID());
	}
}