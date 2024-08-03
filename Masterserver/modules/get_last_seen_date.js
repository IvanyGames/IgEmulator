var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][GetLastSeenDate]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    var nickname = stanza.children[0].children[0].attrs.nickname;
	var profile_id = stanza.children[0].children[0].attrs.profile_id;
	
	var dbQuery;
	if(nickname){
		dbQuery = { nick: nickname };
	}else{
		dbQuery = { _id: Number(profile_id) };
	}

    global.db.warface.profiles.findOne(dbQuery, { projection: { "last_seen_date": 1 } }, function (errProfile, resultProfile) {

        if (errProfile) {
            //console.log("[" + stanza.attrs.from + "][GetLastSeenDate]:Failed to getting data from the database");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '2' });
            return;
        }

        if (!resultProfile) {
            //console.log("[" + stanza.attrs.from + "][GetLastSeenDate]:Profile not found");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '3' });
            return;
        }

        global.xmppClient.response(stanza, new ltxElement("get_last_seen_date", { nickname: nickname, profile_id: profile_id, last_seen: resultProfile.last_seen_date }));
    });
}