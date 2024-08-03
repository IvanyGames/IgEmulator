var ltxElement = require('ltx').Element

var scriptClan = require('../scripts/clan.js')
var gameroom_leave = require('./gameroom_leave.js')

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][ClanLeave]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "5" });
        return;
    }

    global.db.warface.profiles.findOneAndUpdate({ username: profileObject.username, clan_name: { "$ne": "" } }, { $set: { clan_name: "", "clan_points": 0, clan_role: 0 } }, { projection: { "nick": 1, "clan_name": 1, "clan_role": 1 } }, function (errUpdate, resultUpdate) {

        if (errUpdate) {
            //console.log("[" + stanza.attrs.from + "][ClanLeave]:Failed to execute db query");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
            return;
        }


        if (!resultUpdate.lastErrorObject.updatedExisting) {
            //console.log("[" + stanza.attrs.from + "][ClanLeave]:Failed to update clan info");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "2" });
            return;
        }

        var resultInfo = resultUpdate.value;

        var membersToSync = [resultInfo.nick];

        function endLeaveProcess() {
            profileObject.clan_name = "";

            var roomObject = profileObject.room_object;

            if (roomObject) {
                if (roomObject.room_type == 4) {
                    global.xmppClient.request(stanza.attrs.from, new ltxElement("gameroom_on_kicked"));
                    gameroom_leave.module(stanza, false, true, 7);
                } else {
                    var playerObject = profileObject.room_player_object;
                    playerObject.clanName = "";
                    roomObject.core.revision++;
                }
            }
            global.xmppClient.response(stanza, new ltxElement("clan_leave"));
        }

        function syncLeaveProcess() {
            scriptClan.syncMembersInfo(resultInfo.clan_name, membersToSync, function (updateResult) {

                if (!updateResult) {
                    //console.log("[" + stanza.attrs.from + "][ClanLeave]:Failed to syncMembersInfo");
                }

                endLeaveProcess();
            });
        }

        if (resultInfo.clan_role != 1) {
            syncLeaveProcess();
            return;
        }

        global.db.warface.profiles.findOneAndUpdate({ clan_name: resultInfo.clan_name }, { $set: { clan_role: 1 } }, { projection: { "nick": 1 } }, function (errUpdateNewMaster, resultUpdateNewMaster) {

            if (errUpdateNewMaster) {
                //console.log("[" + stanza.attrs.from + "][ClanLeave]:Failed to execute db query 1");
                global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "4" });
                return;
            }

            if (!resultUpdateNewMaster.lastErrorObject.updatedExisting) {
                //console.log("[" + stanza.attrs.from + "][ClanLeave]:Failed to find clan member for nominate to new master, the clan will be deleted");

                global.db.warface.clans.deleteOne({ name: resultInfo.clan_name }, function (errRemoveClan, resultRemoveClan) {

                    if (errRemoveClan) {
                        //console.log("[" + stanza.attrs.from + "][ClanLeave]:Failed to execute db query 2");
                    }

                    endLeaveProcess();
                });
                return;
            }

            membersToSync.push(resultUpdateNewMaster.value.nick);
            syncLeaveProcess();
        });

    });

}