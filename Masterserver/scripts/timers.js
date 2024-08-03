var ltxElement = require('ltx').Element
var scriptGameroom = require('./gameroom.js');
var scriptProfile = require('./profile.js')

exports.init = function () {

    exports.sendMasterserverInfo();
    setInterval(function () {
        exports.sendMasterserverInfo();
    }, 30000)

    exports.updateGameroomsBrowserCache();
    setInterval(function () {
        exports.updateGameroomsBrowserCache();
    }, 1000)

    exports.syncGamerooms();
    setInterval(function () {
        exports.syncGamerooms();
    }, 1000)

    exports.saveProfiles();
    setInterval(function () {
        exports.saveProfiles();
    }, 60000)

    exports.checkRemoteGive();
    setInterval(function () {
        exports.checkRemoteGive();
    }, 10000)
}

exports.saveProfiles = function () {

    console.time("[Timers]:SaveProfiles");

    var profileRefArr = [];
    for (profileIdKey in global.users._id) {
        profileRefArr.push(global.users._id[profileIdKey]);
    }

    var i = 0;
    function saveProfileForeach() {
        if (i < profileRefArr.length) {
            var profileObject = profileRefArr[i];
            //console.log("SavingProfile "+profileObject._id);
            scriptProfile.save(profileObject, function () {
                i++;
                saveProfileForeach();
            });
        } else {
            //console.log("AllProfilesSaved");
            console.timeEnd("[Timers]:SaveProfiles");
        }
    }
    saveProfileForeach();
}

exports.updateGameroomsBrowserCache = function () {

    var curTime = new Date().getTime();

    var roomBrowserCacheArrNew = [];

    for (var i = 0; i < global.roomBrowserCacheArr.length; i++) {
        var cacheObject = global.roomBrowserCacheArr[i];
        if (curTime - cacheObject.cacheTime < 10000) {
            roomBrowserCacheArrNew.push(cacheObject);
        }
    }

    var cacheObjectNew = { cacheTime: curTime, cacheToken: global.roomBrowserCacheToken, cacheData: [] };
    global.roomBrowserCacheToken++;

    for (var i = 0; i < global.gamerooms.length; i++) {
        cacheObjectNew.cacheData.push(scriptGameroom.getBrowserLtx(global.gamerooms[i]));
    }

    roomBrowserCacheArrNew.push(cacheObjectNew);

    global.roomBrowserCacheArr = roomBrowserCacheArrNew;

}

exports.syncGamerooms = function () {
    //console.time("gameroom_sync");

    var currentTime = Math.round(new Date().getTime() / 1000);

    for (var i = 0; i < global.gamerooms.length; i++) {

        var roomObject = global.gamerooms[i];

        if ((roomObject.room_type == 8 || roomObject.room_type == 16 || roomObject.room_type == 32)) {

            if (roomObject.auto_start.auto_start_timeout == 0 && roomObject.core.can_start == 1 && roomObject.session.status == 0 && currentTime - roomObject.session.end_time > roomObject.auto_start.post_session_timeout_sec) {

                console.log("[Timers][UpdateGameroom]:Start intermission timer " + roomObject.auto_start.intermission_timeout_sec + " sec");

                roomObject.auto_start.auto_start_timeout = 1;
                roomObject.auto_start.auto_start_timeout_end = currentTime + roomObject.auto_start.intermission_timeout_sec;
                roomObject.auto_start.revision++;

            }

            if (roomObject.auto_start.auto_start_timeout == 1 && roomObject.auto_start.auto_start_timeout_end <= currentTime) {

                console.log("[Timers][UpdateGameroom]:End intermission timer");

                roomObject.auto_start.auto_start_timeout = 0;
                roomObject.auto_start.auto_start_timeout_end = 0;
                roomObject.auto_start.revision++;

                if (roomObject.core.can_start == 1 && roomObject.session.status == 0) {

                    console.log("[Timers][UpdateGameroom]:Start Session");

                    scriptGameroom.startSession(roomObject);
                }

            }
        }

        var elementGameroom = scriptGameroom.getClientLtx(roomObject, false)

        if (elementGameroom.children.length > 0) {

            if (roomObject.dedicatedServerJid != null) {
                var elementMissionUpdate = new ltxElement("mission_update");
                elementMissionUpdate.children.push(scriptGameroom.getDedicatedLtx(roomObject, false));
                global.xmppClient.request(roomObject.dedicatedServerJid, elementMissionUpdate);
            }

            var arrBcastReceivers = [];

            for (var p = 0; p < roomObject.core.players.length; p++) {
                var playerObject = roomObject.core.players[p];
                arrBcastReceivers.push(playerObject.online_id);
            }

            var elementGameroomSync = new ltxElement("gameroom_sync", { bcast_receivers: arrBcastReceivers.join(",") });
            elementGameroomSync.children.push(elementGameroom);
            global.xmppClient.request("k01." + global.config.masterserver.domain, elementGameroomSync);

            roomObject.core.synchronized_revision = roomObject.core.revision;
            roomObject.room_master.synchronized_revision = roomObject.room_master.revision;
            roomObject.auto_start.synchronized_revision = roomObject.auto_start.revision;
            roomObject.session.synchronized_revision = roomObject.session.revision;
            roomObject.mission.synchronized_revision = roomObject.mission.revision;
            roomObject.clan_war.synchronized_revision = roomObject.clan_war.revision;
            roomObject.custom_params.synchronized_revision = roomObject.custom_params.revision;
            roomObject.kick_vote_params.synchronized_revision = roomObject.kick_vote_params.revision;

        }

    }
    //console.timeEnd("gameroom_sync");
}

exports.sendMasterserverInfo = function () {

    var online = 0;
    for (var key in global.users._id) {
        online++;
    }

    global.xmppClient.request("k01." + global.config.masterserver.domain, new ltxElement("setmasterserver", { resource: global.startupParams.resource, server_id: global.startupParams.server_id, channel: global.startupParams.channel, rank_group: global.startupParams.rank_group, load: online / Number(global.startupParams.max_users), online: online, min_rank: global.startupParams.min_rank, max_rank: global.startupParams.max_rank, bootstrap: global.startupParams.bootstrap, version: global.startupParams.ver }));
}

exports.checkRemoteGive = function () {

    var profilesIdsArr = [];

    for (var key in global.users._id) {
        profilesIdsArr.push(Number(key));
    }

    if (profilesIdsArr.length < 1) {
        //console.log("[Timers][CheckRemoteGive]:No profiles");
        return;
    }

    //console.log(profilesIdsArr);

    global.db.warface.profiles.find({ _id: { $in: profilesIdsArr } }, { projection: { "remote_give": 1 } }).toArray(function (errProfiles, resultProfiles) {

        if (errProfiles) {
            //console.log("[Timers][CheckRemoteGive]:Failed to getting data from the database");
            return;
        }

        if (resultProfiles.length < 1) {
            //console.log("[Timers][CheckRemoteGive]:No db profiles");
            return;
        }

        //console.log(resultProfiles);

        var profilesIdsAcceptedArr = [];

        for (var i = 0; i < resultProfiles.length; i++) {

            var resultProfile = resultProfiles[i];

            if (resultProfile.remote_give.items.length < 0 && resultProfile.remote_give.achievements.length < 0) {
                //console.log("[Timers][CheckRemoteGive]:Profile '" + resultProfile._id + "' no have items to give");
                continue;
            }

            var profileObject = global.users._id[resultProfile._id];

            if (!profileObject) {
                //console.log("[Timers][CheckRemoteGive]:Profile '" + resultProfile._id + "' not found of channel");
                continue;
            }

            if (resultProfile.remote_give.items.length > 0) {
                //console.log("[Timers][CheckRemoteGive]:Profile '" + resultProfile._id + "' give items");
                var notifiactionsArr = [];
                scriptProfile.giveGameItem(profileObject, resultProfile.remote_give.items, false, null, notifiactionsArr);
                scriptProfile.giveNotifications(profileObject.username, notifiactionsArr, true, function (nAddResult) {

                });
            }

            if (resultProfile.remote_give.achievements.length > 0) {
                //console.log("[Timers][CheckRemoteGive]:Profile '" + resultProfile._id + "' give achievements");
                scriptProfile.updateAchievementsAmmount(profileObject, resultProfile.remote_give.achievements, function (res) {

                });
            }

            profilesIdsAcceptedArr.push(resultProfile._id);
        }

        if (profilesIdsAcceptedArr.length < 1) {
            //console.log("[Timers][CheckRemoteGive]:No accepted profiles");
            return;
        }

        global.db.warface.profiles.updateMany({ _id: { $in: profilesIdsAcceptedArr } }, { "$set": { "remote_give": { "items": [], "achievements": [] } } }, function (errUpdate, resultUpdate) {

            if (errUpdate) {
                //console.log("[Timers][CheckRemoteGive]::Failed to updating data to the database");
                return;
            }

        });
    });
}