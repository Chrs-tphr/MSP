/*------------------------------------------------------------------------------------------
|	File Name : removeAppTransferRelationship.js
|	Agency : MSP
|	Events : ASA:MCD/Intrastate Motor Carrier/Application/NA
|	Notes :
|			Added to INCLUDES_CUSTOM Replacing Standard Choice lines:
|				01 - !cap.isCreatedByACA() && getParent() != null ^ pId = getParent() ^ pId = null;
|				02 - pId ^ pCap = aa.cap.getCap(pId).getOutput(); parentAppType = pCap.getCapType().toString(); logDebug(parentAppType);
|				03 - pId && parentAppType == "MCD/Intrastate Motor Carrier/Transfer/NA" ^ editAppSpecific("Transfer Application Number", pId.getCustomID());
|				04 - pId ^ removeParent(pId.getCustomID());
------------------------------------------------------------------------------------------*/
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