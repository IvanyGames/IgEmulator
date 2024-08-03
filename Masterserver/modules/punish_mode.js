var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var username = stanza.attrs.from.split("@")[0];

    if (username != "dedicated") {
        return;
    }

    console.log(stanza.children[0].children[0] + "");
    //<punish_mode profile_id="1" session_id="2" punish_mode="kick_anticheat"/>
    var version = stanza.children[0].children[0].attrs.version;

    global.xmppClient.response(stanza, new ltxElement('punish_mode'));
}

var ltxElement = require('ltx').Element
var gameroom_leave = require('./gameroom_leave.js')
var scriptProfile = require('../scripts/profile.js')

exports.module = function (stanza) {

    var username = stanza.attrs.from.split("@")[0];

    if (username != "dedicated") {
        return;
    }

    var profile_id = Number(stanza.children[0].children[0].attrs.profile_id);
    var session_id = Number(stanza.children[0].children[0].attrs.session_id);
    var punish_mode = stanza.children[0].children[0].attrs.punish_mode;

    var profileObject = global.users._id[profile_id];

    if (!profileObject) {
        //console.log("[" + stanza.attrs.from + "][PunishMode]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        //console.log("[" + stanza.attrs.from + "][PunishMode]:The player is not in the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '2' });
        return;
    }

    var playerObject = profileObject.room_player_object;

    if (stanza.attrs.from != roomObject.dedicatedServerJid) {
        //console.log("[" + stanza.attrs.from + "][PunishMode]:Gameroom mismatch");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '3' });
        return;
    }

    var punish_message = "@messagebox_you_are_kicked";
    var reason = 0;

    if (punish_mode == "kick_anticheat") {
        punish_message = "@messagebox_you_are_kicked_anticheat";
        reason = 8;
    } else if (punish_mode == "kick_high_latency") {
        punish_message = "@messagebox_you_are_kicked_high_latency";
        reason = 13;
    }

    roomObject.kicked.push(playerObject.online_id);
    gameroom_leave.module({ attrs: { from: playerObject.online_id } }, false, true, reason);
    scriptProfile.giveNotifications(profileObject.username, [{ type: 8, params: { data: punish_message } }], true, function (nAddResult) {

    })

    global.xmppClient.response(stanza, new ltxElement("punish_mode"));
}