function createCertOfAuth() {
	mpscNum = getMPSCNumFromLP();
	if (mpscNum != null) {
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
			editRefLicProfAttribute(mpscNum,"INTRASTATE AUTHORITY STATUS","Active");
			editRefLicProfAttribute(mpscNum,"INTRASTATE AUTHORITY STATUS DA",cIDate);
			editRefLicProfAttribute(mpscNum,"INTRASTATE AUTH APP DATE",fileDate);
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
					var equipUse = thisRow["Equipment Use"].fieldValue;//gets equipement use to set plate fee instead of copying Plate Fee data
					newRow["Equipment Use"] = new asiTableValObj("Equipment Use", equipUse, "N");
					if (equipUse == "Household Goods") pFee = "50.00"
					else pFee = "100.00"
					newRow["Plate Fee"] = new asiTableValObj("Plate Fee", pFee, "N");
					newTable.push(newRow);
				}
				addASITable("EQUIPMENT LIST", newTable);
			}
		}
	}
}