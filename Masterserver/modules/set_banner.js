var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][SetBanner]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    var banner_badge = Number(stanza.children[0].children[0].attrs.banner_badge);
    var banner_mark = Number(stanza.children[0].children[0].attrs.banner_mark);
    var banner_stripe = Number(stanza.children[0].children[0].attrs.banner_stripe);

    if ((profileObject.achievements.findIndex(function (x) { return (x.achievement_id == banner_badge && x.completion_time != 0) }) == -1 && banner_badge != 4294967295) || (profileObject.achievements.findIndex(function (x) { return (x.achievement_id == banner_mark && x.completion_time != 0) }) == -1 && banner_mark != 4294967295) || (profileObject.achievements.findIndex(function (x) { return (x.achievement_id == banner_stripe && x.completion_time != 0) }) == -1 && banner_stripe != 4294967295)) {
        //console.log("["+stanza.attrs.from+"][SetBanner]:Incorrect banner(s)");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "2" });
        return;
    }

    profileObject.banner_badge = banner_badge;
    profileObject.banner_mark = banner_mark;
    profileObject.banner_stripe = banner_stripe;

    global.xmppClient.response(stanza, new ltxElement("set_banner"));

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        return;
    }

    var playerObject = profileObject.room_player_object;

    playerObject.banner_badge = banner_badge;
    playerObject.banner_mark = banner_mark;
    playerObject.banner_stripe = banner_stripe;

    roomObject.core.revision++;

}