function copyRefIntrastateAuthStatusToTitle(){
	
	if (name == "INTRASTATE AUTHORITY STATUS" && val != "" && val != "null") {
		newLic.setTitle(val);
	}
}