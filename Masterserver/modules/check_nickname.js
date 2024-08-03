var ltxElement = require('ltx').Element

var RegExpNameRU = new RegExp("[^-.0-9_А-ЯЁа-яё]");
var RegExpNameEN = new RegExp("[^-.0-9_A-Za-z]");

exports.module = function (stanza) {

    var nickname = stanza.children[0].children[0].attrs.nickname;

    if (!nickname || nickname.length < 4 || nickname.length > 16 || (RegExpNameRU.test(nickname) && RegExpNameEN.test(nickname))) {
        //console.log("["+stanza.attrs.from+"][CheckNickname]:Incorrect nickname");
        global.xmppClient.response(stanza, new ltxElement("check_nickname", { nickname: nickname, result: "1" }));
        return;
    }

    global.db.warface.profiles.findOne({ nick: nickname }, { projection: { "_id": 1 } }, function (errProfile, resultProfile) {

        if (errProfile) {
            //console.log("["+stanza.attrs.from+"][CheckNickname]:Failed to getting data from the database");
            global.xmppClient.response(stanza, new ltxElement("check_nickname", { nickname: nickname, result: "3" }));
            return;
        }

        if (resultProfile) {
            global.xmppClient.response(stanza, new ltxElement("check_nickname", { nickname: nickname, result: "2" }));
            return;
        }

        global.xmppClient.response(stanza, new ltxElement("check_nickname", { nickname: nickname, result: "0" }));
    });
}