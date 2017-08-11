if(AInfo("Start Date") <= dateAdd(null,0) && AInfo("End Date") >= dateAdd(null,0)){//set initial 72 Hour Permit status
	updateAppStatus("Active", "set by script");
}else if(AInfo("Start Date") > dateAdd(null, 0)){
	updateAppStatus("Pending", "set by script");
}else{
	updateAppStatus("Expired", "set by script");
}

/*original standard choice in SUPP
true ^ showDebug = 3; tDay = new Date(); today = dateFormatted(tDay.getMonth()+1,tDay.getDate(),tDay.getFullYear());
true ^ tomorrow = dateAdd(today,1);
{Start Date} && {Start Date} == today ^ updateAppStatus("Active", "set by script");
{Start Date} && {Start Date} == tomorrow ^ updateAppStatus("Active", "set by script");
{Start Date} && Date.parse({Start Date}) > Date.parse(tomorrow) ^ updateAppStatus("Pending", "set by script");
*/

/*modified standard choice currently in SUPP
{Start Date} <= dateAdd(null,0) && {End Date} >= dateAdd(null,0) ^ updateAppStatus("Active", "set by script");
{Start Date} > dateAdd(null,0) ^ updateAppStatus("Pending", "set by script");
{Start Date} < dateAdd(null,-2) ^ updateAppStatus("Expired", "set by script");
*/