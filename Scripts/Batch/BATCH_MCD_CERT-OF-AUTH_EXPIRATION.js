/******* Testing *******
aa.env.setValue("appGroup","MCD");
aa.env.setValue("appTypeType","Intrastate Motor Carrier");
aa.env.setValue("appSubtype","Certificate of Authority");
aa.env.setValue("appCategory","NA");
aa.env.setValue("appStatus","Active")
aa.env.setValue("expStatus","Active")
***********************/
/*------------------------------------------------------------------------------------------------------/
| Program: Batch Expiration.js  Trigger: Batch
| Client: Michigan MCD
|
| Desc: WHEN: MCD/Intrastate Motor Carrier/Certificate of Authority/NA
|		(Renewal Info::Expiration Status) = "Active" and (Renewal Info::Expiration Date) = "12/31/current year".
|		and (ASI::MOTOR CARRIER OPERATIONS::Operation Type) = General Commodities) and (LP::Interstate UCR Status = Active)
| 
|	 	THEN: Update expiration status and date. Set expiration status to "Active" and expiration date to "Expiration Date + 1 year".
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
|
| START: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
emailText = "";
maxSeconds = 4.5 * 60;		// number of seconds allowed for batch processing, usually < 5*60
message = "";
br = "<br>";
/*------------------------------------------------------------------------------------------------------/
| BEGIN Includes
/------------------------------------------------------------------------------------------------------*/
SCRIPT_VERSION = 2.0

eval(getMasterScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_BATCH"));
eval(getMasterScriptText("INCLUDES_CUSTOM"));

function getScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
	return emseScript.getScriptText() + "";
}

function getMasterScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(),vScriptName);
	return emseScript.getScriptText() + "";
}

/*------------------------------------------------------------------------------------------------------/
|
| END: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
showDebug = true//aa.env.getValue("showDebug").substring(0,1).toUpperCase().equals("Y");

sysDate = aa.date.getCurrentDate();
batchJobResult = aa.batchJob.getJobID()
batchJobName = aa.env.getValue("BatchJobName");
wfObjArray = null;

batchJobID = 0;
if (batchJobResult.getSuccess()){
  batchJobID = batchJobResult.getOutput();
  logDebug("Batch Job " + batchJobName + " Job ID is " + batchJobID);
}
else
  logDebug("Batch job ID not found " + batchJobResult.getErrorMessage());

/*----------------------------------------------------------------------------------------------------/
|
| Start: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/

var appGroup = getParam("appGroup");							//   app Group to process {Licenses}
var appTypeType = getParam("appTypeType");						//   app type to process {Rental License}
var appSubtype = getParam("appSubtype");						//   app subtype to process {NA}
var appCategory = getParam("appCategory");						//   app category to process {NA}
var appStatus = getParam("appStatus");
var expStatus = getParam("expStatus");
var emailAddress = getParam("emailAddress");					// email to send report
var sendEmailToContactTypes = getParam("sendEmailToContactTypes");// send out emails?
var emailTemplate = getParam("emailTemplate");					// email Template

/*----------------------------------------------------------------------------------------------------/
|
| End: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var timeExpired = false;

var startTime = startDate.getTime();			// Start timer
var systemUserObj = aa.person.getUser("ADMIN").getOutput();

if (appGroup=="")	appGroup="*";
if (appTypeType=="")	appTypeType="*";
if (appSubtype=="")	appSubtype="*";
if (appCategory=="")	appCategory="*";
var appType = appGroup+"/"+appTypeType+"/"+appSubtype+"/"+appCategory;

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

logDebug("Start of Job");

if (!timeExpired) mainProcess();

logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");

if (emailAddress.length)
	aa.sendMail("noreply@accela.com", emailAddress, "", batchJobName + " Results", emailText);

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

function mainProcess() {
	var updatedRecs = 0
	var today = new Date();
	var thisYear = today.getFullYear()
	aaExpDate = aa.util.parseDate("12/31/"+thisYear) 
	//aaExpDate = aa.util.parseDate("04/21/2016")		//TESTING

	var capModelResult = aa.cap.getCapModel();
	if (capModelResult.getSuccess()) {
		var capModel = capModelResult.getOutput();
		capModel.setCapStatus(appStatus);
		var capTypeModel = capModel.getCapType();
		if (appGroup != "*") capTypeModel.setGroup(appGroup);
		if (appTypeType != "*") capTypeModel.setType(appTypeType);
		if (appSubtype != "*") capTypeModel.setSubType(appSubtype);
		if (appCategory != "*") capTypeModel.setCategory(appCategory);
		capModel.setCapType(capTypeModel);
		capExpModel = capModel.getB1ExpirationModel()
		capExpModel.setExpStatus(expStatus)	
		capExpModel.setExpDate(aaExpDate)
		capModel.setB1ExpirationModel(capExpModel)
		capResult = aa.cap.getCapIDListByCapModel(capModel);
	}
	if (!capResult.getSuccess()) {
		logDebug("ERROR: Getting records, reason is: " + capResult.getErrorMessage()) ;
		return false
	} 

	recList = capResult.getOutput();
	logDebug("Processing " + recList.length + " " + appType + " record(s)")
	for (i in recList)  {
		statusUCR = ""
		oppType = ""
		if (elapsed() > maxSeconds) {
			// only continue if time hasn't expired
			logDebug("A script time-out has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.") ;
			timeExpired = true ;
			break;
		}
		thisRec =recList[i]
		capId = thisRec.getCapID();
		tmpCapObj = aa.cap.getCap(capId)
		if (!tmpCapObj.getSuccess()){
			logDebug("WARNING: Could not get Cap Object for "+capId)
			continue;
		} 
		capModelObj = tmpCapObj.getOutput().getCapModel()
		altId = capModelObj.getAltID()
		
		//Check ASI field Operation Type
		asiObj = aa.appSpecificInfo.getAppSpecificInfos(capId, "MOTOR CARRIER OPERATIONS", "Operation Type")
		oppType = asiObj.getSuccess() && asiObj.getOutput().length > 0 ? ""+(asiObj.getOutput())[0].getChecklistComment() : ""
		
		if (oppType != "General Commodities") continue;
		
		//Check LP Template field INTERSTATE UCR STATUS
		capLicenseResult = aa.licenseScript.getLicenseProf(capId);
		capLicenseArr = new Array()
		if (capLicenseResult.getSuccess())
			capLicenseArr = capLicenseResult.getOutput();
			
		if (capLicenseArr.length < 1) {
			logDebug("WARNING: no license professional available on the application: " + altId); 
			continue;
		}

		attrList = capLicenseArr[0].getAttributes()
		for ( i in attrList ) {
			thisAttr = attrList[i]
			if( matches(""+thisAttr.getAttributeName(),"INTERSTATE UCR STATUS")) {
				statusUCR = ""+thisAttr.getAttributeValue()
				break;
			}
		}
		if (statusUCR != "Active") continue;
		//logDebug(altId + " [Operation Type: " + oppType + "] [Interstate UCR Status: " + statusUCR + "]")
		licEditExpInfo("Active","12/31/"+(thisYear+1))
		updatedRecs++
	}
	logDebug("Successfully updated " + updatedRecs + " record(s)")
}