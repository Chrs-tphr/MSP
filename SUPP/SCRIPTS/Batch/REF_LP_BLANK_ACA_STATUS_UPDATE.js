/*------------------------------------------------------------------------------------------------------/
| Program: Ref LP Date and Status Update.js  Trigger: Batch
| Client: MSP
|
| Frequency: ADHOC
|
| Desc: One time ref lp status and date update for ACA
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
|
| START: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
emailText = "";
maxSeconds = 50000;		// number of seconds allowed for batch processing, usually < 5*60
message = "";
br = "<br>";
debug = ""
emailAddress = ""
currentUserID = "ADMIN"
/*------------------------------------------------------------------------------------------------------/
| BEGIN Includes
/------------------------------------------------------------------------------------------------------*/
SCRIPT_VERSION = 2.0
eval(getMasterScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getMasterScriptText("INCLUDES_CUSTOM"));
eval("function logDebug(dstr) { aa.print(dstr+'<br>'); } function logMessage(dstr) { aa.print(dstr); }") 

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
batchJobName = "Test" //+ aa.env.getValue("BatchJobName");
wfObjArray = null;

batchJobID = 0;
if (batchJobResult.getSuccess()) {
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

/*****************************Test Params********************************



 ***********************************************************************/



/*----------------------------------------------------------------------------------------------------/
|
| End: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var timeExpired = false;
var startTime = startDate.getTime();			// Start timer
var systemUserObj = aa.person.getUser("ADMIN").getOutput();

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
	var msg = "";
	var count = 0;
	
	//get application for authority list
	var capResult = aa.cap.getByAppType("MCD", "Intrastate Motor Carrier", "Application", "NA");
	if (capResult.getSuccess()) {
		var myCaps = capResult.getOutput();
		logDebug("Processing " + myCaps.length + " records");
	} else {
		logDebug("ERROR: Getting records, reason is: " + capResult.getErrorType() + ":" + capResult.getErrorMessage());
	}
	
	//filter application for authority list by cap status
	for (index in myCaps){

		logDebug(msg);
		msg = "";

		// if(count>10)break;

		var cap = myCaps[index];
		var capId = cap.getCapID();

		var appId = capId.getCustomID();
		
		var capStatus = cap.getCapStatus();

		msg += "App: "+appId+", AppStatus: "+capStatus+", ";
		
		if(capStatus == "Approved")continue;
		//get trans lp
		var capLpList = aa.licenseProfessional.getLicensedProfessionalsByCapID(capId).getOutput();
		if(capLpList == null)continue;
		for(x in capLpList){
			//get lp license number
			var cvedNum = capLpList[x].getLicenseNbr();
		}
		if(matches(cvedNum,null,""))continue;
		if(doesRecordExist(cvedNum))continue;
		//get ref lp with trans lp lic number
		msg += "CVED#: "+cvedNum+", ";
		var refLPModel = getRefLicenseProf(cvedNum);
		if(refLPModel){
			count++;
			//clears fields previously being used to track insurance expiration for ACA
			refLPModel.setBusinessLicExpDate(null);//cargo insurance
			refLPModel.setInsuranceExpDate(null);//plpd insurance
			//clears Authority status for ACA
			refLPModel.setInsuranceCo(null);
			//update Attr Intrastate Authority Status
			editRefLicProfAttribute(cvedNum, "INTRASTATE AUTHORITY STATUS", null);
			//update trans LP Attr Intrastate Authority Status
			editLicProfAttribute(capId, cvedNum,"INTRASTATE AUTHORITY STATUS", null);
			//makes carrier not display in ACA
			refLPModel.setAcaPermission("N");

			//commit ref lp changes
			aa.licenseScript.editRefLicenseProf(refLPModel);
			
			msg += "Cleared Ref LP."
		}
	}
	logDebug("Processed "+count+" CVED #'s");
}

function elapsed() {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    return ((thisTime - startTime) / 1000)
}

function getParam(pParamName) {
    var ret = "" + aa.env.getValue(pParamName);
    logDebug("PARAMETER: "+ pParamName + " = " + ret);
    return ret;
}