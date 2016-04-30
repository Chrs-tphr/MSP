partialCapId = getIncompleteCapId(); logDebug(partialCapId);
parentCapId = aa.env.getValue("ParentCapID"); logDebug(parentCapId);
if(partialCapId && parentCapId){copyPeopleForLic(parentCapId, partialCapId);}