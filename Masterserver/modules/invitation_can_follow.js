var ltxElement = require('ltx').Element

exports.module = function (stanza) {

	var profileObject = global.users.jid[stanza.attrs.from];

	if (!profileObject) {
		//console.log("["+stanza.attrs.from+"][InvitationCanFollow]:Profile not found");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
		return;
	}	

    var nickname = stanza.children[0].children[0].attrs.nickname;
    var profile_id = Number(stanza.children[0].children[0].attrs.profile_id);

    global.xmppClient.response(stanza, new ltxElement("invitation_can_follow", { nickname: nickname, profile_id: profile_id }));
}

//3 - Комната заполнена, подключение невозможно
//5 - Несоответствие версий