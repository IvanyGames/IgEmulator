var ltxElement = require('ltx').Element
var gameroom_leave = require('./gameroom_leave.js');
var scriptProfile = require('../scripts/profile.js')

exports.module = function (stanza, isNeedResponse, callBack) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][ChannelLogout]:Profile not found");
        if (isNeedResponse) {
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        }

        if (callBack) {
            callBack();
        }
        return;
    }

    gameroom_leave.module(stanza, false, false, (isNeedResponse ? 0 : 14));

    delete global.users.jid[stanza.attrs.from];
    delete global.users._id[profileObject._id];

    scriptProfile.save(profileObject, function (errUpdate, resultUpdate) {

        if (isNeedResponse) {
            global.xmppClient.response(stanza, new ltxElement("channel_logout"));
        }

        if (callBack) {
            callBack();
        }
    });
}