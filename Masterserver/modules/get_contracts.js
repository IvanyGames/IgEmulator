var ltxElement = require('ltx').Element

exports.module = function (stanza) {

	var profile_id = Number(stanza.children[0].children[0].attrs.profile_id);

	var profileObject;

	if (Number.isNaN(profile_id)) {
		profileObject = global.users.jid[stanza.attrs.from];
	} else {
		profileObject = global.users._id[profile_id];
	}

	if (!profileObject) {
		//console.log("["+stanza.attrs.from+"][GetContracts]:Profile not found");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
		return;
	}

	var elementGetContracts = new ltxElement("get_contracts");
	var contractObject = profileObject.contracts;
	elementGetContracts.c("contract", { profile_id: profileObject._id, rotation_id: contractObject.rotation_id, contract_name: contractObject.contract_name, current: contractObject.current, total: contractObject.total, rotation_time: contractObject.rotation_time, status: contractObject.status, is_available: contractObject.is_available });
	global.xmppClient.response(stanza, elementGetContracts);
}