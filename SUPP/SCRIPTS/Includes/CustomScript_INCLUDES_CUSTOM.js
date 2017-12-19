/*------------------------------------------------------------------------------------------------------/
| Program : INCLUDES_CUSTOM.js
| Event   : N/A
|
| Usage   : Custom Script Include.  Insert custom EMSE Function below and they will be available to all master scripts
| 
| Version 12.18.2017 11.54 pst
| 
| Notes   : createRefLicProf - override to default the state if one is not provided
|
|         : createRefContactsFromCapContactsAndLink - testing new ability to link public users to new ref contacts
|
|
| Defect Updates
|         : 10.25.2016 - 008: Updated updateCertEqListFromRenewal() to work on "Completed" renewals
|         : 08.08.2017 - 001: Added doCreateRefLP(), checks Application Review for previous Incomplete or Accepted status checkForExistingCertOfAuth()
|         : 08.28.2017 - 001: Updated createCertOfAuth() to handle existing Cert scenario. Need to enhance to update existing if found.
|         : 08.28.2017 - 002: Added checkForExistingCertOfAuth() that returns true if record is found and false if no record found
|         : 10.26.2017 - 001: Added updateRefLpFieldsForAca() that copies attribute field data to standard lp fields so the info is available in ACA
|         : 10.30.2017 - 001: Updated updateCertEqListFromRenewal() added updates to the RefLp InsuranceCo, ACAPermissions and the Certificate of Authority record status.
|         : 11.21.2017 - 001: Added assessRenewalLateFees() and getParentLicenseCapID().
|         : 11.27.2017 - 001: Updates to assessRenewalLateFees() and updateCertEqListFromRenewal().
|         : 12.01.2017 - 001: Commented out all lines populating bus lic and ins expiration from attr fields.
|         : 12.11.2017 - 001: Added updateRelationshipToAuthority()
|         : 12.11.2017 - 002: Updated updateCert() fixed typo and uncommented copyAddresses()
|         : 12.18.2017 - 001: Updated createCertOfAuth() added section for updating existing Certificate of Authority
|         : 12.18.2017 - 002: Added removeCapContacts() and removeCapAddresses()
|
/------------------------------------------------------------------------------------------------------*/

eval( aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput().getScriptByPK(aa.getServiceProviderCode(),"INCLUDES_LICENSES","ADMIN").getScriptText() + "");
eval( aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput().getScriptByPK(aa.getServiceProviderCode(),"INCLUDES_WEB_SERVICES","ADMIN").getScriptText() + "");

function createRefLicProf(rlpId,rlpType,pContactType) {
	//Creates/updates a reference licensed prof from a Contact
	//06SSP-00074, modified for 06SSP-00238
	var updating = false;
	var capContResult = aa.people.getCapContactByCapID(capId);
	if (capContResult.getSuccess()) {
		conArr = capContResult.getOutput();
	}
	else {
		logDebug ("**ERROR: getting cap contact: " + capAddResult.getErrorMessage());
		return false;
	}
	if (!conArr.length) {
		logDebug ("**WARNING: No contact available");
		return false;
	}
	var newLic = getRefLicenseProf(rlpId)

	if (newLic) {
		updating = true;
		logDebug("Updating existing Ref Lic Prof : " + rlpId);
	}
	else {
		var newLic = aa.licenseScript.createLicenseScriptModel();
	}
	//get contact record
	if (pContactType==null) {
		var cont = conArr[0]; //if no contact type specified, use first contact
	}
	else {
		var contFound = false;
		for (yy in conArr) {
			if (pContactType.equals(conArr[yy].getCapContactModel().getPeople().getContactType())) {
				cont = conArr[yy];
				contFound = true;
				break;
				}
			}
		if (!contFound) {
			logDebug ("**WARNING: No Contact found of type: "+pContactType);
			return false;
		}
	}
	peop = cont.getPeople();
	addr = peop.getCompactAddress();
	newLic.setContactFirstName(cont.getFirstName());
	//newLic.setContactMiddleName(cont.getMiddleName());  //method not available
	newLic.setContactLastName(cont.getLastName());
	newLic.setBusinessName(peop.getBusinessName());
	newLic.setAddress1(addr.getAddressLine1());
	newLic.setAddress2(addr.getAddressLine2());
	newLic.setAddress3(addr.getAddressLine3());
	newLic.setCity(addr.getCity());
	newLic.setState(addr.getState());
	newLic.setZip(addr.getZip());
	newLic.setPhone1(peop.getPhone1());
	newLic.setPhone2(peop.getPhone2());
	newLic.setEMailAddress(peop.getEmail());
	newLic.setFax(peop.getFax());
	newLic.setAgencyCode(aa.getServiceProviderCode());
	newLic.setAuditDate(sysDate);
	newLic.setAuditID(currentUserID);
	newLic.setAuditStatus("A");
	if (AInfo["Insurance Co"]){
		newLic.setInsuranceCo(AInfo["Insurance Co"]);
	}
	if (AInfo["Insurance Amount"]) {
		newLic.setInsuranceAmount(parseFloat(AInfo["Insurance Amount"]));
	}
	if (AInfo["Insurance Exp Date"]) {
		newLic.setInsuranceExpDate(aa.date.parseDate(AInfo["Insurance Exp Date"]));
	}
	if (AInfo["Policy #"]) {
		newLic.setPolicy(AInfo["Policy #"]);
	}
	if (AInfo["Business License #"]) {
		newLic.setBusinessLicense(AInfo["Business License #"]);
	}
	if (AInfo["Business License Exp Date"]) {
		newLic.setBusinessLicExpDate(aa.date.parseDate(AInfo["Business License Exp Date"]));
	}
	newLic.setLicenseType(rlpType);
	if(addr.getState() != null) {
		newLic.setLicState(addr.getState());
	}
	else {
		newLic.setLicState("AK"); //default the state if none was provided
	}
	newLic.setStateLicense(rlpId);
	if (updating) {
		myResult = aa.licenseScript.editRefLicenseProf(newLic);
	}
	else{
		myResult = aa.licenseScript.createRefLicenseProf(newLic);
	}
	if (myResult.getSuccess()) {
		logDebug("Successfully added/updated License No. " + rlpId + ", Type: " + rlpType);
		logMessage("Successfully added/updated License No. " + rlpId + ", Type: " + rlpType);
		return true;
	}
	else {
		logDebug("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage());
		logMessage("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage());
		return false;
	}
}

function createRefContactsFromCapContactsAndLink(pCapId, contactTypeArray, ignoreAttributeArray, replaceCapContact, overwriteRefContact, refContactExists)
	{

	// contactTypeArray is either null (all), or an array or contact types to process
	//
	// ignoreAttributeArray is either null (none), or an array of attributes to ignore when creating a REF contact
	//
	// replaceCapContact not implemented yet
	//
	// overwriteRefContact -- if true, will refresh linked ref contact with CAP contact data
	//
	// refContactExists is a function for REF contact comparisons.
	//
	// Version 2.0 Update:   This function will now check for the presence of a standard choice "REF_CONTACT_CREATION_RULES". 
	// This setting will determine if the reference contact will be created, as well as the contact type that the reference contact will 
	// be created with.  If this setting is configured, the contactTypeArray parameter will be ignored.   The "Default" in this standard
	// choice determines the default action of all contact types.   Other types can be configured separately.   
	// Each contact type can be set to "I" (create ref as individual), "O" (create ref as organization), 
	// "F" (follow the indiv/org flag on the cap contact), "D" (Do not create a ref contact), and "U" (create ref using transaction contact type).
	
	var standardChoiceForBusinessRules = "REF_CONTACT_CREATION_RULES";
	
	
	var ingoreArray = new Array();
	if (arguments.length > 1) ignoreArray = arguments[1];
	
	var defaultContactFlag = lookup(standardChoiceForBusinessRules,"Default");

	var c = aa.people.getCapContactByCapID(pCapId).getOutput()
	var cCopy = aa.people.getCapContactByCapID(pCapId).getOutput()  // must have two working datasets

	for (var i in c)
	   {
	   var ruleForRefContactType = "U"; // default behavior is create the ref contact using transaction contact type
	   var con = c[i];

	   var p = con.getPeople();
	   
	   var contactFlagForType = lookup(standardChoiceForBusinessRules,p.getContactType());
	   
	   if (!defaultContactFlag && !contactFlagForType) // standard choice not used for rules, check the array passed
	   	{
	   	if (contactTypeArray && !exists(p.getContactType(),contactTypeArray))
			continue;  // not in the contact type list.  Move along.
		}
	
	   if (!contactFlagForType && defaultContactFlag) // explicit contact type not used, use the default
	   	{
	   	ruleForRefContactType = defaultContactFlag;
	   	}
	   
	   if (contactFlagForType) // explicit contact type is indicated
	   	{
	   	ruleForRefContactType = contactFlagForType;
	   	}

	   if (ruleForRefContactType.equals("D"))
	   	continue;
	   	
	   var refContactType = "";
	   
	   switch(ruleForRefContactType)
	   	{
		   case "U":
		     refContactType = p.getContactType();
		     break;
		   case "I":
		     refContactType = "Individual";
		     break;
		   case "O":
		     refContactType = "Organization";
		     break;
		   case "F":
		     if (p.getContactTypeFlag() && p.getContactTypeFlag().equals("organization"))
		     	refContactType = "Organization";
		     else
		     	refContactType = "Individual";
		     break;
		}
	   
	   var refContactNum = con.getCapContactModel().getRefContactNumber();
	   
	   if (refContactNum)  // This is a reference contact.   Let's refresh or overwrite as requested in parms.
	   	{
	   	if (overwriteRefContact)
	   		{
	   		p.setContactSeqNumber(refContactNum);  // set the ref seq# to refresh
	   		p.setContactType(refContactType);
	   		
	   						var a = p.getAttributes();
			
							if (a)
								{
								var ai = a.iterator();
								while (ai.hasNext())
									{
									var xx = ai.next();
									xx.setContactNo(refContactNum);
									}
					}
					
	   		var r = aa.people.editPeopleWithAttribute(p,p.getAttributes());
	   		
			if (!r.getSuccess()) 
				logDebug("WARNING: couldn't refresh reference people : " + r.getErrorMessage()); 
			else
				logDebug("Successfully refreshed ref contact #" + refContactNum + " with CAP contact data"); 
			}
			
	   	if (replaceCapContact)
	   		{
				// To Be Implemented later.   Is there a use case?
			}
			
	   	}
	   	else  // user entered the contact freehand.   Let's create or link to ref contact.
	   	{
			var ccmSeq = p.getContactSeqNumber();

			var existingContact = refContactExists(p);  // Call the custom function to see if the REF contact exists

			var p = cCopy[i].getPeople();  // get a fresh version, had to mangle the first for the search

			if (existingContact)  // we found a match with our custom function.  Use this one.
				{
					refPeopleId = existingContact;
				}
			else  // did not find a match, let's create one
				{

				var a = p.getAttributes();

				if (a)
					{
					//
					// Clear unwanted attributes
					var ai = a.iterator();
					while (ai.hasNext())
						{
						var xx = ai.next();
						if (ignoreAttributeArray && exists(xx.getAttributeName().toUpperCase(),ignoreAttributeArray))
							ai.remove();
						}
					}
				
				p.setContactType(refContactType);
				var r = aa.people.createPeopleWithAttribute(p,a);

				if (!r.getSuccess())
					{logDebug("WARNING: couldn't create reference people : " + r.getErrorMessage()); continue; }

				//
				// createPeople is nice and updates the sequence number to the ref seq
				//

				var p = cCopy[i].getPeople();
				var refPeopleId = p.getContactSeqNumber();

				logDebug("Successfully created reference contact #" + refPeopleId);
				
				// Need to link to an existing public user.
				
			    var getUserResult = aa.publicUser.getPublicUserByEmail(con.getEmail())
			    if (getUserResult.getSuccess() && getUserResult.getOutput()) {
			        var userModel = getUserResult.getOutput();
			        logDebug("createRefContactsFromCapContactsAndLink: Found an existing public user: " + userModel.getUserID());
					
					if (refPeopleId)	{
						logDebug("createRefContactsFromCapContactsAndLink: Linking this public user with new reference contact : " + refPeopleId);
						aa.licenseScript.associateContactWithPublicUser(userModel.getUserSeqNum(), refPeopleId);
						}
					}
				}

			//
			// now that we have the reference Id, we can link back to reference
			//

		    var ccm = aa.people.getCapContactByPK(pCapId,ccmSeq).getOutput().getCapContactModel();

		    ccm.setRefContactNumber(refPeopleId);
		    r = aa.people.editCapContact(ccm);

		    if (!r.getSuccess())
				{ logDebug("WARNING: error updating cap contact model : " + r.getErrorMessage()); }
			else
				{ logDebug("Successfully linked ref contact " + refPeopleId + " to cap contact " + ccmSeq);}


	    }  // end if user hand entered contact 
	}  // end for each CAP contact
} // end function

function checklistSatisfied(gName) { 

	var retValue = false;
	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(capId);
	if (appSpecInfoResult.getSuccess()) {
		var appspecArr = appSpecInfoResult.getOutput();

		if (appspecArr) {
			retValue = true;
			for (i in appspecArr) {
				var appspecItem = appspecArr[i];
				var appSpecGroup = "" + appspecItem.getCheckboxType();
				if (appSpecGroup == gName) {
					if (!matches(("" + appspecItem.getChecklistComment()), "Met", "NA", "N/A", "Not Required")) 
						return false;
				}
			}
		}
	}
	else {
		logDebug("Error getting app spec info " + appSpecInfoResult.getErrorMessage());
	}
	return retValue;
}

function createLicenseParent(grp,typ,stype,cat,desc) { // creates the new application and returns the capID object
	var appCreateResult = aa.cap.createAppRegardlessAppTypeStatus(grp,typ,stype,cat,desc);
	logDebug("creating cap " + grp + "/" + typ + "/" + stype + "/" + cat);
	if (appCreateResult.getSuccess()) {
		var newId = appCreateResult.getOutput();
		logDebug("cap " + grp + "/" + typ + "/" + stype + "/" + cat + " created successfully ");
		
		// create Detail Record
		capModel = aa.cap.newCapScriptModel().getOutput();
		capDetailModel = capModel.getCapModel().getCapDetailModel();
		capDetailModel.setCapID(newId);
		aa.cap.createCapDetail(capDetailModel);

		var newObj = aa.cap.getCap(newId).getOutput();	//Cap object
		var result = aa.cap.createAppHierarchy(newId, capId); 
		if (result.getSuccess()) {
			logDebug("Parent application successfully linked");
		}
		else {
			logDebug("Could not link applications");
		}
		// Copy Parcels

		var capParcelResult = aa.parcel.getParcelandAttribute(capId,null);
		if (capParcelResult.getSuccess()) {
			var Parcels = capParcelResult.getOutput().toArray();
			for (zz in Parcels) {
				logDebug("adding parcel #" + zz + " = " + Parcels[zz].getParcelNumber());
				var newCapParcel = aa.parcel.getCapParcelModel().getOutput();
				newCapParcel.setParcelModel(Parcels[zz]);
				newCapParcel.setCapIDModel(newId);
				newCapParcel.setL1ParcelNo(Parcels[zz].getParcelNumber());
				newCapParcel.setParcelNo(Parcels[zz].getParcelNumber());
				aa.parcel.createCapParcel(newCapParcel);
			}
		}

		// Copy Contacts
		var capPeoples = getPeople(capId);
		if (capPeoples != null && capPeoples.length > 0) {
			for (loopk in capPeoples) {
				sourcePeopleModel = capPeoples[loopk];
				sourcePeopleModel.getCapContactModel().setCapID(newId);
				aa.people.createCapContactWithAttribute(sourcePeopleModel.getCapContactModel());
				logDebug("added contact");
			}
		}

		// Copy Addresses
		capAddressResult = aa.address.getAddressByCapId(capId);
		if (capAddressResult.getSuccess()) {
			Address = capAddressResult.getOutput();
			for (yy in Address) {
				newAddress = Address[yy];
				newAddress.setCapID(newId);
				aa.address.createAddress(newAddress);
				logDebug("added address");
			}
		}
		return newId;
	}
	else {
		logDebug( "**ERROR: adding parent App: " + appCreateResult.getErrorMessage());
	}
}

function copyContactsWithAddresses(sourceCapId, targetCapId) {
	
	var capPeoples = getPeople(capId);
	if (capPeoples != null && capPeoples.length > 0) {
		for (loopk in capPeoples) {
			sourcePeopleModel = capPeoples[loopk];
			sourcePeopleModel.getCapContactModel().setCapID(targetCapId);
			aa.people.createCapContactWithAttribute(sourcePeopleModel.getCapContactModel());
			logDebug("added contact");
		}
	}
	else {
		aa.print("No peoples on source");
	}
}

function getPeople(capId) {
	capPeopleArr = null;
	var s_result = aa.people.getCapContactByCapID(capId);
	if(s_result.getSuccess())
	{
		capPeopleArr = s_result.getOutput();
		if(capPeopleArr != null || capPeopleArr.length > 0)
		{
			for (loopk in capPeopleArr)	
			{
				var capContactScriptModel = capPeopleArr[loopk];
				var capContactModel = capContactScriptModel.getCapContactModel();
				var peopleModel = capContactScriptModel.getPeople();
				var contactAddressrs = aa.address.getContactAddressListByCapContact(capContactModel);
				if (contactAddressrs.getSuccess())
				{
					var contactAddressModelArr = convertContactAddressModelArr(contactAddressrs.getOutput());
					peopleModel.setContactAddressList(contactAddressModelArr);    
				}
			}
		}
		
		else
		{
			capPeopleArr = null;
		}
	}
	else
	{
		aa.print("ERROR: Failed to People: " + s_result.getErrorMessage());
		capPeopleArr = null;	
	}
	return capPeopleArr;
}

function doesRecordExist(appNum) {
	var getCapResult = aa.cap.getCapID(appNum);
	if (getCapResult.getSuccess()) {
		var resObj = getCapResult.getOutput();
		if (resObj != null) return true;
	}
	return false;
}	

function editAddressOfLicenseHolder(aType, licCapId, addr1, addr2, city, state, zip, phone) {

	var conToChange = null; 
	consResult = aa.people.getCapContactByCapID(licCapId);
	if (consResult.getSuccess()) {
		cons = consResult.getOutput();
		for (thisCon in cons) {
			if (cons[thisCon].getCapContactModel().getPeople().getContactType() == "License Holder") { 
				conToChange = cons[thisCon].getCapContactModel(); 
				p = conToChange.getPeople(); 
				contactAddressListResult = aa.address.getContactAddressListByCapContact(conToChange);
				if (contactAddressListResult.getSuccess()) { 
					contactAddressList = contactAddressListResult.getOutput();
					for (var x in contactAddressList) {
						cal= contactAddressList[x];
						addrType = "" + cal.getAddressType();
						if (addrType == aType) {
							contactAddressID = cal.getAddressID();
							cResult = aa.address.getContactAddressByPK(cal.getContactAddressModel());
							if (cResult.getSuccess()) {
								casm = cResult.getOutput();
								casm.setAddressLine1(addr1);
								casm.setAddressLine2(addr2);
								casm.setCity(city);
								casm.setState(state);
								casm.setZip(zip);
								casm.setPhone(phone);
								aa.address.editContactAddress(casm.getContactAddressModel());
							}
						}
					}	
					convertedContactAddressList = convertContactAddressModelArr(contactAddressList);
					p.setContactAddressList(convertedContactAddressList);
					conToChange.setPeople(p); 
					aa.people.editCapContactWithAttribute(conToChange);
				}
			}
		}
	}
}

function editAddressOfContact(cType, aType, licCapId, addr1, addr2, city, state, zip) {
	// edits or adds an address to a contact of the specified type
	var conToChange = null; 
	consResult = aa.people.getCapContactByCapID(licCapId);
	if (consResult.getSuccess()) {
		cons = consResult.getOutput();
		for (thisCon in cons) {
			if (cons[thisCon].getCapContactModel().getPeople().getContactType() == cType) { 
				conToChange = cons[thisCon].getCapContactModel(); 
				contactNbr = conToChange.getContactSeqNumber(); 
				refContactNbr = conToChange.getRefContactNumber();  
				p = conToChange.getPeople(); 
				contactAddressListResult = aa.address.getContactAddressListByCapContact(conToChange);
				if (contactAddressListResult.getSuccess()) { 
					contactAddressList = contactAddressListResult.getOutput();
					foundAddressType = false;
					for (var x in contactAddressList) {
						cal= contactAddressList[x];
						addrType = cal.getAddressType();
						if (addrType == aType) {
							foundAddressType = true;
							contactAddressID = cal.getAddressID();
							cResult = aa.address.getContactAddressByPK(cal.getContactAddressModel());
							if (cResult.getSuccess()) {
								casm = cResult.getOutput(); // contactAddressScriptModel
								casm.setAddressLine1(addr1);
								casm.setAddressLine2(addr2);
								casm.setCity(city);
								casm.setState(state);
								casm.setZip(zip);
								aa.address.editContactAddress(casm.getContactAddressModel());
							}
						}
					}
					convertedContactAddressList = convertContactAddressModelArr(contactAddressList);
					if (foundAddressType) {
						p.setContactAddressList(convertedContactAddressList);
						conToChange.setPeople(p); 
						editResult = aa.people.editCapContactWithAttribute(conToChange);
						if (!editResult.getSuccess()) logDebug("error modifying existing contact : " + editResult.getErrorMessage());
					}
					else {	// address doesn't exist, create a new one
						var newadd = aa.proxyInvoker.newInstance("com.accela.orm.model.address.ContactAddressModel").getOutput();
    						newadd.setEntityType("CONTACT");
						newadd.setEntityID(parseFloat(contactNbr));
						newadd.setAddressType(aType);
    						newadd.setAddressLine1(addr1);
    						newadd.setAddressLine2(addr2);
    						newadd.setCity(city);
   						newadd.setState(state);
    						newadd.setZip(zip);
						//newadd.setPhone(phone);
						createResult = aa.address.createCapContactAddress(licCapId, newadd);
						if (createResult.getSuccess()) {
							newAddrObj = createResult.getOutput();
							if (newAddrObj != null) {
								cam = newAddrObj.getContactAddressModel();
								auditModel = cam.getAuditModel();
								caPKModel = cam.getContactAddressPK();
								newadd.setAuditModel(auditModel);
								newadd.setContactAddressPK(caPKModel);
								newContactAddrList = aa.util.newArrayList();
								for (loopk in contactAddressList) newContactAddrList.add(contactAddressList[loopk].getContactAddressModel());
								newContactAddrList.add(newadd);
								p.setContactAddressList(newContactAddrList);
								conToChange.setPeople(p); 
								editResult = aa.people.editCapContactWithAttribute(conToChange);
								if (!editResult.getSuccess()) logDebug("error adding a new address to a contact : " + editResult.getErrorMessage());
							}
						}
						else {
							logDebug("Error creating a new cap contact address " + createResult.getErrorMessage());
						}
					}
				}
			}
		}
	}
}

function invoiceAllFees() { 

    var feeFound=false; 
    var fperiod = "STANDARD";
    getFeeResult = aa.finance.getFeeItemByCapID(capId); 
    if (getFeeResult.getSuccess()) { 
        var feeList = getFeeResult.getOutput(); 
        for (feeNum in feeList) 
			if (feeList[feeNum].getFeeitemStatus().equals("NEW")) { 
				var feeSeq = feeList[feeNum].getFeeSeqNbr(); 
				feeSeqList.push(feeSeq); 
				paymentPeriodList.push(fperiod); 
                feeFound=true;
            } 
        } 
    else { 
    	logDebug( "**ERROR: getting fee items " + getFeeResult.getErrorMessage())
    } 
    return feeFound; 
}  

function updateFeeFromASI (ASIField, FeeCode, FeeSchedule) {
	var ASIField;
	var FeeCode;
	var FeeSchedule;
	logDebug("updateFeeFromASI Function: ASI Field = " + ASIField + "; Fee Code = " + FeeCode + "; Fee Schedule: " + FeeSchedule);
	if (arguments.length == 3) 
		{
		ASIField = arguments[0]; // ASI Field to get the value from
		FeeCode = arguments[1]; // Fee code to update
		FeeSchedule = arguments[2]; // Fee Scheulde for Fee Code
		}
	else {
		logDebug("Not enought arguments passed to the function: updateFeeFromASI");
	}
	var tmpASIQty = getAppSpecific(ASIField)
	
	//Check to see if the ASI Field has a value. If so, then check to see if the fee exists.
	if ((tmpASIQty != null) && (tmpASIQty > 0)) {
		logDebug("ASI Field: " + ASIField + " was found and has a positive value. Attempting to update fee information.");
		//If fee already exist and the amount is different than the ASIQty, void or remove it before adding the new qty.
		if (feeExists(FeeCode) && (tmpASIQty != getFeeQty(FeeCode))) {
			logDebug("Existing fee found with quanity: " + getFeeQty(FeeCode) + ". New Quantity is: " + tmpASIQty);
			voidRemoveFees(FeeCode)
			//Add the new fee from ASI quanity.
			updateFee(FeeCode,FeeSchedule,"FINAL",tmpASIQty,"Y");
			logDebug("Fee information has been modified.");
		}
		else if (feeExists(FeeCode) && (tmpASIQty == getFeeQty(FeeCode))) {
			logDebug("Existing fee found with quanity: " + getFeeQty(FeeCode) + ". New Quantity is: " + tmpASIQty + ". No changes are being made to fee.");
			}
		//No existing fee is found, add the new fee
		if (feeExists(FeeCode) != true) {
			updateFee(FeeCode,FeeSchedule,"FINAL",tmpASIQty,"Y");
			logDebug("Fee information has been modified.");
		}
	}
	//ASI Field doesn't exist or has a value <= 0.
	else {
		logDebug("ASI Field: " + ASIField + " is not found or has a value <= 0.")
		//Check to see if a fee for the ASI item exists. No fee should be present, but check anyways.
		if (feeExists(FeeCode)) {
			//Fee is found and should be voided or removed.
			voidRemoveFees(FeeCode)
		}
		
	}
}

function voidRemoveFees(vFeeCode) {
	var feeSeqArray = new Array();
	var invoiceNbrArray = new Array();
	var feeAllocationArray = new Array();
    var itemCap = capId;
    if (arguments.length > 1) {
        itemCap = arguments[1];
    }
 	// for each fee found
	//  	  if the fee is "NEW" remove it
	//  	  if the fee is "INVOICED" void it and invoice the void
	//
	var targetFees = loadFees(itemCap);

	for (tFeeNum in targetFees) {
		targetFee = targetFees[tFeeNum];
		if (targetFee.code.equals(vFeeCode)) { // only remove invoiced or new fees, however at this stage all AE fees should be invoiced.
			if (targetFee.status == "INVOICED") {
				var editResult = aa.finance.voidFeeItem(itemCap, targetFee.sequence);
				if (editResult.getSuccess()){
					logDebug("Voided existing Fee Item: " + targetFee.code);
				}
				else { 
					logDebug( "**ERROR: voiding fee item (" + targetFee.code + "): " + editResult.getErrorMessage());
					return false;
				}

				var feeSeqArray = new Array();
				var paymentPeriodArray = new Array();

				feeSeqArray.push(targetFee.sequence);
				paymentPeriodArray.push(targetFee.period);
				var invoiceResult_L = aa.finance.createInvoice(itemCap, feeSeqArray, paymentPeriodArray);

				if (!invoiceResult_L.getSuccess()) {
					logDebug("**ERROR: Invoicing the fee items voided " + thisFee.code + " was not successful.  Reason: " +  invoiceResult_L.getErrorMessage());
					return false;
				}
			}
			if (targetFee.status == "NEW") { // delete the fee
				var editResult = aa.finance.removeFeeItem(itemCap, targetFee.sequence);
				if (editResult.getSuccess()) {
					logDebug("Removed existing Fee Item: " + targetFee.code);
				}
				else {
					logDebug( "**ERROR: removing fee item (" + targetFee.code + "): " + editResult.getErrorMessage());
					return false;
				}
			}
		} // each matching fee
	}  // each  fee
}  // function
	
function getFeeQty(FeeCode) {
	var feeA = loadFees(capId);
	var tmpFeeTotQty = 0;

	for (x in feeA){
		thisFee = feeA[x];

		if (thisFee.code == FeeCode && (thisFee.status == "INVOICED" || thisFee.status == "NEW")){
			tmpFeeTotQty = tmpFeeTotQty + thisFee.unit;
		}
	}
	return tmpFeeTotQty;
}

function closeWorkflow() { //optional capId

	var itemCap = capId;
	if (arguments.length > 0)
		itemCap = arguments[0];

	// closes all tasks of a workflow. DOES NOT handleDisposition.
	var taskArray = new Array();

	var workflowResult = aa.workflow.getTasks(itemCap);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else { 
		logMessage("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage()); 
		return false; 
		}
	
	var fTask;
	var stepnumber;
	var wftask;
	
	for (i in wfObj) {
   	fTask = wfObj[i];
		wftask = fTask.getTaskDescription();
		stepnumber = fTask.getStepNumber();
		completeFlag = fTask.getCompleteFlag();
		aa.workflow.adjustTask(itemCap,stepnumber,"N", completeFlag, null, null);
		logMessage("Closing Workflow Task " + wftask);
		logDebug("Closing Workflow Task " + wftask);
	}
}

function feeTotalByStatus(feeStatus) {
	var statusArray = new Array(); 
	if (arguments.length > 0) {
		for (var i=0; i<arguments.length; i++)
			statusArray.push(arguments[i]);
	}
        
	var feeTotal = 0;
	var feeResult=aa.fee.getFeeItems(capId);
	if (feeResult.getSuccess()) { 
		var feeObjArr = feeResult.getOutput(); 
		for (ff in feeObjArr) {
                        feeStatus = "" + feeObjArr[ff].getFeeitemStatus();
			if (exists(feeStatus,statusArray)) 
				feeTotal+=feeObjArr[ff].getFee();
                        
		}

	}
	else { 
		logDebug( "Error getting fee items: " + feeResult.getErrorMessage()); 
	}
	return feeTotal;
}

function updateRecordRelation(recA, recB, mod) {
	capA = aa.cap.getCapID(recA).getOutput()
	capB = aa.cap.getCapID(recB).getOutput()
	if (capA == null || capB == null ) {
		logDebug("Cannot update relation between "+recA+" and "+recB+" because they do not both exist")
		return false
	}
	switch((""+mod).toUpperCase()) {
	case "ADDITION":
		linkResult = aa.cap.createAppHierarchy(capA, capB);
		return linkResult.getSuccess()
	case "REMOVE":
		linkResult = aa.cap.removeAppHierarchy(capA, capB);
		return linkResult.getSuccess()
	}
	return false
}

function editNameOfContact(cType, lCapId, fName, mName, lName, oName, dbaName) {
	
	var conToChange = null; 
	consResult = aa.people.getCapContactByCapID(lCapId);
	if (consResult.getSuccess()) {
		cons = consResult.getOutput();
		for (thisCon in cons) {
			if (cons[thisCon].getCapContactModel().getPeople().getContactType() == cType) { 
				conToChange = cons[thisCon].getCapContactModel(); 
				contactTypeFlag = conToChange.getContactTypeFlag();
				if (contactTypeFlag == "individual") {
					conToChange.setFirstName(fName);
					conToChange.setLastName(lName);
					conToChange.setMiddleName(mName);
				}
				else {
					conToChange.setBusinessName(oName);
					conToChange.setTradeName(dbaName);
				}
				editResult = aa.people.editCapContactWithAttribute(conToChange);
				if (!editResult.getSuccess()) logDebug("error modifying existing contact : " + editResult.getErrorMessage());
			}
		}
	}
}

function removeExistingReleations(itemCap) {// remove the parents from the caps !
   getCapResult = aa.cap.getProjectParents(itemCap, 0);
   if (getCapResult.getSuccess())
   {
      parentArray = getCapResult.getOutput();
	  for( i=0;i<parentArray.length;i++){
		  var linkResult = aa.cap.removeAppHierarchy(parentArray[i].getCapID(), itemCap);
		  if (linkResult.getSuccess())
			logDebug("Successfully removed from Parent Application : " + parentArray[i].getCapID().getCustomID());
		else
			logDebug( "**ERROR: removing from parent application parent cap id (" + parentArray[i].getCapID().getCustomID() + "): " + linkResult.getErrorMessage());
	  }
   }
}

/**
 * @desc This method determines if the specified workflow task is at the specified workflow status
 * @param {string} wfstr - contains the task name
 * @param {string} wfstat - contains the task status
 * @param {object} capId - contains the cap id of the CAP record
 */

function isTaskStatus(wfstr,wfstat,capId) {
   var workflowResult = aa.workflow.getTasks(capId);
   if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else
    { 
        ELPLogging.notify(errorPrefix + ": Failed to get workflow object: " + s_capResult.getErrorMessage()); 
        return false; 
    }
    
    for (i in wfObj)
    {
        fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()))
        {
            if (fTask.getDisposition()!=null)
            {
                if (fTask.getDisposition().toUpperCase().equals(wfstat.toUpperCase()))
                {
                    return true;
                }
                else
                {
                    return false;
                }
            }
        }
    }
    return false;
}

function sumASITColumn(tObj, cNameToSum) { // tObj = variable for loadASITable(), cNameToSum = ASIT column name to sum
	// 03.02.2015 CG updated to evaluate 0,1 or 2 columns: optional params = cFilterType, cNameFilter, cValueFilter, cFilterType2, cNameFilter2, cValueFilter2
	var retValue = 0;
	if (tObj) {
		if (arguments.length == 2) { // no filters
			for (var ea in tObj) {
				var row = tObj[ea];
				var colValue = row[cNameToSum].fieldValue;
				if (!isNaN(parseFloat(colValue))) 
					retValue += parseFloat(colValue);
			}
			return retValue;
		}
		if (arguments.length == 5) { // evaluate 1 column
			filterType = arguments[2];
			cNameFilter = arguments[3];
			cValueFilter = arguments[4];
			for (var ea in tObj) {
				var row = tObj[ea];
				var colValue = row[cNameToSum].fieldValue;
				var colFilter = row[cNameFilter].fieldValue;
				if (filterType == "INCLUDE") {
					if (colFilter == cValueFilter) {
						if (!isNaN(parseFloat(colValue))) 
							retValue += parseFloat(colValue);
					}
				}
				if (filterType == "EXCLUDE") {
					if (colFilter != cValueFilter) {
						if (!isNaN(parseFloat(colValue))) 
							retValue += parseFloat(colValue);
					}
				}
			}
			return retValue;
		}
		if (arguments.length == 8) { // evaluate 2 columns
			filterType = arguments[2];
			cNameFilter = arguments[3];
			cValueFilter = arguments[4];
			filterType2 = arguments[5];
			cNameFilter2 = arguments[6];
			cValueFilter2 = arguments[7];
			for (var ea in tObj) {
				var row = tObj[ea];
				var colValue = row[cNameToSum].fieldValue;
				var colFilter = row[cNameFilter].fieldValue;
				var colFilter2 = row[cNameFilter2].fieldValue;
				if ((filterType == "INCLUDE") && (filterType2 == "INCLUDE")) {
					if ((colFilter == cValueFilter) && (colFilter2 == cValueFilter2)) {
						if (!isNaN(parseFloat(colValue))) 
							retValue += parseFloat(colValue);
					}
				}
				if ((filterType == "INCLUDE") && (filterType2 == "EXCLUDE")) {
					if ((colFilter == cValueFilter) && (colFilter2 != cValueFilter2)) {
						if (!isNaN(parseFloat(colValue))) 
							retValue += parseFloat(colValue);
					}
				}
				if ((filterType == "EXCLUDE") && (filterType2 == "EXCLUDE")) {
					if ((colFilter != cValueFilter) && (colFilter2 != cValueFilter2)) {
						if (!isNaN(parseFloat(colValue))) 
							retValue += parseFloat(colValue);
					}
				}
				if ((filterType == "EXCLUDE") && (filterType2 == "INCLUDE")) {
					if ((colFilter != cValueFilter) && (colFilter2 == cValueFilter2)) {
						if (!isNaN(parseFloat(colValue))) 
							retValue += parseFloat(colValue);
					}
				}
			}
			return retValue;
		}
	}
}

function countASITRows(tObj) {//CG 12.17.2015 -- optional parameters = cName, filterType, cValue, cName2, filterType2, cValue2
	var rowCount = 0;
	if (tObj) {
		if (arguments.length == 1) {
			rowCount = tObj.rows.length;
			return rowCount;
		}
		if (arguments.length == 4) { // count rows with 1 criteria
			cName = arguments[1];
			filterType = arguments[2];
			cValue = arguments[3];
			for (var ea in tObj) {
				var row = tObj[ea];
				var colValue = row[cName].fieldValue;
				if (filterType == "INCLUDE") {
					if (colValue == cValue) {
						rowCount += 1;
					}
				}
				if (filterType == "EXCLUDE") {
					if (colValue != cValue) {
						rowCount += 1;
					}
				}
			}
		return rowCount;
		}
		if (arguments.length == 7) { // count rows with 2 criteria -- cName, filterType, cValue, cName2, filterType2, cValue2
			cName = arguments[1];
			filterType = arguments[2];
			cValue = arguments[3];
			cName2 = arguments[4];
			filterType2 = arguments[5];
			cValue2 = arguments[6];
			for (var ea in tObj) {
				var row = tObj[ea];
				var colValue = row[cName].fieldValue;
				var colValue2 = row[cName2].fieldValue;
				if (filterType == "INCLUDE") {
					if (filterType2 == "INCLUDE") {
						if (colValue == cValue && colValue2 == cValue2) {
							rowCount += 1;
						}
					}
					if (filterType2 == "EXCLUDE") {
						if (colValue == cValue && colValue2 != cValue2) {
							rowCount += 1;
						}
					}
				}	
				if (filterType == "EXCLUDE") {
					if (filterType2 == "INCLUDE") {
						if (colValue != cValue && colValue2 == cValue2) {
							rowCount += 1;
						}
					}
					if (filterType2 == "EXCLUDE") {
						if (colValue != cValue && colValue2 != cValue2) {
							rowCount += 1;
						}
					}
				}
			}
		return rowCount;
		}
	}
}

function getStatusDateinTaskHistory(tName, sName) {
	histResult = aa.workflow.getWorkflowHistory(capId, tName, null);
	if (histResult.getSuccess()) {
		var taskHistArr = histResult.getOutput();
		taskHistArr.sort(compareStatusDateDesc);
		for (var xx in taskHistArr) {
			taskHist = taskHistArr[xx];
			statusDate = taskHist.getStatusDate();
			//aa.print(taskHist.getDisposition() + ":" + statusDate);
			if ( (""+ taskHist.getDisposition()) == sName)
				return statusDate;
		}
	}
	return null;
}

function compareStatusDateDesc(a,b) {
	if (a.getStatusDate() == null && b.getStatusDate() == null) return 0;
	if (a.getStatusDate() == null && b.getStatusDate() != null) return 1;
	if (a.getStatusDate() != null && b.getStatusDate() == null) return -1;
	return b.getStatusDate().compareTo(a.getStatusDate());
}

function editPhoneOfLicenseHolder(aType, licCapId, homePhoneNumber, mobilePhoneNumber, businessPhoneNumber) {
	var conToChange = null; 
	consResult = aa.people.getCapContactByCapID(licCapId);
	if (consResult.getSuccess()) {
		cons = consResult.getOutput();
		for (thisCon in cons) {
			if (cons[thisCon].getCapContactModel().getPeople().getContactType() == aType) { 
				conToChange = cons[thisCon].getCapContactModel(); 
				conToChange.setPhone1(homePhoneNumber);
				conToChange.setPhone2(mobilePhoneNumber);
				conToChange.setPhone3(businessPhoneNumber);
				aa.people.editCapContact(conToChange);
			}
		}
	}
}

function numberOfSitesByProjectType(projectType){
 var numberOfSites = 0;
	for (var i = PROJECTTYPE.length - 1; i >= 0; i--) {
		if (PROJECTTYPE[i]["Project Type"] == projectType && parseInt(PROJECTTYPE[i]["No. of Sites"])> 0){
			numberOfSites +=  parseInt(PROJECTTYPE[i]["No. of Sites"]);
		}
	}
	return numberOfSites
}

function getFeeAmount(FeeCode) {
	var feeA = loadFees(capId);
	var tmpFeeTotAmount = 0;

	for (x in feeA){
		thisFee = feeA[x];

		if (thisFee.code == FeeCode && (thisFee.status == "INVOICED" || thisFee.status == "NEW")){
			tmpFeeTotAmount = tmpFeeTotAmount + thisFee.amount;
		}
	}
	return tmpFeeTotAmount;
}

function updateFeeFromASIandUpdateASIFeeAndTotal (ASIField, FeeCode, FeeSchedule) {
	var ASIField;
	var FeeCode;
	var FeeSchedule;
	logDebug("updateFeeFromASI Function: ASI Field = " + ASIField + "; Fee Code = " + FeeCode + "; Fee Schedule: " + FeeSchedule);
	if (arguments.length == 3) {
		ASIField = arguments[0]; // ASI Field to get the value from
		FeeCode = arguments[1]; // Fee code to update
		FeeSchedule = arguments[2]; // Fee Scheulde for Fee Code
	}
	else {
		logDebug("Not enought arguments passed to the function: updateFeeFromASIandUpdateASIFeeAndTotal");
	}
	var tmpASIQty = getAppSpecific(ASIField)
	//Check to see if the ASI Field has a value. If so, then check to see if the fee exists.
	if ((tmpASIQty != null) && (tmpASIQty > 0)) {
		logDebug("ASI Field: " + ASIField + " was found and has a positive value. Attempting to update fee information.");
		//If fee already exist and the amount is different than the ASIQty, void or remove it before adding the new qty.
		if (feeExists(FeeCode) && (tmpASIQty != getFeeQty(FeeCode))) {
			logDebug("Existing fee found with quanity: " + getFeeQty(FeeCode) + ". New Quantity is: " + tmpASIQty);
			voidRemoveFees(FeeCode)
			//Add the new fee from ASI quanity.
			updateFee(FeeCode,FeeSchedule,"FINAL",tmpASIQty,"N","Y");
			logDebug("Fee information has been modified.");
		}
		else if (feeExists(FeeCode) && (tmpASIQty == getFeeQty(FeeCode))) {
			logDebug("Existing fee found with quanity: " + getFeeQty(FeeCode) + ". New Quantity is: " + tmpASIQty + ". No changes are being made to fee.");
		}
		//No existing fee is found, add the new fee
		if (feeExists(FeeCode) != true) {
			updateFee(FeeCode,FeeSchedule,"FINAL",tmpASIQty,"N","Y");
			logDebug("Fee information has been modified.");
		}
	}
	//ASI Field doesn't exist or has a value <= 0.
	else {
		logDebug("ASI Field: " + ASIField + " is not found or has a value <= 0.")
		//Check to see if a fee for the ASI item exists. No fee should be present, but check anyways.
		if (feeExists(FeeCode)) {
			//Fee is found and should be voided or removed.
			voidRemoveFees(FeeCode)
		}
	}
	var feeAmount= getFeeAmount(FeeCode);
    var currCost = 0;
	if(tmpASIQty){
		currCost = isNaN(tmpASIQty)? 0 : feeAmount/tmpASIQty;
	}
	editAppSpecific(ASIField+ " Cost", currCost);
	editAppSpecific(ASIField+ " Fee", feeAmount);
	editAppSpecific(ASIField+ " cost", currCost);
	editAppSpecific(ASIField+ " fee", feeAmount);
}

function updateFeeFromASIandUpdateASIFeeAndTotalInvoice(ASIField, FeeCode, FeeSchedule) {
	var ASIField;
	var FeeCode;
	var FeeSchedule;
	logDebug("updateFeeFromASI Function: ASI Field = " + ASIField + "; Fee Code = " + FeeCode + "; Fee Schedule: " + FeeSchedule);
	if (arguments.length == 3) 
		{
		ASIField = arguments[0]; // ASI Field to get the value from
		FeeCode = arguments[1]; // Fee code to update
		FeeSchedule = arguments[2]; // Fee Scheulde for Fee Code
		}
	else {
		logDebug("Not enought arguments passed to the function: updateFeeFromASIandUpdateASIFeeAndTotal");
	}
	var tmpASIQty = getAppSpecific(ASIField)
	
	//Check to see if the ASI Field has a value. If so, then check to see if the fee exists.
	if ((tmpASIQty != null) && (tmpASIQty > 0)) {
		logDebug("ASI Field: " + ASIField + " was found and has a positive value. Attempting to update fee information.");
		//If fee already exist and the amount is different than the ASIQty, void or remove it before adding the new qty.
		if (feeExists(FeeCode) && (tmpASIQty != getFeeQty(FeeCode))) {
			logDebug("Existing fee found with quanity: " + getFeeQty(FeeCode) + ". New Quantity is: " + tmpASIQty);
			voidRemoveFees(FeeCode)
			//Add the new fee from ASI quanity.
			updateFee(FeeCode,FeeSchedule,"FINAL",tmpASIQty,"Y");
			logDebug("Fee information has been modified.");
		}
		else if (feeExists(FeeCode) && (tmpASIQty == getFeeQty(FeeCode))) {
			logDebug("Existing fee found with quanity: " + getFeeQty(FeeCode) + ". New Quantity is: " + tmpASIQty + ". No changes are being made to fee.");
			}
		//No existing fee is found, add the new fee
		if (feeExists(FeeCode) != true) {
			updateFee(FeeCode,FeeSchedule,"FINAL",tmpASIQty,"Y");
			logDebug("Fee information has been modified.");
		}
	}
	//ASI Field doesn't exist or has a value <= 0.
	else {
		logDebug("ASI Field: " + ASIField + " is not found or has a value <= 0.")
		//Check to see if a fee for the ASI item exists. No fee should be present, but check anyways.
		if (feeExists(FeeCode)) {
			//Fee is found and should be voided or removed.
			voidRemoveFees(FeeCode)
		}
	}
	var feeAmount= getFeeAmount(FeeCode);

        var currCost = 0;
	if(tmpASIQty){
	       currCost = isNaN(tmpASIQty)? 0 : feeAmount/tmpASIQty;
	}
       
	editAppSpecific(ASIField+ " Cost", currCost);
	editAppSpecific(ASIField+ " Fee", feeAmount);
        editAppSpecific(ASIField+ " cost", currCost);
	editAppSpecific(ASIField+ " fee", feeAmount);
}

function assessDecalFee() {
	//Application for Authority Approval date
	approvDate = getStatusDateinTaskHistory("Compliance Review", "Compliance Approved");

	if (approvDate != null) {
		var approvDateYear = 1900 + approvDate.getYear();
		var approvJSDate = new Date((approvDate.getMonth() +1) + "/" + approvDate.getDay() + "/" + approvDateYear);
	}
	//Update Equipment List Approved - Update Fees date
	updateFeesDate = getStatusDateinTaskHistory("Application Review", "Approved - Update Fees");
	
	if (updateFeesDate != null) {
		var updateFeesYear = 1900 + updateFeesDate.getYear();
		var updateFeesJSDate = new Date((updateFeesDate.getMonth() +1) + "/" + updateFeesDate.getDay() + "/" + updateFeesYear);
	}
	//Update Equipment List ASIT submit
	/*
	if (todayDate != null) {
		var todayDateYear = 1900 + todayDate.getYear();
		var todayDateJSDate = new Date((todayDate.getMonth() +1) + "/" + todayDate.getDay() + "/" + todayDateYear);
	}
	*/
	//set $50 fee date range for Application for Authority
	startJSDate = new Date("06/30/" + approvDateYear);
	endJSDate = new Date("10/31/" + approvDateYear);
	//set $50 fee date range for Update Equipment List
	startJSDate2 = new Date("06/30/" + updateFeesYear);
	endJSDate2 = new Date("10/31/" + updateFeesYear);
	//set $50 fee date range for Update Equipment List ACA
	/*
	startJSDate3 = new Date("06/30/" + todayDateYear);
	endJSDate3 = new Date("10/31/" + todayDateYear);
	*/
	feeAmt = 0;
	equipTable = loadASITable("EQUIPMENT LIST");

	if ((approvJSDate > startJSDate && approvJSDate < endJSDate) || (updateFeesJSDate > startJSDate2 && updateFeesJSDate < endJSDate2)) {
		feeAmt = ( sumASITColumn(equipTable, "Plate Fee", "EXCLUDE", "Equipment Use", "Household Goods", "INCLUDE", "Vehicle Action", "Add Vehicle") * 0.5 ) + 
			sumASITColumn(equipTable, "Plate Fee", "INCLUDE", "Equipment Use", "Household Goods", "INCLUDE", "Vehicle Action", "Add Vehicle");
	}
	else {
		feeAmt = sumASITColumn(equipTable, "Plate Fee", "INCLUDE", "Vehicle Action", "Add Vehicle");
	}
	if ((feeAmt > 0) && (approvDate != null)) {
		updateFee("DECAL", "MCD_AUTH_APP", "FINAL", feeAmt, "N");
	}
	if ((feeAmt > 0) && (updateFeesDate != null)) {
		updateFee("DECAL", "MCD_EQUIP", "FINAL", feeAmt, "N");
	}
}

//TCH@Accela 2016-09-29 Added test for feeAmt before comparing to the exstngRnwlFeeAmt
function assessRenewalDecalFee() { //CG 12/14/2015 added function to calculate and update renewal decal fee.
 
    var exstngRnwlFeeAmt = 0;
    var feeAmt = 0;
    var equipTable = loadASITable("EQUIPMENT LIST");
    
    logDebug("Get fee total from ASIT");
    feeAmt = sumASITColumn(equipTable, "Plate Fee");
    logDebug("feeAmt: "+feeAmt);
 
    if (feeExists("DECAL") === true) {
    	logDebug("Found existing decal fee");
        exstngRnwlFeeAmt = getFeeAmount("DECAL");
    	logDebug("of $"+exstngRnwlFeeAmt);
    }
 
    if (feeAmt) {
        if (feeAmt !== exstngRnwlFeeAmt) {
            updateFee("DECAL", "MCD_AUTH_RENEW", "FINAL", feeAmt, "Y");
        }
    }
}

function assessEquipListFee(feeItemCode, columnName, columnValue) { //CG 12/17/2015 -- feeItemCode = the fee item code that you want to update, columnValue = the column value that is used to calculate the fee.
	exstngFeeAmt = 0;
	feeAmt = 0;
	equipTable = loadASITable("EQUIPMENT LIST");
	feeAmt = countASITRows(equipTable, columnName, "INCLUDE", columnValue);

	if (feeExists(feeItemCode) == true){
		exstngFeeAmt = getFeeAmount(feeItemCode);
	}	
	if (feeAmt > 0 && feeAmt != exstngFeeAmt) {
		updateFee(feeItemCode, "MCD_EQUIP", "FINAL", feeAmt, "Y");
	}	
	if (feeExists(feeItemCode) == true && feeAmt <= 0) {
		voidRemoveFees(feeItemCode);
	}	
}

function assessEquipListDecalFee() { //CG 12.17.2015 = GC = $100 and has half year discount, HHG = $50.
	feeAmt = 0;
	exstngFeeAmt = 0;
	feeDate = getTodayJs();
	feeYear = feeDate.getFullYear();
	feeStartDate = new Date("6/30/"+ feeYear);
	feeEndDate = new Date("11/01/"+ feeYear);
	equipTable = loadASITable("EQUIPMENT LIST");
	var gcVehicleCount = countASITRows(equipTable, "Vehicle Action", "INCLUDE", "Add Vehicle", "Equipment Use", "EXCLUDE", "Household Goods");
	var hhgVehicleCount = countASITRows(equipTable, "Vehicle Action", "INCLUDE", "Add Vehicle", "Equipment Use", "INCLUDE", "Household Goods");
	logDebug("GC Vehicle count: "+gcVehicleCount);
	logDebug("HHG Vehicle count: "+hhgVehicleCount);
	if (feeDate > feeStartDate && feeDate < feeEndDate) {
		feeAmt = gcVehicleCount*50;
	}
	else {
		feeAmt = gcVehicleCount*100;
	}
	feeAmt += (hhgVehicleCount*50);
	
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

function createCertOfAuth() {
	mpscNum = getMPSCNumFromLP();
	if (mpscNum != null) {
		var existResult = aa.cap.getCapID(mpscNum).getSuccess();
		if(!existResult){
		 	newLicId = createParent(appTypeArray[0], appTypeArray[1], "Certificate of Authority", "NA",null);
			if (newLicId) {
				aa.cap.updateCapAltID(newLicId, mpscNum);
				copyLicensedProf(capId, newLicId);
				newLicIdString = newLicId.getCustomID();
				//updateAppStatus("Issued","Originally Issued",newLicId);
				thisLic = new licenseObject(newLicIdString,newLicId);
				thisLic.setStatus("Active");
	
	            var certIssueDate = getStatusDateinTaskHistory("Certification", "Issued");
	            var certIssueMonth = certIssueDate.getMonth() + 1;
	            var certIssueDay = certIssueDate.getDate();
	            var certIssueYear = 1900 + certIssueDate.getYear();
	            if (certIssueDate != null && certIssueMonth > 9){
	                var certFirstExpYear = certIssueYear + 1;
	                thisLic.setExpiration("12/31/"+certFirstExpYear);
	            }
	            else{
	                certFirstExpYear = certIssueYear;
	                thisLic.setExpiration("12/31/"+certFirstExpYear);
	            }
	            logDebug("The Certificate of Authority was issued on " + certIssueDate + " and will expire on 12/31/" + certFirstExpYear + ".");
	
				if (certIssueDate != null){
					var cIDate = certIssueMonth+"/"+certIssueDay+"/"+certIssueYear;
					thisLic.setIssued(cIDate);
					logDebug("RefLP License Issued Date updated to: "+cIDate);
				}
	
				var ignore = lookup("EMSE:ASI Copy Exceptions","License/*/*/*"); 
				var ignoreArr = new Array();
				if(ignore != null) ignoreArr = ignore.split("|"); 
				copyAppSpecific(newLicId,ignoreArr);
				copyASITables(capId,newLicId);
				linkMPSCtoPU(mpscNum, capId);
				
				//get refLp to edit standard fields for ACA display
				var refLPModel = getRefLicenseProf(mpscNum);
				if(!refLPModel){
					logDebug("Ref LP " + refLPNum + " not found");
				}else{
					refLPModel.setAcaPermission(null);//the system interprets null as Y (this will display in ACA)
					refLPModel.setInsuranceCo("Active");
					aa.licenseScript.editRefLicenseProf(refLPModel);
				}
				
				editRefLicProfAttribute(mpscNum,"INTRASTATE AUTHORITY EXPIRATIO","12/31/"+certFirstExpYear);//sets expiration year on Ref LP
				editRefLicProfAttribute(mpscNum,"INTRASTATE AUTHORITY STATUS","Active");
				editRefLicProfAttribute(mpscNum,"INTRASTATE AUTHORITY STATUS DA",cIDate);
				editRefLicProfAttribute(mpscNum,"INTRASTATE AUTH APP DATE",fileDate);
				editLicProfAttribute(newLicId, mpscNum,"INTRASTATE AUTHORITY EXPIRATIO","12/31/"+certFirstExpYear);//sets expiration year on Cert trans LP
				editLicProfAttribute(newLicId, mpscNum,"INTRASTATE AUTHORITY STATUS","Active");
				editLicProfAttribute(newLicId, mpscNum,"INTRASTATE AUTHORITY STATUS DA",cIDate);
				editLicProfAttribute(newLicId, mpscNum,"INTRASTATE AUTH APP DATE",fileDate);
				
				if (AInfo["Application is Part of a Transfer"] == "Y" || AInfo["Application is Part of a Transfer"] == "Yes") {
					eqListTable = loadASITable("EQUIPMENT_LIST", newLicId);
					newTable = new Array();
					for (var eachRow in eqListTable) {
						thisRow = eqListTable[eachRow];
						newRow = new Array();
						newRow["Type"] = new asiTableValObj("Type", thisRow["Type"].fieldValue, "N");
						newRow["Year"] = new asiTableValObj("Year", thisRow["Year"].fieldValue, "N");
						newRow["Make"] = new asiTableValObj("Make", thisRow["Make"].fieldValue, "N");
						newRow["Serial#/VIN"] = new asiTableValObj("Serial#/VIN", thisRow["Serial#/VIN"].fieldValue, "N");
						newRow["GVWR"] = new asiTableValObj("GVWR", thisRow["GVWR"].fieldValue, "N");
						newRow["Unit/Fleet #"] = new asiTableValObj("Unit/Fleet #", thisRow["Unit/Fleet #"].fieldValue, "N");
						newRow["License Plate State"] = new asiTableValObj("License Plate State", thisRow["License Plate State"].fieldValue, "N");
						newRow["Leased Vehicle Owner"] = new asiTableValObj("Leased Vehicle Owner", thisRow["Leased Vehicle Owner"].fieldValue, "N");
						newRow["Vehicle Action"] = new asiTableValObj("Vehicle Action", ""/*thisRow["Vehicle Action"].fieldValue*/, "N");
						newRow["Status"] = new asiTableValObj("Status", thisRow["Status"].fieldValue, "N");
						newRow["MPSC Decal #"] = new asiTableValObj("MPSC Decal #", thisRow["MPSC Decal #"].fieldValue, "Y");
						var equipUse = thisRow["Equipment Use"].fieldValue;//gets equipment use to set plate fee instead of copying Plate Fee data
						newRow["Equipment Use"] = new asiTableValObj("Equipment Use", equipUse, "N");
						if (equipUse == "Household Goods") pFee = "50.00";
						else pFee = "100.00";
						newRow["Plate Fee"] = new asiTableValObj("Plate Fee", pFee, "N");
						newTable.push(newRow);
					}
					addASITable("EQUIPMENT LIST", newTable);
				}
			}
		}else{
			//Update existing Authority
			logDebug("A Certificate of Authority has already been issued for this CVED number attempting to update the existing Authority.");
			//get existing Authority capId
			var authCapId = aa.cap.getCapID(mpscNum).getOutput();
			
			//link app to existing Certificate of Authority
			addParent(mpscNum);
			
			//link the RefLP to the public user on the new App
			linkMPSCtoPU(mpscNum, capId);//getting the pu from new app and linking to the updated refLp
			
			//copy ASI from app to cert
			var ignore = lookup("EMSE:ASI Copy Exceptions","License/*/*/*"); 
			var ignoreArr = new Array();
			if(ignore != null) ignoreArr = ignore.split("|"); 
			copyAppSpecific(authCapId,ignoreArr);
			
			//remove existing ASIT on Auth and copy ASIT from app to cert
			removeASITable("EQUIPMENT LIST",authCapId);
			removeASITable("CONTINUOUS CONTRACT",authCapId);
			copyASITables(capId, authCapId);
			
			//remove existing addresses on Auth
			removeCapAddresses(capId);
			
			//copy address from app to cert
			copyAddresses(capId, authCapId);
			
			//remove existing Contacts on Auth and copy from app to cert
			removeCapContacts(authCapId);
			copyContacts(capId, authCapId);

			//Update existing reference LP with current info from app
			updateRefLpFromTransLp();
			
			//edit Ref LP for issuance and copy to existing Authority
			editRefLicProfAttribute(mpscNum,"INTRASTATE AUTHORITY EXPIRATIO","12/31/"+certFirstExpYear);//sets expiration year on Ref LP
			editRefLicProfAttribute(mpscNum,"INTRASTATE AUTHORITY STATUS","Active");
			editRefLicProfAttribute(mpscNum,"INTRASTATE AUTHORITY STATUS DA",cIDate);
			editRefLicProfAttribute(mpscNum,"INTRASTATE AUTH APP DATE",fileDate);
			
			var refLPModel = getRefLicenseProf(mpscNum);
			if(!refLPModel){
				logDebug("Ref LP " + refLPNum + " not found");
			}else{
				refLPModel.setAcaPermission(null);//the system interprets null as Y (this will display in ACA)
				refLPModel.setInsuranceCo("Active");
				modifyRefLPAndSubTran(authCapId, refLPModel);
			}
			
			//Updates for issuance Record Status
			updateAppStatus("Active","",authCapId);
			//Updates for issuance Expiration Status and date
			thisLic = new licenseObject(mpscNum,authCapId);
			thisLic.setStatus("Active");

            var certIssueDate = getStatusDateinTaskHistory("Certification", "Issued");
            var certIssueMonth = certIssueDate.getMonth() + 1;
            var certIssueDay = certIssueDate.getDate();
            var certIssueYear = 1900 + certIssueDate.getYear();
            if (certIssueDate != null && certIssueMonth > 9){
                var certFirstExpYear = certIssueYear + 1;
                thisLic.setExpiration("12/31/"+certFirstExpYear);
            }
            else{
                certFirstExpYear = certIssueYear;
                thisLic.setExpiration("12/31/"+certFirstExpYear);
            }
            logDebug("The Certificate of Authority was issued on " + certIssueDate + " and will expire on 12/31/" + certFirstExpYear + ".");

			if (certIssueDate != null){
				var cIDate = certIssueMonth+"/"+certIssueDay+"/"+certIssueYear;
				thisLic.setIssued(cIDate);
				logDebug("RefLP License Issued Date updated to: "+cIDate);
			}
			
			//update results
			logDebug("The existing Authority: "+mpscNum+" was updated and has been reissued");
		}
	}
}

function getMPSCNumFromLP() {
	var retValue = null;
	var licProfResult = aa.licenseProfessional.getLicensedProfessionalsByCapID(capId);
	if (licProfResult.getSuccess()) {
		licProf = licProfResult.getOutput();
		if (licProf != null) {
			for (lpIndex in licProf) {
				thisLP = licProf[lpIndex];
				if (("" + thisLP.getLicenseType()) == "Carrier") {
					return "" + thisLP.getLicenseNbr();
				}
			}
		}
	}
	else { 
		logDebug("Error getting lps on record " + licProfResult.getErrorMessage());
	}
	return retValue;
}

function linkMPSCtoPU(licNum, appCapId) {
	refMPSC = null;
	var licResult = aa.licenseScript.getRefLicensesProfByLicNbr(aa.getServiceProviderCode(), licNum);
	if (licResult.getSuccess()) {
		var tmp = licResult.getOutput();
		if (tmp != null) {
			for (lic in tmp) {
				if ( ("" + tmp[lic].getLicenseType() == "Carrier") ) {
					refMPSC = tmp[lic];
					break;
				}
			}
		}
	}
	if (refMPSC == null) { logDebug("No ref lp found " + licNum); return; }
	
	appCap = aa.cap.getCap(appCapId).getOutput();
	createdBy = "";
	if (appCap && appCap.isCreatedByACA()) {
		appCapDetailObjResult = aa.cap.getCapDetail(appCapId);		
		if (appCapDetailObjResult.getSuccess()) {
			appCapDetailObj = appCapDetailObjResult.getOutput();
			createdBy = appCapDetailObj.getCreateBy();
		}
		if (createdBy.indexOf("PUBLIC") == 0) {
			puResult = aa.publicUser.getPublicUserByPUser(createdBy);
			if (puResult.getSuccess()) {
				pu = puResult.getOutput();
				if (pu!=null) {
					assocResult = aa.licenseScript.associateLpWithPublicUser(pu, refMPSC);
					if (assocResult.getSuccess()) 
						logDebug("Successfully linked ref lp to public user account");
					else
						logDebug("Link failed " + assocResult.getErrorMessage());
				}
				else { logDebug("public user is null"); }
			}
			else { logDebug("Error getting public user " + puResult.getErrorMessage()); }
		}
		else { logDebug("No public user to link to"); }
	}
	else { logDebug("Record not created by ACA - no public user"); }
}

function getTaskSpecific(wfName,itemName){ // optional: itemCap
	var i=0;
	itemCap = capId;
	if(arguments.length == 4){// use cap ID specified in args
		itemCap = arguments[3];
	}
	var workflowResult = aa.workflow.getTasks(itemCap);
	if (workflowResult.getSuccess()){// Get the workflows
		var wfObj = workflowResult.getOutput();
	}
	else{
		logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}
	for (i in wfObj) {// Loop through workflow tasks
		fTask = wfObj[i];
		stepnumber = fTask.getStepNumber();
		processID = fTask.getProcessID();
		if (wfName.equals(fTask.getTaskDescription())) { // Found the right Workflow Task
			TSIResult = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(itemCap,processID,stepnumber,itemName);
			if (TSIResult.getSuccess()) {
				var TSI = TSIResult.getOutput();
				if (TSI != null) {
					var TSIArray = new Array();
					TSInfoModel = TSI.getTaskSpecificInfoModel();
					var itemValue = TSInfoModel.getChecklistComment();
					return itemValue;
				}
				else
					logDebug("No task specific info field called "+itemName+" found for task "+wfName);
			}
			else {
				logDebug("**ERROR: Failed to get Task Specific Info objects: " + TSIResult.getErrorMessage());
				return false;
			}
		}
	}
}

function editLicProfAttribute(licCapId, pLicNum,pAttributeName,pNewAttributeValue) {

	var attrfound = false;
	var oldValue = null;
	var licObj = null;

	licObjArr = getLicenseProfessional(licCapId)
	if (licObjArr == null) return;
	for (tlpIndex in licObjArr) {
		thisTranLP = licObjArr[tlpIndex];
		if (thisTranLP.getLicenseNbr() == pLicNum) {
			licObj = thisTranLP;
		}
	}

	if (licObj == null) {
		logDebug("Transactional licensed professional does not exist");
		return;
	}
	attributeType = licObj.getLicenseType();
	casm = licObj.getAttributes();  // ContactAttributeSciptModel
	for (i in casm) {
		thisAttr = casm[i];
		if ("" + thisAttr.getAttributeName() == pAttributeName) {
			oldValue = thisAttr.getAttributeValue();
			thisAttr.setAttributeValue(pNewAttributeValue);
			casm[i] = thisAttr;
			attrfound = true;
		}
	}
	if (attrfound)	{
		licObj.setAttributes(casm);
		editResult = aa.licenseProfessional.editLicensedProfessional(licObj);
		if (editResult.getSuccess()) {
			logDebug("Updated Tran Lic Prof: " + pLicNum + ", attribute: " + pAttributeName + " from: " + oldValue + " to: " + pNewAttributeValue)
		}
		else {
			logDebug("Error updating transaction lic prof " + editResult.getErrorMessage());
		}
	}
}

function queryConflictVIN() {
	var returnStruct = { 
		'isIssue': false,
		'issueMessage': new Array()
	};

	if (typeof EQUIPMENTLIST != 'object')
		return returnStruct
	var vinList = new Array()
	var dupList = new Array()
	var MPSCnumber = ""
	
	var lpList = getLicenseProfessional(capId)
	for ( i in lpList) {
		//Only get the 1st LIC # (per Chris)
		MPSCnumber = lpList[i].getLicenseNbr()
		break;
	}
	


	thisASIT = EQUIPMENTLIST 
	for (r in thisASIT) {
		// Only check active VINs
		if ( matches(""+thisASIT[r]["Status"], "Active" ))
			vinList.push(thisASIT[r]["Serial#/VIN"])
	}

	if (vinList.length > 0) {
		var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
		var ds = initialContext.lookup("java:/AA");
		var conn = ds.getConnection();
		var sqlList = "?"
		var defaultStatus = "Inactive" //Default blanks to inactive
		for (i in vinList) if (i>0) sqlList += ",?";

		var sqlString = 
		"SELECT DISTINCT B1_ALT_ID||'||'|| ATTRIBUTE_VALUE as return_string, nvl((SELECT ATTRIBUTE_VALUE FROM BAPPSPECTABLE_VALUE V1 \
			WHERE B.B1_PER_ID1 = V1.B1_PER_ID1 AND row_index=v.row_index and column_name = 'Status' \
			AND B.B1_PER_ID2 = V1.B1_PER_ID2 \
			AND B.B1_PER_ID3 = V1.B1_PER_ID3 \
			AND B.SERV_PROV_CODE = 'MSP' \
			AND B.B1_PER_SUB_TYPE = 'Certificate of Authority' \
			AND V1.SERV_PROV_CODE = 'MSP'),?) as return_status \
		FROM B1PERMIT B INNER JOIN BAPPSPECTABLE_VALUE V \
			ON B.B1_PER_ID1 = V.B1_PER_ID1 \
			AND B.B1_PER_ID2 = V.B1_PER_ID2 \
			AND B.B1_PER_ID3 = V.B1_PER_ID3 \
			AND B.SERV_PROV_CODE = 'MSP' \
			AND V.SERV_PROV_CODE = 'MSP' \
		WHERE TABLE_NAME LIKE '%EQUIPMENT_LIST' \
			AND COLUMN_NAME LIKE 'Serial%VIN' \
			AND B1_ALT_ID <> ? \
			AND ATTRIBUTE_VALUE in ($LIST$)";

		sqlString = sqlString.replace("$LIST$", sqlList)
		var uStmt = conn.prepareStatement(sqlString);
		uStmt.setString(1,defaultStatus)
		uStmt.setString(2,capIDString )
		for (n in vinList) uStmt.setString(parseInt(n)+3, vinList[n]);
		uStmt.executeQuery();
		results = uStmt.getResultSet()

		while (results.next()) {
			if(results.getString("return_status") == "Active")
				dupList.push(results.getString("return_string"))
		}
		uStmt.close();
		conn.close();
		//logDebug("DUPs: "+ dupList)
		for ( d in dupList){
			thisDup = (""+dupList[d]).split("||")
			if (thisDup.length < 2) continue;
			thisCap = thisDup[0]
			thisVIN = thisDup[1]
			dupMPSCnumber = ""

			var dupCapId = null;
			var dupCapIdObj = aa.cap.getCapID(thisCap);
			if (dupCapIdObj.getSuccess()) { 
				dupCapId = dupCapIdObj.getOutput();  
				var dupLpList = getLicenseProfessional(dupCapId)
				for ( i in dupLpList) {
					dupMPSCnumber = dupLpList[i].getLicenseNbr()
					break;
				}

				if (MPSCnumber != dupMPSCnumber) {
					returnStruct.isIssue = true
					returnStruct.issueMessage.push("VIN: " + thisVIN + " is currently active on Record: "+ thisCap )
				}
			}
		}
	}
	return returnStruct
}

function createRefLicProfFromLicProfMotorCarrier(){
	capLicenseResult = aa.licenseScript.getLicenseProf(capId);
	if (capLicenseResult.getSuccess())
		capLicenseArr = capLicenseResult.getOutput();
	else { 
		logDebug("**ERROR: getting lic prof: " + capLicenseResult.getErrorMessage()); 
		return false;
	}

	if (!capLicenseArr.length) {
		logDebug("WARNING: no license professional available on the application:"); 
		return false; 
	}

	licProfScriptModel = capLicenseArr[0];
	licModel = licProfScriptModel.getLicenseProfessionalModel();
	rlpId = licProfScriptModel.getLicenseNbr(); 
	logDebug("Current transactional license number " + rlpId);
	
	existingCarrier = getTaskSpecific("Application Review", "This Application is for a Carrier with an existing MPSC#");
	logDebug("Existing carrier = " + existingCarrier);
	if (existingCarrier == "No" || existingCarrier == "N") {
		//var newLic = getRefLicenseProf(rlpId)
		//if (newLic){
		//	logDebug("Reference lp " + rlpId + " exists");	return;
		//}
		var newLic = aa.licenseScript.createLicenseScriptModel();
		
		// create new Ref Lp
		// replace lic number with number from Agency mask
		sessID = getSessionID();
		nextNumber = getNextMaskedSeq(sessID, "MPSC Number Mask", "MPSC Number Sequence", "Agency");
		rlpId = nextNumber;
		logDebug("New license number = " + nextNumber);
		newLic.setStateLicense(nextNumber); 
		newLic.setLicState("MI");
		newLic.setAcaPermission("N");
		newLic.setAddress1(licProfScriptModel.getAddress1());
		newLic.setAddress2(licProfScriptModel.getAddress2());
		newLic.setAddress3(licProfScriptModel.getAddress3());
		newLic.setContactFirstName(licProfScriptModel.getContactFirstName());
		newLic.setContactLastName(licProfScriptModel.getContactLastName());
		newLic.setContactMiddleName(licProfScriptModel.getContactMiddleName());
		newLic.setAgencyCode(licProfScriptModel.getAgencyCode());
		newLic.setAuditDate(licProfScriptModel.getAuditDate());
		newLic.setAuditID(licProfScriptModel.getAuditID());
		newLic.setAuditStatus(licProfScriptModel.getAuditStatus());
		newLic.setBusinessLicense(licProfScriptModel.getBusinessLicense());
		newLic.setBusinessName(licProfScriptModel.getBusinessName());
		newLic.setCity(licProfScriptModel.getCity());
		newLic.setCityCode(licProfScriptModel.getCityCode());
		newLic.setCountryCode(licProfScriptModel.getCountryCode());
		newLic.setCountry(licProfScriptModel.getCountry());
		newLic.setEinSs(licProfScriptModel.getEinSs());
		newLic.setEMailAddress(licProfScriptModel.getEmail());
		newLic.setFax(licProfScriptModel.getFax());
		newLic.setLicenseType(licProfScriptModel.getLicenseType());
		newLic.setLicOrigIssDate(licProfScriptModel.getLicesnseOrigIssueDate());
		newLic.setPhone1(licProfScriptModel.getPhone1());
		newLic.setPhone2(licProfScriptModel.getPhone2());
		newLic.setSelfIns(licProfScriptModel.getSelfIns());
		newLic.setState(licProfScriptModel.getState());
		newLic.setLicState(licProfScriptModel.getState());
		newLic.setSuffixName(licProfScriptModel.getSuffixName());
		newLic.setZip(licProfScriptModel.getZip());
		newLic.setFein(licProfScriptModel.getFein());
		newLic.setSocialSecurityNumber(licProfScriptModel.getSocialSecurityNumber());
		newLic.setMaskedSsn(licProfScriptModel.getMaskedSsn());
		//newLic.setLicenseBoard(licProfScriptModel.getLicenseBoard());
		newLic.setBusinessName2(licProfScriptModel.getBusName2());
		
		/* ASI to LP */
		if(AInfo["Worker's Compensation Exempt"] != null) {
			if (AInfo["Worker's Compensation Exempt"] == "Yes" || AInfo["Worker's Compensation Exempt"] == "Y") 
				newLic.setWcExempt("Y");
			else
				newLic.setWcExempt("N");
		}
		if(AInfo["Operation Type"] != null) {
			newLic.setLicenseBoard(AInfo["Operation Type"]);
		}
		
		/* LP Template to LP  *//* -------not populating the bus lic and ins exp dates anymore.-------------
		attrList = licProfScriptModel.getAttributes()
		for ( i in attrList ) {
			thisAttr = attrList[i]
			name = ""+thisAttr.getAttributeName(); 
			val= "" ;
			val = ""+thisAttr.getAttributeValue();
			if (name == "CARGO INSURANCE EXP DATE" && val != "" && val != "null") {
				newLic.setBusinessLicExpDate(aa.date.parseDate(val));
			}
			if (name == "PL/PD INSURANCE EXP DATE" && val != "" && val != "null") {
				newLic.setInsuranceExpDate(aa.date.parseDate(val));
			}
		}*/
		
		
		myResult = aa.licenseScript.createRefLicenseProf(newLic);
		if (myResult.getSuccess())	{
			logDebug("Successfully created ref lic prof");
		}
		else {
				logDebug("Error creating reference lp: " + myResult.getErrorMessage()); 
				return false;
		}
		
	
		/* LP Template to LP Template */
		attrList = licProfScriptModel.getAttributes()
		for ( i in attrList ) {
			thisAttr = attrList[i]
			name = ""+thisAttr.getAttributeName(); val="";
			// Exclude fields updated by ASI
			if( !matches(name,"AUTO TRANSPORT","HAZ MAT CARRIER", "HOUSEHOLD GOODS AUTHORITY", "PORTABLE STORAGE UNITS", "CONTINUOUS CONTRACT")) {
				val = ""+thisAttr.getAttributeValue()
				editRefLicProfAttribute(rlpId,name,val == "null" ? null : val)
			}

		}

		/* ASI to LP Template */
		if(AInfo["Auto Transport"] != null) 
			editRefLicProfAttribute(rlpId,"AUTO TRANSPORT",AInfo["Auto Transport"])
		if(AInfo["Hazardous Material"] != null) 
			editRefLicProfAttribute(rlpId,"HAZ MAT CARRIER",AInfo["Hazardous Material"])
		if(AInfo["Household Goods Authority"] != null) 
			editRefLicProfAttribute(rlpId,"HOUSEHOLD GOODS AUTHORITY",AInfo["Household Goods Authority"])
		if(AInfo["Continuous Contract"] != null) 
			editRefLicProfAttribute(rlpId,"CONTINUOUS CONTRACT",AInfo["Continuous Contract"])
		if(AInfo["Portable Storage Units"] != null) 
			editRefLicProfAttribute(rlpId,"PORTABLE STORAGE UNITS",AInfo["Portable Storage Units"]);
		
		
		// copy lic number from reference LP to transaction LP 
		var capLicenseResult = aa.licenseProfessional.getLicenseProf(capId);
		var capLicenseArr = new Array();
		if (capLicenseResult.getSuccess())
			{ capLicenseArr = capLicenseResult.getOutput();  }
			
		if(capLicenseArr != null){
			for(capLic in capLicenseArr){
				if(capLicenseArr[capLic].getLicenseType()+"" == newLic.getLicenseType()+""){
					aa.licenseProfessional.removeLicensedProfessional(capLicenseArr[capLic]);
					break;
				}				
			}
			capListResult = aa.licenseScript.associateLpWithCap(capId,newLic);
			if (capListResult.getSuccess()) {
				logDebug("Successfully associated ref LP with record")
			}
			else {
				logDebug("Error associating ref lp with record " + capListResult.getErrorMessage())
			}
		}

	}
	if (existingCarrier == "Yes" || existingCarrier == "Y") {
		
		existingCarrierNum = getTaskSpecific("Application Review", "MPSC#");
		var newLic = getRefLicenseProf(existingCarrierNum);
		if (!newLic) {
			logDebug("Existing carrier " + existingCarrierNum + " not found"); return;
		}
		logDebug("Modifying existing carrier " + existingCarrierNum);
		
		// update existing ref lp with all data from tran LP except MPSC#
		newLic.setAddress1(licProfScriptModel.getAddress1());
		newLic.setAddress2(licProfScriptModel.getAddress2());
		newLic.setAddress3(licProfScriptModel.getAddress3());
		newLic.setContactFirstName(licProfScriptModel.getContactFirstName());
		newLic.setContactLastName(licProfScriptModel.getContactLastName());
		newLic.setContactMiddleName(licProfScriptModel.getContactMiddleName());
		newLic.setAgencyCode(licProfScriptModel.getAgencyCode());
		newLic.setAuditDate(licProfScriptModel.getAuditDate());
		newLic.setAuditID(licProfScriptModel.getAuditID());
		newLic.setAuditStatus(licProfScriptModel.getAuditStatus());
		newLic.setBusinessLicense(licProfScriptModel.getBusinessLicense());
		newLic.setBusinessName(licProfScriptModel.getBusinessName());
		newLic.setCity(licProfScriptModel.getCity());
		newLic.setCityCode(licProfScriptModel.getCityCode());
		newLic.setCountryCode(licProfScriptModel.getCountryCode());
		newLic.setCountry(licProfScriptModel.getCountry());
		newLic.setEinSs(licProfScriptModel.getEinSs());
		newLic.setEMailAddress(licProfScriptModel.getEmail());
		newLic.setFax(licProfScriptModel.getFax());
		newLic.setLicenseType(licProfScriptModel.getLicenseType());
		newLic.setLicOrigIssDate(licProfScriptModel.getLicesnseOrigIssueDate());
		newLic.setPhone1(licProfScriptModel.getPhone1());
		newLic.setPhone2(licProfScriptModel.getPhone2());
		newLic.setSelfIns(licProfScriptModel.getSelfIns());
		newLic.setState(licProfScriptModel.getState());
		newLic.setLicState(licProfScriptModel.getState());
		newLic.setSuffixName(licProfScriptModel.getSuffixName());
		newLic.setZip(licProfScriptModel.getZip());
		newLic.setFein(licProfScriptModel.getFein());
		newLic.setSocialSecurityNumber(licProfScriptModel.getSocialSecurityNumber());
		newLic.setMaskedSsn(licProfScriptModel.getMaskedSsn());
		// newLic.setLicenseBoard(licProfScriptModel.getLicenseBoard());
		newLic.setBusinessName2(licProfScriptModel.getBusName2());
		
		/* ASI to LP */
		if(AInfo["Worker's Compensation Exempt"] != null) {
			if (AInfo["Worker's Compensation Exempt"] == "Yes" || AInfo["Worker's Compensation Exempt"] == "Y") {
				newLic.setWcExempt("Y");
			}
			else
				newLic.setWcExempt("N");
		}
		if(AInfo["Operation Type"] != null) {
			newLic.setLicenseBoard(AInfo["Operation Type"]);
		}
		
		/* LP Template to LP Template */
		attrList = licProfScriptModel.getAttributes()
		for ( i in attrList ) {
			thisAttr = attrList[i]
			name = ""+thisAttr.getAttributeName(); val="";
			// Exclude fields updated by ASI
			if( !matches(name,"AUTO TRANSPORT","HAZ MAT CARRIER", "HOUSEHOLD GOODS AUTHORITY", "PORTABLE STORAGE UNITS", "CONTINUOUS CONTRACT")) {
				val = ""+thisAttr.getAttributeValue()
				editRefLicProfAttribute(rlpId,name,val == "null" ? null : val)
			}
			
			/* -------not populating the bus lic and ins exp dates anymore.-------------
			if (name == "CARGO INSURANCE EXP DATE" && val != "" && val != "null") {
				newLic.setBusinessLicExpDate(aa.date.parseDate(val));
			}
			if (name == "PL/PD INSURANCE EXP DATE" && val != "" && val != "null") {
				newLic.setInsuranceExpDate(aa.date.parseDate(val));
			}*/
		}

		/* ASI to LP Template */
		if(AInfo["Auto Transport"] != null) 
			editRefLicProfAttribute(rlpId,"AUTO TRANSPORT",AInfo["Auto Transport"])
		if(AInfo["Hazardous Material"] != null) 
			editRefLicProfAttribute(rlpId,"HAZ MAT CARRIER",AInfo["Hazardous Material"])
		if(AInfo["Household Goods Authority"] != null) 
			editRefLicProfAttribute(rlpId,"HOUSEHOLD GOODS AUTHORITY",AInfo["Household Goods Authority"])
		if(AInfo["Continuous Contract"] != null) 
			editRefLicProfAttribute(rlpId,"CONTINUOUS CONTRACT",AInfo["Continuous Contract"])
		if(AInfo["Portable Storage Units"] != null) 
			editRefLicProfAttribute(rlpId,"PORTABLE STORAGE UNITS",AInfo["Portable Storage Units"]);
		
		modifyRefLPAndSubTran(capId, newLic);
	}
	return rlpId;
}

function updateCert(updateType){
	pId = getParent();
	existingCarrierNum = pId.getCustomID();
	var cLic = getRefLicenseProf(existingCarrierNum);
	
	if (!cLic) {
		logDebug("Existing carrier " + existingCarrierNum + " not found"); 
		return;
	}
	logDebug("Modifying existing carrier " + existingCarrierNum);
	
	switch ("" + updateType) {
		case "NAMECHANGE":
			newCarrierName = AInfo["New Carrier Name"];
			newCorpName = AInfo["New Owner/Parent Corp. Name"];
			newBusinessType = AInfo["New Business Type"];
			// update existing ref lp with all data from tran LP except MPSC#
			
			/* LP Template to LP Template */
			if (newBusinessType && newBusinessType != "") {
				editRefLicProfAttribute(existingCarrierNum,"OWNERSHIP TYPE", newBusinessType);
				cLic = getRefLicenseProf(existingCarrierNum);
			}
			cLic.setBusinessName(newCarrierName);
			cLic.setBusinessName2(newCorpName);
			break;
		case "ADDRESSCHANGE":
			addrLine1 = AInfo["Address Line 1"];
			addrLine2 = AInfo["Address Line 2"];
			city = AInfo["City"];
			st = AInfo["State"];
			zip = AInfo["ZIP Code"];
			cPhone = AInfo["Carrier Phone"];
			cFax = AInfo["Carrier Fax"];
			cEmail = AInfo["Carrier Email"];
			
			if (addrLine1 && addrLine1 != "") cLic.setAddress1(addrLine1);
			/*if (addrLine2 && addrLine2 != "")*/ cLic.setAddress2(addrLine2); //address line 2 can be removed from the Certificate of Authority and Ref LP
			if (city && city!= "") cLic.setCity(city);
			if (st && st!="") cLic.setState(st);
			if (zip && zip != "") cLic.setZip(zip);
			if (cPhone && cPhone != "") cLic.setPhone1(cPhone);
			/*if (cFax && cFax != "")*/ cLic.setFax(cFax); //Fax number can be removed from the Certificate of Authority and Ref LP
			if (cEmail && cEmail != "") cLic.setEMailAddress(cEmail);
			copyAddresses(capId, pId);
			break;
		case "DISCONTINUANCE":
			opType = AInfo["Operation Type"];
			autoTrans = AInfo["Auto Transport"];
			hazMat = AInfo["Hazardous Material"];
			hga = AInfo["Household Goods Authority"];
			psu = AInfo["Portable Storage Units"];
			cc = AInfo["Continuous Contract"];

			editAppSpecific("Operation Type", opType, pId);
			cLic = getRefLicenseProf(existingCarrierNum);

			editAppSpecific("Auto Transport", autoTrans, pId);
			editRefLicProfAttribute(existingCarrierNum,"AUTO TRANSPORT",autoTrans)

			editAppSpecific("Hazardous Material", hazMat, pId); 
			editRefLicProfAttribute(existingCarrierNum,"HAZ MAT CARRIER", hazMat)

			editAppSpecific("Household Goods Authority", hga, pId);
			editRefLicProfAttribute(existingCarrierNum,"HOUSEHOLD GOODS AUTHORITY", hga);

			editAppSpecific("Portable Storage Units", psu, pId);
			editRefLicProfAttribute(existingCarrierNum,"PORTABLE STORAGE UNITS",psu);

			editAppSpecific("Continuous Contract", cc, pId);
			editRefLicProfAttribute(existingCarrierNum,"CONTINUOUS CONTRACT", cc);
			
			cLic = getRefLicenseProf(existingCarrierNum);
			
			cLic.setLicenseBoard(opType);
			
			break;
		case "TEMPDISCON":
			opType = AInfo["Operation Type"];
			autoTrans = AInfo["Auto Transport"];
			hazMat = AInfo["Hazardous Material"];
			hga = AInfo["Household Goods Authority"];
			psu = AInfo["Portable Storage Units"];
			cc = AInfo["Continuous Contract"];
			effDate = AInfo["Desired Effective Date"];

			editAppSpecific("Operation Type", opType, pId);
			cLic = getRefLicenseProf(existingCarrierNum);

			editAppSpecific("Auto Transport", autoTrans, pId);
			editRefLicProfAttribute(existingCarrierNum,"AUTO TRANSPORT",autoTrans);

			editAppSpecific("Hazardous Material", hazMat, pId); 
			editRefLicProfAttribute(existingCarrierNum,"HAZ MAT CARRIER", hazMat);

			editAppSpecific("Household Goods Authority", hga, pId);
			editRefLicProfAttribute(existingCarrierNum,"HOUSEHOLD GOODS AUTHORITY", hga);

			editAppSpecific("Portable Storage Units", psu, pId);
			editRefLicProfAttribute(existingCarrierNum,"PORTABLE STORAGE UNITS",psu);

			editAppSpecific("Continuous Contract", cc, pId);
			editRefLicProfAttribute(existingCarrierNum,"CONTINUOUS CONTRACT", cc);

			updateAppStatus("Temporarily Discontinued", "", pId);
			
			editRefLicProfAttribute(existingCarrierNum, "INTRASTATE AUTHORITY STATUS", "Temporarily Discontinued");
			editRefLicProfAttribute(existingCarrierNum, "INTRASTATE AUTHORITY STATUS DA", dateAdd(effDate, 0));
			
			cLic = getRefLicenseProf(existingCarrierNum);
			
			//get refLp to edit standard fields for ACA display
			cLic.setAcaPermission(null);//the system interprets null as Y (this will display in ACA)
			cLic.setInsuranceCo("Temporarily Discontinued");
			
			cLic.setLicenseBoard(opType);
			
			break;
		case "PERMDISCON":
			effDate = AInfo["Desired Effective Date"];
			updateAppStatus("Permanently Discontinued", "", pId);
			
			editRefLicProfAttribute(existingCarrierNum, "INTRASTATE AUTHORITY STATUS", "Permanently Discontinued");
			editRefLicProfAttribute(existingCarrierNum, "INTRASTATE AUTHORITY STATUS DA", dateAdd(effDate, 0));
			
			cLic = getRefLicenseProf(existingCarrierNum);
			
			//get refLp to edit standard fields for ACA display
			cLic.setAcaPermission("N");//the system interprets null as Y (this will display in ACA)
			cLic.setInsuranceCo("Permanently Discontinued");
			
			break;
		case "REINSTATE":
			effDate = AInfo["Reinstate Service Effective Date"];
			updateAppStatus("Active", "", pId);
			
			editRefLicProfAttribute(existingCarrierNum, "INTRASTATE AUTHORITY STATUS", "Active");
			editRefLicProfAttribute(existingCarrierNum, "INTRASTATE AUTHORITY STATUS DA", dateAdd(effDate, 0));
			
			cLic = getRefLicenseProf(existingCarrierNum);
			
			//get refLp to edit standard fields for ACA display
			cLic.setAcaPermission(null);//the system interprets null as Y (this will display in ACA)
			cLic.setInsuranceCo("Active");
			
			break;
		case "EQUIPLIST":
			removeASITable("EQUIPMENT LIST", pId);
			copyASITables(capId, pId);
			break;
		default: break;
	}
	modifyRefLPAndSubTran(pId, cLic);
}

function modifyRefLPAndSubTran(itemCap, newLic) {
	myResult = aa.licenseScript.editRefLicenseProf(newLic);
	if (myResult.getSuccess()) {
		logDebug("Successfully updated reference LP");
	}
	else {
		logDebug("Error updating reference lp: " + myResult.getErrorMessage()); 
		return false;
	}
	
	// copy lic number from reference LP to transaction LP 
	var capLicenseResult = aa.licenseProfessional.getLicenseProf(itemCap);
	var capLicenseArr = new Array();
	if(capLicenseResult.getSuccess()){
		capLicenseArr = capLicenseResult.getOutput();
	}
		
	if(capLicenseArr != null){
		for(capLic in capLicenseArr){
			if(capLicenseArr[capLic].getLicenseType()+"" == newLic.getLicenseType()+""){
				aa.licenseProfessional.removeLicensedProfessional(capLicenseArr[capLic]);
				break;
			}
			
		}
		capListResult = aa.licenseScript.associateLpWithCap(itemCap,newLic);
		if (capListResult.getSuccess()) {
			logDebug("Successfully associated ref LP with record")
		}
		else {
			logDebug("Error associating ref lp with record " + capListResult.getErrorMessage())
		}
	}
}

function populateDecalNumbers() {
	
	eqListTable = loadASITable("EQUIPMENT LIST");
	newTable = new Array();
	for (var eachRow in eqListTable) {
		thisRow = eqListTable[eachRow];
		newRow = new Array();
		newRow["Type"] = new asiTableValObj("Type", thisRow["Type"].fieldValue, "N");
		newRow["Year"] = new asiTableValObj("Year", thisRow["Year"].fieldValue, "N");
		newRow["Make"] = new asiTableValObj("Make", thisRow["Make"].fieldValue, "N");
		newRow["Serial#/VIN"] = new asiTableValObj("Serial#/VIN", thisRow["Serial#/VIN"].fieldValue, "N");
		newRow["GVWR"] = new asiTableValObj("GVWR", thisRow["GVWR"].fieldValue, "N");
		newRow["Unit/Fleet #"] = new asiTableValObj("Unit/Fleet #", thisRow["Unit/Fleet #"].fieldValue, "N");
		newRow["License Plate State"] = new asiTableValObj("License Plate State", thisRow["License Plate State"].fieldValue, "N");
		newRow["Leased Vehicle Owner"] = new asiTableValObj("Leased Vehicle Owner", thisRow["Leased Vehicle Owner"].fieldValue, "N");
		newRow["Vehicle Action"] = new asiTableValObj("Vehicle Action", thisRow["Vehicle Action"].fieldValue, "N");
		newRow["Status"] = new asiTableValObj("Status", thisRow["Status"].fieldValue, "N");
		vAction = "" + thisRow["Vehicle Action"];
		var vStatus = "" + thisRow["Status"];
		if (matches(vAction, "Add Vehicle", "Replacement Decal", "Renew") && vStatus == "Active") {
			sessID = getSessionID();
			nextNumber = getNextMaskedSeq(sessID, "MPSC Decal Mask", "MPSC Decal Sequence", "Agency");
			newRow["MPSC Decal #"] = new asiTableValObj("MPSC Decal #", "" + nextNumber, "Y");
		}
		else {
			newRow["MPSC Decal #"] = new asiTableValObj("MPSC Decal #", thisRow["MPSC Decal #"].fieldValue, "Y");
		}
		newRow["Equipment Use"] = new asiTableValObj("Equipment Use", thisRow["Equipment Use"].fieldValue, "N");
		newRow["Plate Fee"] = new asiTableValObj("Plate Fee", thisRow["Plate Fee"].fieldValue, "N");
		newTable.push(newRow);
	}
	removeASITable("EQUIPMENT LIST");
	addASITable("EQUIPMENT LIST", newTable);
}

function doesStatusExistInTaskHistory(tName, tStatus) {

	histResult = aa.workflow.getWorkflowHistory(capId, tName, null);
	if (histResult.getSuccess()) {
		var taskHistArr = histResult.getOutput();
		var found = 0;
		for (var xx in taskHistArr) {
			taskHist = taskHistArr[xx];
			if (tStatus.equals(taskHist.getDisposition()))
				found++;
		}
		if (found > 1) return true;
		return false;
		
	}
	else {
		logDebug("Error getting task history : " + histResult.getErrorMessage());
	}
	return false;
}

function editAppSpecific4ACA(itemName, itemValue) {

    var i = cap.getAppSpecificInfoGroups().iterator();

    while (i.hasNext()) {
        var group = i.next();
        var fields = group.getFields();
        if (fields != null) {
            var iteFields = fields.iterator();
            while (iteFields.hasNext()) {
                var field = iteFields.next();
                if ((useAppSpecificGroupName && itemName.equals(field.getCheckboxType() + "." + field.getCheckboxDesc())) || itemName.equals(field.getCheckboxDesc())) {
                    field.setChecklistComment(itemValue);
                }
            }
        }
    }
}

function removeParent(parentAppNum) {//removes the current application from the parent
	var getCapResult = aa.cap.getCapID(parentAppNum);
	if (getCapResult.getSuccess()) {
		var parentId = getCapResult.getOutput();
		var delinkResult = aa.cap.removeAppHierarchy(parentId, capId);
		if (delinkResult.getSuccess())
			logDebug("Successfully removed linked from Parent Application : " + parentAppNum);
		else
			logDebug("**ERROR: removing link from parent application parent cap id (" + parentAppNum + "): " + linkResult.getErrorMessage());
	} else {
		logDebug("**ERROR: getting parent cap id (" + parentAppNum + "): " + getCapResult.getErrorMessage())
	}
}

function getTodayString(){
    var toDay = new Date();
    var tDay = ((toDay.getMonth()+1)+"/"+toDay.getDate()+"/"+toDay.getFullYear());
    return tDay;
}

function getTodayJs(){
    var toDay = new Date();
    var tDayJs = new Date((toDay.getMonth()+1)+"/"+toDay.getDate()+"/"+toDay.getFullYear());
    return tDayJs;
}

function updateRefLpFromTransLp() {
	capLicenseResult = aa.licenseScript.getLicenseProf(capId);
	if (capLicenseResult.getSuccess())
		capLicenseArr = capLicenseResult.getOutput();
	else { 
		logDebug("**ERROR: getting lic prof: " + capLicenseResult.getErrorMessage()); 
		return false;
	}
	if (!capLicenseArr.length) {
		logDebug("WARNING: no license professional available on the application:"); 
		return false; 
	}
	licProfScriptModel = capLicenseArr[0];
	licModel = licProfScriptModel.getLicenseProfessionalModel();
	rlpId = licProfScriptModel.getLicenseNbr();//this is the transactional LP license number, at update this is the same as the refLP license number.
	logDebug("Current transactional license number " + rlpId);
	
	existingCarrier = rlpId;
	logDebug("Existing carrier = " + existingCarrier);
	
	if (true) {
		
		existingCarrierNum = existingCarrier;
		var newLic = getRefLicenseProf(existingCarrierNum);//gets the refLP by license number. Using the TSI field but can be switched to used the rlpId
		if (!newLic) {
			logDebug("Existing carrier " + existingCarrierNum + " not found"); return;
		}
		logDebug("Modifying existing carrier " + existingCarrierNum);
		
		// update existing ref lp with all data from tran LP except MPSC#
		newLic.setAddress1(licProfScriptModel.getAddress1());
		newLic.setAddress2(licProfScriptModel.getAddress2());
		newLic.setAddress3(licProfScriptModel.getAddress3());
		newLic.setContactFirstName(licProfScriptModel.getContactFirstName());
		newLic.setContactLastName(licProfScriptModel.getContactLastName());
		newLic.setContactMiddleName(licProfScriptModel.getContactMiddleName());
		newLic.setAgencyCode(licProfScriptModel.getAgencyCode());
		newLic.setAuditDate(licProfScriptModel.getAuditDate());
		newLic.setAuditID(licProfScriptModel.getAuditID());
		newLic.setAuditStatus(licProfScriptModel.getAuditStatus());
		newLic.setBusinessLicense(licProfScriptModel.getBusinessLicense());
		newLic.setBusinessName(licProfScriptModel.getBusinessName());
		newLic.setCity(licProfScriptModel.getCity());
		newLic.setCityCode(licProfScriptModel.getCityCode());
		newLic.setCountryCode(licProfScriptModel.getCountryCode());
		newLic.setCountry(licProfScriptModel.getCountry());
		newLic.setEinSs(licProfScriptModel.getEinSs());
		newLic.setEMailAddress(licProfScriptModel.getEmail());
		newLic.setFax(licProfScriptModel.getFax());
		newLic.setLicenseType(licProfScriptModel.getLicenseType());
		newLic.setLicOrigIssDate(licProfScriptModel.getLicesnseOrigIssueDate());
		newLic.setPhone1(licProfScriptModel.getPhone1());
		newLic.setPhone2(licProfScriptModel.getPhone2());
		newLic.setSelfIns(licProfScriptModel.getSelfIns());
		newLic.setState(licProfScriptModel.getState());
		newLic.setLicState(licProfScriptModel.getState());
		newLic.setSuffixName(licProfScriptModel.getSuffixName());
		newLic.setZip(licProfScriptModel.getZip());
		newLic.setFein(licProfScriptModel.getFein());
		newLic.setSocialSecurityNumber(licProfScriptModel.getSocialSecurityNumber());
		newLic.setMaskedSsn(licProfScriptModel.getMaskedSsn());
		// newLic.setLicenseBoard(licProfScriptModel.getLicenseBoard());
		newLic.setBusinessName2(licProfScriptModel.getBusName2());
		
		/* ASI to LP */
		if(AInfo["Worker's Compensation Exempt"] != null) {
			if (AInfo["Worker's Compensation Exempt"] == "Yes" || AInfo["Worker's Compensation Exempt"] == "Y") {
				newLic.setWcExempt("Y");
			}
			else
				newLic.setWcExempt("N");
		}
		if(AInfo["Operation Type"] != null) {
			newLic.setLicenseBoard(AInfo["Operation Type"]);
		}
		
		/* LP Template to LP Template */
		attrList = licProfScriptModel.getAttributes()
		for ( i in attrList ) {
			thisAttr = attrList[i]
			name = ""+thisAttr.getAttributeName(); val="";
			// Exclude fields updated by ASI
			if( !matches(name,"AUTO TRANSPORT","HAZ MAT CARRIER", "HOUSEHOLD GOODS AUTHORITY", "PORTABLE STORAGE UNITS", "CONTINUOUS CONTRACT")) {
				val = ""+thisAttr.getAttributeValue()
				editRefLicProfAttribute(rlpId,name,val == "null" ? null : val)
			}
			/* -------not populating the bus lic and ins exp dates anymore.-------------
			if (name == "CARGO INSURANCE EXP DATE" && val != "" && val != "null") {
				newLic.setBusinessLicExpDate(aa.date.parseDate(val));
			}
			if (name == "PL/PD INSURANCE EXP DATE" && val != "" && val != "null") {
				newLic.setInsuranceExpDate(aa.date.parseDate(val));
			}*/
		}

		/* ASI to LP Template */
		if(AInfo["Auto Transport"] != null) 
			editRefLicProfAttribute(rlpId,"AUTO TRANSPORT",AInfo["Auto Transport"])
		if(AInfo["Hazardous Material"] != null) 
			editRefLicProfAttribute(rlpId,"HAZ MAT CARRIER",AInfo["Hazardous Material"])
		if(AInfo["Household Goods Authority"] != null) 
			editRefLicProfAttribute(rlpId,"HOUSEHOLD GOODS AUTHORITY",AInfo["Household Goods Authority"])
		if(AInfo["Continuous Contract"] != null) 
			editRefLicProfAttribute(rlpId,"CONTINUOUS CONTRACT",AInfo["Continuous Contract"])
		if(AInfo["Portable Storage Units"] != null) 
			editRefLicProfAttribute(rlpId,"PORTABLE STORAGE UNITS",AInfo["Portable Storage Units"]);	
	}
	return rlpId
}

function activeVehicleCheck(){
	if(wfTask == "Certification" && wfStatus == "Issued"){
		equipTable = loadASITable("EQUIPMENT LIST");
		var iaVehicles = 0;
		iaVehicles = countASITRows(equipTable, "Status", "EXCLUDE", "Active")//CG 12.17.2015 -- optional parameters = cName, filterType, cValue, cName2, filterType2, cValue2
		if(iaVehicles > 0){
			var iavmsg = "There is "+iaVehicles+" vehicle(s) not set to ACTIVE. Canceled Issuance, please update ASIT.";
			logDebug(iavmsg);
			showMessage = true;
			comment(iavmsg);
			cancel = true;
		}
	}
}

function updateCertEqListFromRenewal(){
	logDebug("Trying to get cap id from Renewal");
	var capID = getCapId();
	
	
	var capResult = aa.cap.getCap(capID);
	if (capResult.getSuccess()) {
		var authCap = capResult.getOutput();
	}
	
	logDebug("Renewal capID: "+capID);
	logDebug("Trying to get cap id of carriers Certificate of Authority");
	var result = aa.cap.getProjectByChildCapID(capID, "Renewal", "Complete");
	if(result.getSuccess()){
		projectScriptModels = result.getOutput();
		projectScriptModel = projectScriptModels[0];
		var cCapID = projectScriptModel.getProjectID();
		var aCapID = aa.cap.getCap(cCapID).getOutput();
	}

	
	if (cCapID != null) {
		var aAltId = aCapID.getCapModel().getAltID();
		logDebug("Found Certificate of Authority: "+aAltId);
		logDebug("Replacing Eq List on Certificate with Eq List from Renewal");
		removeASITable("EQUIPMENT LIST", cCapID);
		copyASITables(capId, cCapID);
		
		//get expiration date from Certificate of Authority
		var expResult = aa.expiration.getLicensesByCapID(cCapID);
		if(expResult.getSuccess()){
			thisExp = expResult.getOutput();
			var authExpDate = thisExp.getExpDate();
			var aYear = parseInt(authExpDate.getYear());
		}

		//update Attr Intrastate Authority Expiration Date
		
		var aCapStatus = aCapID.getCapStatus(); logDebug("aCapStatus: "+aCapStatus);
		if(!matches(aCapStatus,"Active","Temporarily Discontinued")){
			//update auth status
			updateAppStatus("Active","",cCapID);
			//update Attr Intrastate Authority Status
			editRefLicProfAttribute(aAltId, "INTRASTATE AUTHORITY STATUS", "Active");
			//update Attr Intrastate Authority Status Date
			editRefLicProfAttribute(aAltId, "INTRASTATE AUTHORITY STATUS DA", dateAdd(null, 0));
			//update expiration
			editRefLicProfAttribute(aAltId,"INTRASTATE AUTHORITY EXPIRATIO","12/31/"+aYear);
			//get ref lp
			var cLic = getRefLicenseProf(aAltId);
			if(cLic){
				//update InsuranceCo
				cLic.setInsuranceCo("Active");
				//update ACAPermission
				cLic.setAcaPermission(null);//the system interprets null as Y (this will display in ACA)
			}
		}else{
			//update Attr Intrastate Authority Status
			editRefLicProfAttribute(aAltId, "INTRASTATE AUTHORITY STATUS", aCapStatus);
			//update expiration
			editRefLicProfAttribute(aAltId,"INTRASTATE AUTHORITY EXPIRATIO","12/31/"+aYear);
			//get ref lp
			var cLic = getRefLicenseProf(aAltId);
			if(cLic){
				//update InsuranceCo
				cLic.setInsuranceCo(aCapStatus);
				//update ACAPermission
				cLic.setAcaPermission(null);//the system interprets null as Y (this will display in ACA)
			}
		}
		//write ref lp update and replace trans lp on cert
		modifyRefLPAndSubTran(cCapID, cLic);
		
		
	}else{
		logDebug("Did not find Certificate of Authority for Renewal");
	}
}

/*****
Function: pinRegistration

- This function will:
- Lookup the public user to associate to the record
- Lookup the parent record by PIN (ID1 + ID3)
- Find the contact on the record with the specified contact type
- Create a reference contact if it does not already exist
- Associate the ref contact to the public user

Example:

Parameters:
pin - B1_PER_ID1 + B1_PER_ID3 of the record you are linking to
publicUserId - Accela User ID for the public user (i.e. PUBLICUSERXXXX)

Optional:
setAsCreator - true or false, set the public user as the Record creator
linkFirstLP - true or false, associate the first ref LP to the public user
linkFirstContact - true or false, associate the first contact with the specified contact to the public user
contactType - REQUIRED if linkFirstContact, the contact type to associate to the public user

pinRegistration ("DUB160004N", "PUBLICUSER119527", true, true, true, "Member");

 *****/

function pinRegistration(pin, publicUserId) {
	if (arguments.length > 2) {
		setAsCreator = arguments[2];
	} else {
		setAsCreator = true;
	}
	if (arguments.length > 3) {
		linkFirstLP = arguments[3];
	} else {
		linkFirstLP = true;
	}
	if (arguments.length > 4) {
		linkFirstContact = arguments[4];
	} else {
		linkFirstContact = true;
	}
	if (arguments.length > 5) {
		contactType = arguments[5];
	}

	// get the public user
	var puserObj = aa.publicUser.getPublicUserByPUser(publicUserId).getOutput();
	if (puserObj) {
		var puserSeq = puserObj.getUserSeqNum();
		logDebug("public user: " + puserObj);
	} else {
		logDebug("Public user does not exist. " + publicUserId);
		return false;
	}

	// get parent record
	var parentCapIdResult = aa.cap.getCapID(pin.substr(0, 5), "00000", pin.substr(5, 10));
	if (!parentCapIdResult.getSuccess()) {
		logDebug("Could not find parent record with PIN: " + pin);
		return false;
	}

	var parentCapId = parentCapIdResult.getOutput();

	if (linkFirstContact) {
		// find the record contact with the correct contact type
		var refContactNbr = null;
		var contacts = aa.people.getCapContactByCapID(parentCapId).getOutput();
		var refContactNbr;
		var recContactExists = false;

		// if contactType was not specified, get the first contact
		if (contactType) {
			for (c in contacts) {
				if (contactType && contacts[c].getCapContactModel().getContactType() == contactType) {
					refContactNbr = contacts[c].getCapContactModel().getRefContactNumber();
					recContactExists = true;
					// create ref contact if the record contact is not already linked to reference
					if (!refContactNbr) {
						logDebug("Ref contact does not exist, creating one.")
						var contactTypeArray = new Array(contactType);
						createRefContactsFromCapContactsAndLink(parentCapId, contactTypeArray, iArr, false, false, comparePeopleStandard);
					}
					break;
				}
			}
			if (!recContactExists)
				logDebug("No record contact exists with type: " + contactType);
		} else {
			logDebug("No contact type specified. No contact was linked to public user.")
		}

		// associate the ref contact with the public user
		var linkResult = aa.licenseScript.associateContactWithPublicUser(puserSeq, refContactNbr);
		logDebug("Successfully associated contact with public user: " + refContactNbr);
	}

	// find the LP and associate to the public user
	if (linkFirstLP) {
		var licProfArray = getLicenseProfessional(parentCapId);
		var licProf = licProfArray[0];
		if (licProf) {
			var refLP = aa.licenseScript.getRefLicensesProfByLicNbr(servProvCode, licProf.licenseNbr).getOutput();
			if (refLP) {
				aa.licenseScript.associateLpWithPublicUser(puserObj, refLP[0]);
				logDebug("Successfully associated LP with public user.");
			} else {
				logDebug("No reference LP exists to associate to the public user.");
			}
		} else {
			logDebug("No LP on record to associate to public user.");
		}
	}

	// make the public user the record creator
	if (setAsCreator) {
		var createdByResult = aa.cap.updateCreatedAccessBy4ACA(parentCapId, publicUserId, "Y", "N");
		if (!createdByResult.getSuccess()) {
			logDebug("Error updating created by ACA: " + createdbyResult.getErrorMessage());
		} else {
			logDebug("Successfully set public user as record creator.");
		}
	}
}

function doCreateRefLP(){
	histResult = aa.workflow.getWorkflowHistory(capId, null);
	if(histResult.getSuccess()){
		var taskHistArr = histResult.getOutput();
		var found = 0;
		for(var xx in taskHistArr){
			taskHist = taskHistArr[xx];
			var thisTaskName = taskHist.getTaskDescription();
			var thisTaskStatus = taskHist.getDisposition();
			logDebug("thisTaskName: "+thisTaskName+", has a status: "+thisTaskStatus);
			if(matches(thisTaskName,"Application Review") && matches(thisTaskStatus,"Incomplete Notice 1","Accepted")){
				found++;
				if(found > 1){
					logDebug("Count: "+found);
					return false;
				}
			}
		}
	}
	else {
		logDebug("Error getting task history : " + histResult.getErrorMessage());
	}
	return true;
}

function checkForExistingCertOfAuth(){
	var exists = false;
	mpscNum = getMPSCNumFromLP();
	if(mpscNum != null){
		var existResult = aa.cap.getCapID(mpscNum).getOutput();
		if(existResult){
			logDebug("found existing certificate of authority")
			exists = true;
		}
	}
	return exists;
}

function updateRefCarrierFieldsForAca(licNum){//no param needed when running on ref lp update, licNum param needed when running on non ref lp events
	if(arguments.length < 1){
		licNum = LicenseModel.stateLicense;
	}
	var refLicObj = new licenseProfObject(licNum,"Carrier");
	if(refLicObj){
		var ias = refLicObj.getAttribute("Intrastate Authority Status");
		
		refLicObj.refLicModel.setInsuranceCo(ias);
		
		if(matches(ias,"Active","Revoked","Temporarily Discontinued","Suspended")){
			refLicObj.refLicModel.setAcaPermission(null);
		}else{
			refLicObj.refLicModel.setAcaPermission("N");
		}
		refLicObj.updateRecord();
	}
}

function assessRenewalLateFees(authCapId){
	//get expiration date from Certificate of Authority
	var expResult = aa.expiration.getLicensesByCapID(authCapId);
	if(expResult.getSuccess()){
		thisExp = expResult.getOutput();
		var authExpDate = thisExp.getExpDate();
		
		//get the the expiration year
		var authExpYear = parseInt(authExpDate.getYear());
		logDebug("authExpYear: "+authExpYear);
		
		//get todays date
		var tDate = new Date();
		logDebug("tDate: "+tDate);
		
		//get current year
		var tYear = tDate.getFullYear();
		logDebug("tYear: "+tYear);
		
		//get current month
		var tMonth = tDate.getMonth()+1;
		logDebug("tMonth: "+tMonth);
		
		//get current date
		var tDayDate = tDate.getDate();
		logDebug("tDayDate: "+tDayDate);
		
		if(authExpYear == tYear && tMonth == 12 && tDayDate > 1 ){
			updateFee("LATEFEE", "MCD_AUTH_RENEW", "FINAL", 1, "Y");
		}else if(authExpYear == tYear-1){
			updateFee("LATEFEE", "MCD_AUTH_RENEW", "FINAL", 1, "Y");
			updateFee("PENALTY", "MCD_AUTH_RENEW", "FINAL", tMonth, "Y");
		}else{
			logDebug("Renewal is not Late.");
		}
	}else{
		logDebug("Could not get Certificate of Authority to check expiration date for late fees");
		return;
	}
}

function getParentLicenseCapID(capid) {
	if (capid == null || aa.util.instanceOfString(capid)) { return null; }
	var result = aa.cap.getProjectByChildCapID(capid, "Renewal", "Incomplete");
	if(result.getSuccess() ) {
		projectScriptModels = result.getOutput();
		projectScriptModel = projectScriptModels[0];
		return projectScriptModel.getProjectID();
	} else {
		return getParentCapVIAPartialCap(capid);
	}
}

function updateRelationshipToAuthority(){
	var cved = getMPSCNumFromLP();
	logDebug("Relating : "+capIDString+" to the parent Authority: "+cved);
	var urrResult = updateRecordRelation(cved, capIDString, "ADDITION");
	
	if(urrResult){
		logDebug("Relationship updated successfully")
	}else{
		logDebug("***WARNING*** Relationship was not updated")
	}
}

function removeCapContacts(recordCapId){
	var cons = aa.people.getCapContactByCapID(recordCapId).getOutput();
	for(x in cons){
		conSeqNum = cons[x].getPeople().getContactSeqNumber();
		aa.people.removeCapContact(recordCapId, conSeqNum);
	}
}

function removeCapAddresses(capId){
	var addrScriptResult = aa.address.getAddressByCapId(capId);
	if(addrScriptResult.getSuccess()){
		var authAddrList = addrScriptResult.getOutput()
		if(authAddrList.length > 0){
			//get address ID
			for(addr in authAddrList){
				var thisAddr = authAddrList[addr];
				var thisAddrId = thisAddr.getAddressId();
				//remove address from Authority
				aa.address.removeAddress(capId, thisAddrId);
				logDebug("Addresses successfully removed from cap")
			}
		}else{
			logDebug("No addresses on cap")
		}
	}else{
		logDebug("Could not get address list from cap")
	}
}

function viewObj(obj){
	for(var key in obj){
		if(typeof obj[key] == 'function')
			logDebug(key + '()');
		else
			logDebug(key + ": " + obj[key]);
	}
}