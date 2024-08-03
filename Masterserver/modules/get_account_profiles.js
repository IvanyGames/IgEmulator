var ltxElement = require('ltx').Element

exports.module = function (stanza) {

	var version = stanza.children[0].children[0].attrs.version;
	var user_id = stanza.children[0].children[0].attrs.user_id;
	var token = stanza.children[0].children[0].attrs.token;

	var username = stanza.attrs.from.split("@")[0];

	if (version && global.startupParams.ver && version != global.startupParams.ver) {
		//console.log("["+stanza.attrs.from+"][GetAccountProfiles]:Version mismatch");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
		return;
	}

	if (user_id != username && user_id != "0") {
		//console.log("["+stanza.attrs.from+"][GetAccountProfiles]:UserId mismatch");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "2" });
		return;
	}

	//if(token != connection.active_token){
	//	console.log("["+stanza.attrs.from+"][GetAccountProfiles]:Active token mismatch");	
	//	global.xmppClient.responseError(stanza, {type:'continue', code:"8", custom_code:"3"});
	//	return;
	//}

	global.db.warface.profiles.findOne({ username: username }, { projection: { "nick": 1 } }, function (errProfile, resultProfile) {

		if (errProfile) {
			//console.log("["+stanza.attrs.from+"][GetAccountProfiles]:Failed to getting data from the database");
			global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "3" });
			return;
		}

		var elementGetAccountProfiles = new ltxElement("get_account_profiles");

		if (resultProfile) {
			//console.log("["+stanza.attrs.from+"][GetAccountProfiles]:The profile has already been created");
			elementGetAccountProfiles.c("profile", { id: resultProfile._id, nickname: resultProfile.nick });
		} else {
			//console.log("["+stanza.attrs.from+"][GetAccountProfiles]:The profile has not been created yet");
		}

		global.xmppClient.response(stanza, elementGetAccountProfiles);
	});
}