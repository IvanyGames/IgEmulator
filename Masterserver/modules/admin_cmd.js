var ltxElement = require('ltx').Element
var scriptProfile = require('../scripts/profile.js')
var scriptGameroom = require('../scripts/gameroom.js')

function CommandResult(stanza, result) {
    global.xmppClient.response(stanza, new ltxElement("admin_cmd", { command: stanza.children[0].children[0].attrs.command, result: result }));
}

function hadlerCommandKick(stanza) {

    var args = stanza.children[0].children[0].attrs.args;

    if (!args) {
        CommandResult(stanza, "[Не выполнена] Не был указан ник игрока");
        return;
    }

    global.db.warface.profiles.findOne({ nick: args }, { projection: { "username": 1 } }, function (errProfile, resultProfile) {

        if (errProfile) {
            CommandResult(stanza, "[Не выполнена] Запрос в бд возвратил ошибку");
            return;
        }

        if (!resultProfile) {
            CommandResult(stanza, "[Не выполнена] Указанный игрок с ником '" + args + "' не найден");
            return;
        }

        CommandResult(stanza, "[Выполнена] Игрок '" + args + "' был исключен с сервера");
        global.xmppClient.request("k01." + global.config.masterserver.domain, new ltxElement("xmpp_kick", { username: resultProfile.username }));

    })
}

function hadlerCommandBan(stanza) {

    var args = stanza.children[0].children[0].attrs.args;

    if (!args) {
        CommandResult(stanza, "[Не выполнена] Не был указан ник игрока");
        return;
    }

    global.db.warface.profiles.findOne({ nick: args }, { projection: { "username": 1 } }, function (errProfile, resultProfile) {

        if (errProfile) {
            CommandResult(stanza, "[Не выполнена] Запрос в бд возвратил ошибку");
            return;
        }

        if (!resultProfile) {
            CommandResult(stanza, "[Не выполнена] Указанный игрок с ником '" + args + "' не найден");
            return;
        }

        global.db.warface.accounts.updateOne({ _id: Number(resultProfile.username) }, { "$set": { ban: { expires: Math.round(new Date().getTime() / 1000.0) + 315360000, cause: 20 } } }, { projection: { "_id": 1 } }, function (errProfile1, resultProfile1) {
            console.log(errProfile1);
            if (resultProfile1) {
                CommandResult(stanza, "[Выполнена] Игрок '" + args + "' заблокирован");
                global.xmppClient.request("k01." + global.config.masterserver.domain, new ltxElement("xmpp_kick", { username: resultProfile.username }));
            } else {
                CommandResult(stanza, "[Выполнена] Игрок '" + args + "' уже был заблокирован");
            }
        });
    })
}

function handlerCommandObserver(stanza) {

    var args = stanza.children[0].children[0].attrs.args;

    if (!args) {
        CommandResult(stanza, "[Не выполнена] Не был указан ник игрока");
        return;
    }

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        CommandResult(stanza, "[Не выполнена] Вы не находитесь на канале");
        return;
    }

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        CommandResult(stanza, "[Не выполнена] Вы не находитесь в комнате");
        return;
    }

    var playerObjectTarget = roomObject.core.players[roomObject.core.players.findIndex(function (x) { return x.nickname == args })];

    if (!playerObjectTarget) {
        CommandResult(stanza, "[Не выполнена] Игрок '" + args + "' не найден в комнате");
        return;
    }

    if (playerObjectTarget.observer) {
        playerObjectTarget.observer = 0;
        CommandResult(stanza, "[Не выполнена] Игрок '" + args + "' перемешён в состояние 'игрок'");
    } else {
        playerObjectTarget.observer = 1;
        CommandResult(stanza, "[Не выполнена] Игрок '" + args + "' перемешён в состояние 'наблюдатель'");
    }

    roomObject.core.can_start = scriptGameroom.getCanStart(roomObject);
    roomObject.core.revision++;
}

function hadlerCommandFindAchievements(stanza) {

    var args = stanza.children[0].children[0].attrs.args;

    if (!args) {
        CommandResult(stanza, "[Не выполнена] Не было указано частичное/полное название достяжения");
        return;
    }

    var achievementPartialName = args;

    CommandResult(stanza, "[Выполнена]");

    for (var i = 0; i < global.resources.achievementsArr.length; i++) {

        var achievementInfo = global.resources.achievementsArr[i];

        if (achievementInfo.name.indexOf(achievementPartialName) != -1) {
            global.xmppClient.request(stanza.attrs.from, new ltxElement("admin_cmd", { command: stanza.children[0].children[0].attrs.command, result: achievementInfo.id + " " + achievementInfo.name }));
        }
    }
}

function hadlerCommandGiveAchievement(stanza) {

    var args = stanza.children[0].children[0].attrs.args.split(" ");

    if (args.length != 2) {
        CommandResult(stanza, "[Не выполнена] Недостаточно аргументов");
        return;
    }

    var argNick = args[0];
    var argId = Number(args[1]);

    var achievementInfo = global.resources.achievementsArr[global.resources.achievementsArr.findIndex(function (x) { return x.id == argId })];

    if (!achievementInfo) {
        CommandResult(stanza, "[Не выполнена] Достяжение не найдено");
        return;
    }

    var giveAchievementInfo = { id: argId, command: "give" };

    if (argNick == "@all" || argNick == "@online") {

        var dbQueryCommand = {};

        if (argNick == "@online") {
            dbQueryCommand = { status: { "$ne": 2 } };
        }

        global.db.warface.profiles.updateMany(dbQueryCommand, { "$push": { "remote_give.achievements": giveAchievementInfo } }, function (errUpdate, resultUpdate) {

            if (errUpdate) {
                CommandResult(stanza, "[Не выполнена] Запрос в бд возвратил ошибку");
                return;
            }

            if (!resultUpdate || !resultUpdate.result || !resultUpdate.result.ok) {
                CommandResult(stanza, "[Не выполнена] Запрос в бд возвратил ошибку");
                return;
            }

            CommandResult(stanza, "[Выполнена] Достяжение выдано '" + resultUpdate.result.nModified + "' игрокам");
        });
    } else {
        global.db.warface.profiles.findOneAndUpdate({ nick: argNick }, { "$push": { "remote_give.achievements": giveAchievementInfo } }, { projection: { "_id": 1 } }, function (errUpdate, resultUpdate) {

            if (errUpdate) {
                CommandResult(stanza, "[Не выполнена] Запрос в бд возвратил ошибку");
                return;
            }

            if (!resultUpdate.lastErrorObject.updatedExisting) {
                CommandResult(stanza, "[Не выполнена] Игрок не найден");
                return;
            }

            CommandResult(stanza, "[Выполнена] Достяжение выдано");
        });
    }
}

function hadlerCommandGiveItem(stanza) {

    var args = stanza.children[0].children[0].attrs.args.split(" ");

    if (args.length != 4) {
        CommandResult(stanza, "[Не выполнена] Недостаточно аргументов");
        return;
    }

    var argNick = args[0];
    var argName = args[1];
    var argType = args[2];
    var argValue = args[3];

    var gameItemObject = global.resources.items.data[global.resources.items.data.findIndex(function (x) { return x.name == argName; })];

    if (!gameItemObject) {
        CommandResult(stanza, "[Не выполнена] Предмет не найден");
        return;
    }

    var itemBuyTimeUtc = Math.round((new Date().getTime()) / 1000);

    var giveItemInfo;

    if (argType == "d") {
        giveItemInfo = { "name": argName, "durabilityPoints": 36000, "expirationTime": "", "quantity": 0, "offerId": 0, "buyTimeUtc": itemBuyTimeUtc };
    } else if (argType == "e") {

        var timeUnit = argValue[argValue.length - 1];
        var timeCount = Number(argValue.slice(0, -1));

        if (Number.isNaN(timeCount) || !Number.isSafeInteger(timeCount) || timeCount < 0 || timeCount > 2147483647) {
            CommandResult(stanza, "[Не выполнена] Не корректное значение времени");
            return;
        }

        var itemExpirationTime;

        switch (timeUnit) {
            case "d":
                itemExpirationTime = timeCount + " day";
                break;
            case "h":
                itemExpirationTime = timeCount + " hour";
                break;
            case "m":
                itemExpirationTime = timeCount + " month";
                break;
            default:
                CommandResult(stanza, "[Не выполнена] Не корректная единица измерения времени");
                return;
        }

        giveItemInfo = { "name": argName, "durabilityPoints": 0, "expirationTime": itemExpirationTime, "quantity": 0, "offerId": 0, "buyTimeUtc": itemBuyTimeUtc };

    } else if (argType == "q") {

        var itemQuantity = Number(argValue);

        if (Number.isNaN(itemQuantity) || !Number.isSafeInteger(itemQuantity) || itemQuantity < 0 || itemQuantity > 2147483647) {
            CommandResult(stanza, "[Не выполнена] Не корректное значение количества");
            return;
        }

        giveItemInfo = { "name": argName, "durabilityPoints": 0, "expirationTime": "", "quantity": itemQuantity, "offerId": 0, "buyTimeUtc": itemBuyTimeUtc };
    } else if (argType == "u") {
        giveItemInfo = { "name": argName, "durabilityPoints": 0, "expirationTime": "", "quantity": 0, "offerId": 0, "buyTimeUtc": itemBuyTimeUtc };
    } else {
        CommandResult(stanza, "[Не выполнена] Неизвестный тип предмета");
        return;
    }

    console.log(giveItemInfo);

    if (argNick == "@all" || argNick == "@online") {

        var dbQueryCommand = {};

        if (argNick == "@online") {
            dbQueryCommand = { status: { "$ne": 2 } };
        }

        global.db.warface.profiles.updateMany(dbQueryCommand, { "$push": { "remote_give.items": giveItemInfo } }, function (errUpdate, resultUpdate) {

            if (errUpdate) {
                CommandResult(stanza, "[Не выполнена] Запрос в бд возвратил ошибку");
                return;
            }

            if (!resultUpdate || !resultUpdate.result || !resultUpdate.result.ok) {
                CommandResult(stanza, "[Не выполнена] Запрос в бд возвратил ошибку");
                return;
            }

            CommandResult(stanza, "[Выполнена] Предмет выдан '" + resultUpdate.result.nModified + "' игрокам");
        });
    } else {
        global.db.warface.profiles.findOneAndUpdate({ nick: argNick }, { "$push": { "remote_give.items": giveItemInfo } }, { projection: { "_id": 1 } }, function (errUpdate, resultUpdate) {

            if (errUpdate) {
                CommandResult(stanza, "[Не выполнена] Запрос в бд возвратил ошибку");
                return;
            }

            if (!resultUpdate.lastErrorObject.updatedExisting) {
                CommandResult(stanza, "[Не выполнена] Игрок не найден");
                return;
            }

            CommandResult(stanza, "[Выполнена] Предмет выдан");
        });
    }

}

function hadlerCommandFunmap(stanza) {

    var args = stanza.children[0].children[0].attrs.args;

    if (!args) {
        CommandResult(stanza, "[Не выполнена] Не была указана карта");
        return;
    }

    var mapId = Number(args);

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        CommandResult(stanza, "[Не выполнена] Вы не находитесь на канале");
        return;
    }

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        CommandResult(stanza, "[Не выполнена] Вы не находитесь в комнате");
        return;
    }

    var newMissionInfo;

    var i = 0;
    for (var keyMission in global.CacheQuickAccess.missionsPvE.uid) {
        if (i == Number(mapId)) {
            newMissionInfo = global.CacheQuickAccess.missionsPvE.uid[keyMission];
            break;
        }
        i++;
    }

    if (!newMissionInfo) {
        CommandResult(stanza, "[Не выполнена] Карта не найдена");
        return;
    }

    roomObject.missionBase64 = Buffer.from(String(newMissionInfo)).toString('base64');
    roomObject.mission.mission_key = newMissionInfo.attrs.uid;

    CommandResult(stanza, "[Выполнена] Миссия изменена");
}

function hadlerCommandOnline(stanza) {
    global.db.warface.profiles.find({ status: { $ne: 2 } }).count(function (errProfiles, resultProfiles) {

        if (errProfiles || resultProfiles == null) {
            CommandResult(stanza, "[Не выполнена] Запрос в бд возвратил ошибку");
            return;
        }

        CommandResult(stanza, "[Выполнена] " + resultProfiles);
    });
}

function hadlerCommandScreen(stanza, profileObject) {

    var args = stanza.children[0].children[0].attrs.args.split(" ");

    if (args.length != 3) {
        CommandResult(stanza, "[Не выполнена] Недостаточно аргументов");
        return;
    }

    var argNick = args[0];
    var argScaleW = args[1];
    var argScaleH = args[2];

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        CommandResult(stanza, "[Не выполнена] Вы не находитесь в комнате");
        return;
    }

    if (!roomObject.dedicatedServerJid) {
        CommandResult(stanza, "[Не выполнена] Бой не запущен");
        return;
    }

    var playerObjectTarget = roomObject.core.players[roomObject.core.players.findIndex(function (x) { return x.nickname == argNick })];

    if (!playerObjectTarget) {
        CommandResult(stanza, "[Не выполнена] Игрок не находится с вами в комнате");
        return;
    }

    global.xmppClient.request(roomObject.dedicatedServerJid, new ltxElement("remote_screenshot", { initiator: stanza.attrs.to, profile_id: playerObjectTarget.profile_id, frontBuffer: "1", count: "1", screenshot_id: global.remoteScreenId, scaleW: argScaleW, scaleH: argScaleH }));
    global.remoteScreenId++;

    global.xmppClient.request(roomObject.dedicatedServerJid, new ltxElement("remote_screenshot", { initiator: stanza.attrs.to, profile_id: playerObjectTarget.profile_id, frontBuffer: "0", count: "1", screenshot_id: global.remoteScreenId, scaleW: argScaleW, scaleH: argScaleH }));
    global.remoteScreenId++;

    CommandResult(stanza, "[Выполнена]");
}

function hadlerCommandKing(stanza, profileObject) {

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        CommandResult(stanza, "[Не в комнате]");
        return;
    }

    roomObject.room_master.master = profileObject._id;
    roomObject.room_master.revision++;

    CommandResult(stanza, "[Выполнена]");
}

exports.module = function (stanza, profileObject) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][AdminCmd]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    if (profileObject.username != "1" && profileObject.username != "2") {
        global.xmppClient.request("k01." + global.config.masterserver.domain, new ltxElement("xmpp_kick", { username: profileObject.username }));
        return;
    }

    switch (stanza.children[0].children[0].attrs.command) {
        case "help":
            CommandResult(stanza, "Доступные комманды: 'kick', 'ban', 'observer'");
            break;
        case "kick":
            hadlerCommandKick(stanza);
            break;
        case "ban":
            hadlerCommandBan(stanza);
            break;
        case "observer":
            handlerCommandObserver(stanza);
            break;
        case "findachievements":
            hadlerCommandFindAchievements(stanza);
            break
        case "giveachievement":
            hadlerCommandGiveAchievement(stanza);
            break
        case "giveitem":
            hadlerCommandGiveItem(stanza);
            break;
        case "funmap":
            hadlerCommandFunmap(stanza);
            break;
        case "online":
            hadlerCommandOnline(stanza);
            break;
        case "screen":
            hadlerCommandScreen(stanza, profileObject);
            break;
        case "king":
            hadlerCommandKing(stanza, profileObject);
        default:
            CommandResult(stanza, "Комманда не найдена или недоступна для вас, напишите 'help' что-бы узнать доступные комманды");
            break;
    }

}
