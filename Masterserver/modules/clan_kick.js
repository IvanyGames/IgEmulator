var ltxElement = require('ltx').Element

var scriptProfile = require('../scripts/profile.js')
var scriptClan = require('../scripts/clan.js')

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][ClanKick]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "8" });
        return;
    }

    var nickname = stanza.children[0].children[0].attrs.nickname;
    var profile_id = Number(stanza.children[0].children[0].attrs.profile_id);

    global.db.warface.profiles.findOne({ username: profileObject.username }, { projection: { "nick": 1, "clan_name": 1, "clan_role": 1 } }, function (errProfile, resultProfile) {

        if (errProfile) {
            //console.log("["+stanza.attrs.from+"][ClanKick]:Failed to getting data from the database");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
            return;
        }

        if (!resultProfile) {
            //console.log("["+stanza.attrs.from+"][ClanKick]:Profile not found");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "2" });
            return;
        }

        if (!resultProfile.clan_name) {
            //console.log("["+stanza.attrs.from+"][ClanKick]:Profile not in clan");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "3" });
            return;
        }

        if (resultProfile.clan_role != 1) {
            //console.log("["+stanza.attrs.from+"][ClanKick]:Profile not have permissions");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "4" });
            return;
        }

        if (resultProfile.nick == nickname || resultProfile._id == profile_id) {
            //console.log("["+stanza.attrs.from+"][ClanKick]:It is impossible to kick yourself");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "5" });
            return;
        }

        var queryUpdate = { nick: nickname, clan_name: resultProfile.clan_name };

        if (!Number.isNaN(profile_id)) {
            queryUpdate = { _id: profile_id, clan_name: resultProfile.clan_name };
        }

        global.db.warface.profiles.findOneAndUpdate(queryUpdate, { $set: { clan_name: "", clan_points: 0, clan_role: 0 } }, { projection: { "username": 1, "nick": 1 } }, function (errUpdate, resultUpdate) {

            if (errUpdate) {
                //console.log("["+stanza.attrs.from+"][ClanKick]:Failed to execute db query");
                global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "6" });
                return;
            }


            if (!resultUpdate.lastErrorObject.updatedExisting) {
                //console.log("["+stanza.attrs.from+"][ClanKick]:Failed to update clan info");
                global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "7" });
                return;
            }

            var resultUpdateProfileTarget = resultUpdate.value;

            global.xmppClient.request(resultUpdateProfileTarget.username + "@" + global.config.masterserver.domain + "/GameClient", new ltxElement("clan_info"));

            scriptClan.syncMembersInfo(resultProfile.clan_name, [resultUpdateProfileTarget.nick], function (updateResult) {

                if (!updateResult) {
                    //console.log("[" + stanza.attrs.from + "][ClanKick]:UpdateMembersInfo Failed");
                }

                scriptProfile.giveNotifications(resultUpdateProfileTarget.username, [{ type: 8, params: { data: "@clans_you_was_kicked" } }], true, function (nAddResultTarget) {

                    if (!nAddResultTarget) {
                        //console.log("[" + stanza.attrs.from + "][ClanKick]:Failed to add notification to target profile");
                    }

                    global.xmppClient.response(stanza, new ltxElement("clan_kick"));
                    var elementBroadcastSync = new ltxElement("broadcast_sync");
                    elementBroadcastSync.c("clan_kick", { profile_id: resultUpdateProfileTarget._id });
                    global.xmppClient.request("k01." + global.config.masterserver.domain, elementBroadcastSync);
                });

            });
        });
    });
}