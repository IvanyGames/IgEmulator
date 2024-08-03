var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var nickname = stanza.children[0].children[0].attrs.nickname;

    global.db.warface.profiles.findOne({ nick: nickname }, { projection: { "username": 1, "status": 1 } }, function (errProfile, resultProfile) {

        if (errProfile) {
            //console.log("[" + stanza.attrs.from + "][ProfileInfoGetStatus]:Failed to getting data from the database");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '1' });
            return;
        }

        if (!resultProfile) {
            //console.log("[" + stanza.attrs.from + "][ProfileInfoGetStatus]:Profile not found");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '2' });
            return;
        }

        var elementProfileInfoGetStatus = new ltxElement("profile_info_get_status", { nickname: nickname });
        var elementProfileInfo = elementProfileInfoGetStatus.c("profile_info");
        elementProfileInfo.c("info", { profile_id: resultProfile._id, online_id: resultProfile.username + "@" + global.config.masterserver.domain + "/GameClient", status: resultProfile.status });

        global.xmppClient.response(stanza, elementProfileInfoGetStatus);
    });
}