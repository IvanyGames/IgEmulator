var ltxElement = require('ltx').Element

var scriptClan = require('../scripts/clan.js')
var scriptProfile = require('../scripts/profile.js')

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][ClanSetMemberRole]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "10" });
        return;
    }

    var nickname = stanza.children[0].children[0].attrs.nickname;
    var profile_id = Number(stanza.children[0].children[0].attrs.profile_id);
    var role = Number(stanza.children[0].children[0].attrs.role);

    if (Number.isNaN(role) || role < 1 || role > 3) {
        //console.log("[" + stanza.attrs.from + "][ClanSetMemberRole]:Bad attrs");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '1' });
        return;
    }

    var queryProfiles = { nick: nickname };

    if (!Number.isNaN(profile_id)) {
        queryProfiles = { _id: profile_id };
    }

    global.db.warface.profiles.find({ $or: [{ username: profileObject.username }, queryProfiles] }, { projection: { "username": 1, "nick": 1, "clan_name": 1, "clan_role": 1 } }).limit(2).toArray(function (errProfiles, resultProfiles) {

        if (errProfiles) {
            //console.log("[" + stanza.attrs.from + "][ClanSetMemberRole]:Failed to getting data from the database");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '2' });
            return;
        }

        var myProfileIndex = resultProfiles.findIndex(x => x.username == profileObject.username);
        if (myProfileIndex == -1) {
            //console.log("[" + stanza.attrs.from + "][ClanSetMemberRole]:Profile not found");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '3' });
            return;
        }
        var myProfile = resultProfiles[myProfileIndex];

        var targetProfileIndex = resultProfiles.findIndex(x => (x.nick == nickname || x._id == profile_id));
        if (targetProfileIndex == -1) {
            //console.log("[" + stanza.attrs.from + "][ClanSetMemberRole]:Profile target not found");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '4' });
            return;
        }
        var targetProfile = resultProfiles[targetProfileIndex];

        if (!myProfile.clan_name) {
            //console.log("[" + stanza.attrs.from + "][ClanSetMemberRole]:User not in clan");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
            return;
        }

        if (myProfile.clan_role != 1) {
            //console.log("[" + stanza.attrs.from + "][ClanSetMemberRole]:Not have permissions");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '6' });
            return;
        }

        if (myProfile._id == targetProfile._id) {
            //console.log("[" + stanza.attrs.from + "][ClanSetMemberRole]:It is impossible to change the role to yourself");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '7' });
            return;
        }

        if (myProfile.clan_name != targetProfile.clan_name) {
            //console.log("[" + stanza.attrs.from + "][ClanSetMemberRole]:Users are in different clans");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '8' });
            return;
        }

        var clanEventLocalize = "";

        var membersToSync = [targetProfile.nick];

        var dbBulkOperationsArr = [{ "updateOne": { "filter": { _id: targetProfile._id }, "update": { $set: { "clan_role": role } } } }];

        switch (role) {
            case 1:
                clanEventLocalize = "@clans_you_are_promoted_to_master";
                dbBulkOperationsArr.push({ "updateOne": { "filter": { _id: myProfile._id }, "update": { $set: { "clan_role": 3 } } } });
                membersToSync.push(myProfile.nick);
                break;
            case 2:
                clanEventLocalize = "@clans_you_are_promoted_to_officer";
                break;
            case 3:
                clanEventLocalize = "@clans_you_are_demoted_to_regular";
                break;
        }

        global.db.warface.profiles.bulkWrite(dbBulkOperationsArr, function (errBulkWrite, resultBulkWrite) {

            if (errBulkWrite) {
                //console.log("[" + stanza.attrs.from + "][ClanSetMemberRole]:Failed to save to the database");
                global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "9" });
                return;
            }

            function endSyncProcesses() {
                scriptProfile.giveNotifications(targetProfile.username, [{ type: 8, params: { data: clanEventLocalize } }], true, function (nAddResultTarget) {
                    if (!nAddResultTarget) {
                        //console.log("[" + stanza.attrs.from + "][ClanSetMemberRole]:Failed to add notification to target profile");
                    }

                    global.xmppClient.response(stanza, new ltxElement("clan_set_member_role"));
                });
            }

            scriptClan.syncMembersInfo(myProfile.clan_name, membersToSync, function (updateResult) {
                if (!updateResult) {
                    //console.log("[" + stanza.attrs.from + "][ClanSetMemberRole]:UpdateMembersInfo Failed");
                }

                if (role != 1) {
                    endSyncProcesses();
                    return;
                }

                scriptClan.syncMasterBanner(myProfile.clan_name, function (updateResult) {
                    if (!updateResult) {
                        //console.log("[" + stanza.attrs.from + "][ClanSetMemberRole]:SyncMasterBanner Failed");
                    }

                    endSyncProcesses();
                });
            });
        });
    });
}