var ltxElement = require('ltx').Element

var scriptProfile = require('../scripts/profile.js')

exports.module = function (stanza) {
    //console.time("t");

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][SendInvitation]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "23" });
        return;
    }

    var type = stanza.children[0].children[0].attrs.type;
    var target = stanza.children[0].children[0].attrs.target;
    var nickname = stanza.children[0].children[0].attrs.nickname;
    var target_id = Number(stanza.children[0].children[0].attrs.target_id);

    if (nickname) {
        target = nickname;
    }

    function resultCallback(code) {
        if (code) {
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: String(code) });
        } else {
            global.xmppClient.response(stanza, new ltxElement(stanza.children[0].children[0].name, { type: type, target: target, nickname: nickname }));
        }
        //console.timeEnd("t");
    }

    switch (type) {
        case "16":
            sendAddClanInvitation(stanza, profileObject, target, target_id, resultCallback);
            break;
        case "64":
            sendAddFriendInvitation(stanza, profileObject, target, resultCallback);
            break;
        default:
            resultCallback(16);
    }
}

function sendAddClanInvitation(stanza, profileObject, target, target_id, callback) {

    global.db.warface.profiles.findOne({ username: profileObject.username }, { projection: { "nick": 1, "clan_name": 1, "clan_role": 1, "notifications": 1 } }, function (errProfile, resultProfile) {

        if (errProfile) {
            //console.log("[" + stanza.attrs.from + "][SendInvitation][AddClan]:Failed to getting data from the database");
            callback(18);
            return;
        }

        if (!resultProfile) {
            //console.log("[" + stanza.attrs.from + "][SendInvitation][AddClan]:Profile not found");
            callback(19);
            return;
        }

        if (target == resultProfile.nick || target_id == resultProfile._id) {
            //console.log("[" + stanza.attrs.from + "][SendInvitation][AddClan]:Failed, it is forbidden to invite yourself");
            callback(12);
            return;
        }

        if (!resultProfile.clan_name) {
            //console.log("[" + stanza.attrs.from + "][SendInvitation][AddClan]:Failed, sender not in clan");
            callback(13);
            return;
        }

        if (resultProfile.clan_role != 1 && resultProfile.clan_role != 2) {
            //console.log("[" + stanza.attrs.from + "][SendInvitation][AddClan]:Failed, no permissions");
            callback(6);
            return;
        }

        global.db.warface.profiles.find({ "clan_name": resultProfile.clan_name }).count(function (errMembersCount, resultMembersCount) {

            if (errMembersCount) {
                //console.log("[" + stanza.attrs.from + "][SendInvitation][AddClan]:Failed to getting members count, db error");
                callback(20);
                return;
            }

            if (resultMembersCount > global.config.clan_members_limit && global.config.clan_members_limit != -1) {
                //console.log("[" + stanza.attrs.from + "][SendInvitation][AddClan]:Failed, clan is full");
                callback(11);
                return;
            }

            var queryProfileTarget = { nick: target };

            if (!Number.isNaN(target_id)) {
                queryProfileTarget = { _id: target_id };
            }

            global.db.warface.profiles.findOne(queryProfileTarget, { projection: { "username": 1, "clan_name": 1, "notifications": 1 } }, function (errProfileTarget, resultProfileTarget) {

                if (errProfileTarget) {
                    //console.log("[" + stanza.attrs.from + "][SendInvitation][AddClan]:Failed to getting target data from the database");
                    callback(21);
                    return;
                }

                if (!resultProfileTarget) {
                    //console.log("[" + stanza.attrs.from + "][SendInvitation][AddClan]:Profile target not found");
                    callback(9);
                    return;
                }

                if (resultProfileTarget.notifications.findIndex(x => (x.type == 16 && x.params.username == profileObject.username)) != -1) {
                    //console.log("[" + stanza.attrs.from + "][SendInvitation][AddClan]:Request already sent");
                    callback(2);
                    return;
                }

                if (resultProfile.notifications.findIndex(x => (x.type == 16 && x.params.username == resultProfileTarget.username)) != -1) {
                    //console.log("[" + stanza.attrs.from + "][SendInvitation][AddFriend]:Target already sent a request");
                    callback(22);
                    return;
                }

                if (resultProfileTarget.clan_name) {
                    //console.log("[" + stanza.attrs.from + "][SendInvitation][AddClan]:Target already in clan");
                    callback(5);
                    return;
                }

                //Тут проверка типо если игрока недавно исключили
                //--- 7

                scriptProfile.giveNotifications(resultProfileTarget.username, [{ type: 16, params: { username: profileObject.username, initiator: resultProfile.nick, clan_name: resultProfile.clan_name, clan_id: "0" } }], true, function (nAddResult) {
                    if (!nAddResult) {
                        //console.log("[" + stanza.attrs.from + "][SendInvitation][AddFriend]:Failed to give notification");
                        callback(22);
                        return;
                    }

                    callback(0);
                });

            })

        });

    });
}
/*
0 - @clans_invite_result_accepted - Игрок %1 принимает ваше приглашение в клан
1 - @clans_invite_result_rejected - Не удалось пригласить в клан игрока %1: приглашение отклонено
2 - @clans_invite_result_invite_in_progress - Приглашение в клан игрока %1 в процессе
X 4 - @clans_invite_result_duplicate - Не удалось пригласить в клан игрока %1: запрос уже отправлен
X 5 - @clans_invite_result_already_clan_member - Не удалось пригласить в клан игрока %1: игрок уже состоит в клане
X 6 - @clans_invite_result_no_permission - Не удалось пригласить в клан игрока %1: недостаточно прав
X 7 - @clans_invite_result_kick_timeout - Не удалось пригласить в клан игрока %1: игрока недавно исключили
X 8 - @clans_invite_result_user_offline - Не удалось пригласить в клан игрока %1: игрок вне сети
X 9 - мб не существует приглашаемого
X 10 - @clans_invite_result_invalid_state - Не удалось пригласить в клан игрока %1: игрок не может ответить
X 11 - @clans_invite_result_limit_reached - Не удалось пригласить в клан игрока %1: в клане нет свободных мест
X 12 - при попытке отправить приглашение себе
X 13 - приглашающий не в клане
X 14 - @clans_invite_result_expired - Не удалось пригласить в клан игрока %1: время на ответ истекло
X 15 - @clans_invite_result_dnd - Не удалось пригласить в клан игрока %1, так как он находится в режиме 'Не беспокоить'
X 16 - @clans_invite_result_low_rank - У игрока %1 слишком низкий ранг для приглашения в клан
*/


function sendAddFriendInvitation(stanza, profileObject, target, callback) {

    global.db.warface.profiles.find({ $or: [{ username: profileObject.username }, { nick: target }] }, { projection: { "username": 1, "nick": 1, "notifications": 1, "friends": 1 } }).limit(2).toArray(function (errProfiles, resultProfiles) {

        if (errProfiles) {
            //console.log("[" + stanza.attrs.from + "][SendInvitation][AddFriend]:Failed to getting data from the database");
            callback(17);
            return;
        }

        var myProfileIndex = resultProfiles.findIndex(x => x.username == profileObject.username);
        if (myProfileIndex == -1) {
            //console.log("[" + stanza.attrs.from + "][SendInvitation][AddFriend]:Profile not found");
            callback(18);
            return;
        }
        var myProfile = resultProfiles[myProfileIndex];

        var targetProfileIndex = resultProfiles.findIndex(x => x.nick == target);
        if (targetProfileIndex == -1) {
            //console.log("[" + stanza.attrs.from + "][SendInvitation][AddFriend]:Profile target not found");
            callback(9);
            return;
        }
        var targetProfile = resultProfiles[targetProfileIndex];

        if (myProfile._id == targetProfile._id) {
            //console.log("[" + stanza.attrs.from + "][SendInvitation][AddFriend]:Failed, it is forbidden to add yourself");
            callback(5);
            return;
        }

        if (targetProfile.notifications.findIndex(x => (x.type == 64 && x.params.username == myProfile.username)) != -1) {
            //console.log("[" + stanza.attrs.from + "][SendInvitation][AddFriend]:Request already sent");
            callback(2);
            return;
        }

        if (myProfile.notifications.findIndex(x => (x.type == 64 && x.params.username == targetProfile.username)) != -1) {
            //console.log("[" + stanza.attrs.from + "][SendInvitation][AddFriend]:Target already sent a request");
            callback(6);
            return;
        }

        if (myProfile.friends.indexOf(targetProfile._id) != -1 || targetProfile.friends.indexOf(myProfile._id) != -1) {
            //console.log("[" + stanza.attrs.from + "][SendInvitation][AddFriend]:Already in friends");
            callback(4);
            return;
        }

        if (myProfile.friends.length >= global.config.friends_limit && global.config.friends_limit != -1) {
            //console.log("[" + stanza.attrs.from + "][SendInvitation][AddFriend]:Friend list is full");
            callback(11);
            return;
        }

        if (targetProfile.friends.length >= global.config.friends_limit && global.config.friends_limit != -1) {
            //console.log("[" + stanza.attrs.from + "][SendInvitation][AddFriend]:Friend list target is full");
            callback(12);
            return;
        }

        scriptProfile.giveNotifications(targetProfile.username, [{ type: 64, params: { username: myProfile.username, initiator: myProfile.nick } }], true, function (nAddResult) {
            if (!nAddResult) {
                //console.log("[" + stanza.attrs.from + "][SendInvitation][AddFriend]:Failed to give notification");
                callback(7);
                return;
            }

            callback(0);
        });

    });
}

/*
0 - @ui_lobby_friends_invitation_response_ok - теперь в вашем списке друзей
1 - @ui_lobby_friends_invitation_response_rejected - отклоняет ваше предложение
2 - @ui_find_friends_invitation_inprogress - отправлено, ждите ответа
3 - @ui_find_friend_request_sent - успешно отправлен
4 - @ui_find_friends_invitation_response_duplicate - уже в вашем списке друзей
5 - X
6 -
7 -
8 - @ui_lobby_friends_invitation_response_offline - нет в сети
9 - @ui_lobby_friends_invitation_response_targetinvalid - не существует
10 - @ui_lobby_friends_invitation_response_invalidstate - нет в зале
11 - @ui_lobby_friends_invitation_response_limit - У вас или вашего друга достигнуто ограничение на количество друзей.
12 - @ui_lobby_friends_invitation_response_target_limit_reached - у игрока заполнен лимит друзей
13 -
14 - @ui_lobby_friends_invitation_response_expired - %1 не отвечает. Попробуйте позже.
15 - @ui_lobby_dnd_mode_restriction - Игрок находится в режиме 'Не беспокоить'
*/