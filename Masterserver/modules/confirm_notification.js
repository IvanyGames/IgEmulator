var ltxElement = require('ltx').Element

var scriptProfile = require('../scripts/profile.js')
var scriptClan = require('../scripts/clan.js')

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("[" + stanza.attrs.from + "][ConfirmNotification]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "3" });
        return;
    }

    var elementNotifs = stanza.children[0].children[0].getChildren("notif");

    //Формирование массива id уведомлений, из пакета от клиента
    var notifIdsArr = [];
    var notifIdsObjArr = [];
    for (var i = 0; i < elementNotifs.length; i++) {
        var notifInfo = elementNotifs[i];
        var notifId = Number(notifInfo.attrs.id);
        if (Number.isNaN(notifId)) {
            continue;
        }
        notifIdsArr.push(notifId);
        var notifElementConfirmation = notifInfo.getChild("confirmation");
        notifIdsObjArr.push({ id: notifId, confirmation: (notifElementConfirmation ? notifElementConfirmation.attrs : {}) });
    }

    //Удаление всех уведомлений, которые были массиве уведомлений
    global.db.warface.profiles.findOneAndUpdate({ username: profileObject.username }, { $pull: { "notifications": { "id": { "$in": notifIdsArr } } } }, { projection: { "notifications": 1 } }, function (errUpdate, resultUpdate) {

        //Если запрос на удаление не удался, по причине например разрыва связи с бд и т.д
        if (errUpdate) {
            //console.log("[" + stanza.attrs.from + "][ConfirmNotification]:Failed to execute query to the database");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
            return;
        }

        //Если запрос удался, но обновление не произошло, например если пользователя не существует
        if (!resultUpdate.lastErrorObject.updatedExisting) {
            //console.log("[" + stanza.attrs.from + "][ConfirmNotification]:Failed to delete notifications");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "2" });
            return;
        }

        //Формирование массива уведомлений которые были удалены
        var profileDeletedNotifications = [];
        var profileAllNotifications = resultUpdate.value.notifications;
        for (var i = 0; i < profileAllNotifications.length; i++) {
            var notifIndexInObjectArr = notifIdsObjArr.findIndex(x => x.id == profileAllNotifications[i].id);
            if (notifIndexInObjectArr != -1) {
                profileAllNotifications[i].confirmation = notifIdsObjArr[notifIndexInObjectArr].confirmation;
                profileDeletedNotifications.push(profileAllNotifications[i]);
            }
            /*
            if (notifIdsArr.indexOf(profileAllNotifications[i].id) != -1) {
                profileDeletedNotifications.push(profileAllNotifications[i]);
            }
            */
        }

        var i = 0;
        function foreachDeletedNotifications() {
            if (i < profileDeletedNotifications.length) {
                var notificationInfo = profileDeletedNotifications[i];
                switch (notificationInfo.type) {
                    case 4:
                        foreachDeletedNotificationsNext();
                        break;
                    case 16:
                        confirmAddClanInvitation(stanza, profileObject, notificationInfo, foreachDeletedNotificationsNext);
                        break;
                    case 64:
                        confirmAddFriendInvitation(stanza, profileObject, notificationInfo, foreachDeletedNotificationsNext);
                        break;
                    case 256:
                        foreachDeletedNotificationsNext();
                        break;
                    case 2048:
                        foreachDeletedNotificationsNext();
                        break;
                    case 8192:
                        foreachDeletedNotificationsNext();
                        break;
                    case 131072:
                        foreachDeletedNotificationsNext();
                        break;
                    case 262144:
                        foreachDeletedNotificationsNext();
                        break;
                    default:
                        console.log("[" + stanza.attrs.from + "][ConfirmNotification]:Notification type '" + notificationInfo.type + "' is unknown");
                        foreachDeletedNotificationsNext();
                }
            } else {
                //console.log("["+stanza.attrs.from+"][ConfirmNotification]:All notifications is processed");
                global.xmppClient.response(stanza, new ltxElement(stanza.children[0].children[0].name));
            }

        }

        function foreachDeletedNotificationsNext() {
            i++;
            foreachDeletedNotifications();
        }

        foreachDeletedNotifications();
    });
}

function confirmAddClanInvitation(stanza, profileObject, notificationInfo, callback) {

    var notificationParams = notificationInfo.params;

    global.db.warface.profiles.find({ username: { $in: [profileObject.username, notificationParams.username] } }, { projection: { "username": 1, "experience": 1, "status": 1, "location": 1, "nick": 1, "friends": 1 } }).limit(2).toArray(function (errProfiles, resultProfiles) {

        if (errProfiles) {
            //console.log("[" + stanza.attrs.from + "][ConfirmNotification][AddClan]:Failed to getting data from the database");
            callback();
            return;
        }

        var myProfileIndex = resultProfiles.findIndex(x => x.username == profileObject.username);
        if (myProfileIndex == -1) {
            //console.log("[" + stanza.attrs.from + "][ConfirmNotification][AddClan]:Profile not found");
            callback();
            return;
        }
        var resultProfile = resultProfiles[myProfileIndex];

        var targetProfileIndex = resultProfiles.findIndex(x => x.username == notificationParams.username);
        if (targetProfileIndex == -1) {
            //console.log("[" + stanza.attrs.from + "][ConfirmNotification][AddClan]:Profile target not found");
            callback();
            return;
        }
        var resultProfileTarget = resultProfiles[targetProfileIndex];

        if (notificationInfo.confirmation.result == "0") {

            function inviteResults(resultTarget, resultMe) {
                scriptProfile.giveNotifications(notificationParams.username, [{ type: 32, params: { username: resultProfile.username, profile_id: resultProfile._id, nickname: resultProfile.nick, status: profileObject.status, location: profileObject.location, experience: profileObject.experience, result: resultTarget } }], true, function (nAddResultTarget) {
                    scriptProfile.giveNotifications(resultProfile.username, [{ type: 32, params: { username: notificationParams.username, profile_id: resultProfileTarget._id, nickname: resultProfileTarget.nick, status: resultProfileTarget.status, location: resultProfileTarget.location, experience: resultProfileTarget.experience, result: resultMe } }], true, function (nAddResult) {
                        callback();
                    });
                });
            }

            if (resultProfile.clan_name) {
                //console.log("[" + stanza.attrs.from + "][ConfirmNotification][AddClan]:Already in clan");
                inviteResults(5, 5);
                return;
            }

            //Тут проверка типо если игрока недавно исключили
            //--- 7

            global.db.warface.clans.findOne({ "name": notificationParams.clan_name }, { projection: { "_id": 1 } }, function (errClan, resultClan) {

                if (errClan) {
                    //console.log("[" + stanza.attrs.from + "][ConfirmNotification][AddClan]:Failed to find clan, db query execute error");
                    inviteResults(18, 18);
                    return;
                }

                if (!resultClan) {
                    //console.log("[" + stanza.attrs.from + "][ConfirmNotification][AddClan]:Failed to find clan, not found");
                    inviteResults(19, 19);
                    return;
                }

                global.db.warface.profiles.find({ "clan_name": notificationParams.clan_name }).count(function (errMembersCount, resultMembersCount) {

                    if (errMembersCount) {
                        //console.log("[" + stanza.attrs.from + "][ConfirmNotification][AddClan]:Failed to getting members count, db error");
                        inviteResults(20, 20);
                        return;
                    }

                    if (resultMembersCount > global.config.clan_members_limit && global.config.clan_members_limit != -1) {
                        //console.log("[" + stanza.attrs.from + "][ConfirmNotification][AddClan]:Failed, clan is full");
                        inviteResults(11, 11);
                        return;
                    }

                    var currentTime = Math.floor(Date.now() / 1000);
                    global.db.warface.profiles.findOneAndUpdate({ username: resultProfile.username }, { $set: { clan_name: notificationParams.clan_name, clan_points: 0, clan_role: 3, invite_date: currentTime } }, { projection: { "_id": 1 } }, function (errUpdate, resultUpdate) {

                        if (errUpdate) {
                            //console.log("[" + stanza.attrs.from + "][ConfirmNotification][AddClan]:Failed to execute profile udpdate clan query");
                            inviteResults(21, 21);
                            return;
                        }

                        if (!resultUpdate.lastErrorObject.updatedExisting) {
                            //console.log("[" + stanza.attrs.from + "][ConfirmNotification][AddClan]:Failed to update profile clan");
                            inviteResults(22, 22);
                            return;
                        }

                        inviteResults(0, 0);

                        profileObject.clan_name = notificationParams.clan_name;

                        var roomObject = profileObject.room_object;

                        if (roomObject) {
                            var playerObject = profileObject.room_player_object;
                            playerObject.clanName = notificationParams.clan_name;
                            roomObject.core.revision++;
                        }

                        scriptClan.getClanInfo(notificationParams.clan_name, function (elementClanInfo) {

                            if (!elementClanInfo) {
                                //console.log("[" + stanza.attrs.from + "][ConfirmNotification][AddClan]:GetClanInfo Failed");
                                return;
                            }

                            global.xmppClient.request(stanza.attrs.from, elementClanInfo);

                            scriptClan.syncMembersInfo(notificationParams.clan_name, [resultProfile.nick], function (updateResult) {
                                if (!updateResult) {
                                    //console.log("[" + stanza.attrs.from + "][ConfirmNotification][AddClan]:UpdateMembersInfo Failed");
                                }
                            });

                        });

                    });

                });

            });

        } else {
            scriptProfile.giveNotifications(notificationParams.username, [{ type: 32, params: { username: resultProfile.username, profile_id: resultProfile._id, nickname: resultProfile.nick, status: profileObject.status, location: profileObject.location, experience: profileObject.experience, result: 1 } }], true, function (nAddResult) {
                callback();
            });
        }

    });
}

function confirmAddFriendInvitation(stanza, profileObject, notificationInfo, callback) {

    var notificationParams = notificationInfo.params;

    global.db.warface.profiles.find({ username: { $in: [profileObject.username, notificationParams.username] } }, { projection: { "username": 1, "experience": 1, "status": 1, "location": 1, "nick": 1, "friends": 1 } }).limit(2).toArray(function (errProfiles, resultProfiles) {

        if (errProfiles) {
            //console.log("[" + stanza.attrs.from + "][ConfirmNotification][AddFriend]:Failed to getting data from the database");
            callback();
            return;
        }

        var myProfileIndex = resultProfiles.findIndex(x => x.username == profileObject.username);
        if (myProfileIndex == -1) {
            //console.log("[" + stanza.attrs.from + "][ConfirmNotification][AddFriend]:Profile not found");
            callback();
            return;
        }
        var resultProfile = resultProfiles[myProfileIndex];

        var targetProfileIndex = resultProfiles.findIndex(x => x.username == notificationParams.username);
        if (targetProfileIndex == -1) {
            //console.log("[" + stanza.attrs.from + "][ConfirmNotification][AddFriend]:Profile target not found");
            callback();
            return;
        }
        var resultProfileTarget = resultProfiles[targetProfileIndex];

        if (notificationInfo.confirmation.result == "0") {

            function inviteResults(resultTarget, resultMe) {
                scriptProfile.giveNotifications(notificationParams.username, [{ type: 128, params: { username: resultProfile.username, profile_id: resultProfile._id, nickname: resultProfile.nick, status: profileObject.status, location: profileObject.location, experience: profileObject.experience, result: resultTarget } }], true, function (nAddResultTarget) {
                    scriptProfile.giveNotifications(resultProfile.username, [{ type: 128, params: { username: notificationParams.username, profile_id: resultProfileTarget._id, nickname: resultProfileTarget.nick, status: resultProfileTarget.status, location: resultProfileTarget.location, experience: resultProfileTarget.experience, result: resultMe } }], true, function (nAddResult) {
                        callback();
                    });
                });
            }

            if (resultProfile.friends.indexOf(resultProfileTarget._id) != -1 || resultProfileTarget.friends.indexOf(resultProfile._id) != -1) {
                //console.log("[" + stanza.attrs.from + "][ConfirmNotification][AddFriend]:Already in friends");
                inviteResults(4, 4);
            } else if (resultProfile.friends.length >= global.config.friends_limit && global.config.friends_limit != -1) {
                //console.log("[" + stanza.attrs.from + "][ConfirmNotification][AddFriend]:Friend list is full");
                inviteResults(12, 11);
            } else if (resultProfileTarget.friends.length >= global.config.friends_limit && global.config.friends_limit != -1) {
                //console.log("[" + stanza.attrs.from + "][ConfirmNotification][AddFriend]:Friend list target is full");
                inviteResults(11, 12);
            } else {
                global.db.warface.profiles.bulkWrite([{ "updateOne": { "filter": { username: notificationParams.username }, "update": { $push: { friends: resultProfile._id } } } }, { "updateOne": { "filter": { username: resultProfile.username }, "update": { $push: { friends: resultProfileTarget._id } } } }], function (errBulkWrite, resultBulkWrite) {

                    if (errBulkWrite) {
                        //console.log("["+stanza.attrs.from+"][ConfirmNotification][AddFriend]:Failed to save to the database");
                        inviteResults(6, 6);
                    } else {
                        inviteResults(0, 0);

                        scriptProfile.updateAchievementsAmmount(profileObject, [{ id: 203, command: "inc", amount: 1 }], function (res) {

                        });

                        var elementBroadcastSync = new ltxElement("broadcast_sync");
                        var elementUpdateAchievementsAmmount = elementBroadcastSync.c("update_achievements_ammount", { profile_id: resultProfileTarget._id });
                        elementUpdateAchievementsAmmount.c("achievement_params", { id: 203, command: "inc", amount: 1 });
                        global.xmppClient.request("k01." + global.config.masterserver.domain, elementBroadcastSync);

                        if (resultProfileTarget.status == 2) {
                            global.db.warface.profiles.findOne({ _id: resultProfileTarget._id }, { projection: { "achievements": 1 } }, function (errProfileTwo, resultProfileTwo) {

                                if (errProfileTwo) {
                                    return;
                                }

                                if (!resultProfileTwo) {
                                    return;
                                }

                                scriptProfile.updateAchievementsAmmount(resultProfileTwo, [{ id: 203, command: "inc", amount: 1 }], function (res) {
                                    global.db.warface.profiles.findOneAndUpdate({ _id: resultProfileTarget._id }, { $set: { achievements: resultProfileTwo.achievements } }, { projection: { "_id": 1 } }, function (errUpdate, resultUpdate) {
                                    })
                                });

                            });
                        }
                    }
                });
            }

        } else {
            scriptProfile.giveNotifications(notificationParams.username, [{ type: 128, params: { username: resultProfile.username, profile_id: resultProfile._id, nickname: resultProfile.nick, status: profileObject.status, location: profileObject.location, experience: profileObject.experience, result: 1 } }], true, function (nAddResult) {
                callback();
            });
        }

    });
}