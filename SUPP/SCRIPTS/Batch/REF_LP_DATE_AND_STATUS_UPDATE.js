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

var LIC_PROF_UDAPTE_DATA = getParam("inputDataFile");
var DELIM = getParam("delimiter");
var emailAddress = getParam("emailAddress");		

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
	
	var count = 0;
	
	var capResult = aa.cap.getByAppType("MCD", "Intrastate Motor Carrier", "Certificate of Authority", "NA");
	if (capResult.getSuccess()) {
		var myCaps = capResult.getOutput();
		logDebug("Processing " + myCaps.length + " records");
	} else {
		logDebug("ERROR: Getting records, reason is: " + capResult.getErrorType() + ":" + capResult.getErrorMessage());
	}
	for (index in myCaps){
		var msg = "";
		var cap = myCaps[index];
		var capId = cap.getCapID();
		var cvedNum = capId.getCustomID();
		msg += "CVED#: "+cvedNum+", ";
		var refLicObj = new licenseProfObject(cvedNum,"Carrier");
		if(refLicObj){
			count++;
			var ias = refLicObj.getAttribute("Intrastate Authority Status");
			msg += "ias: "+ias;
			refLicObj.refLicModel.setBusinessLicExpDate(null);
			refLicObj.refLicModel.setInsuranceExpDate(null);
			refLicObj.refLicModel.setInsuranceCo(ias);
			if(matches(ias,"Active","Revoked","Temporarily Discontinued","Suspended")){
				refLicObj.refLicModel.setAcaPermission(null);
			}else{
				refLicObj.refLicModel.setAcaPermission("N");
			}
			refLicObj.updateRecord();
		}
		logDebug(msg);
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