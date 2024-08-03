var ltxElement = require('ltx').Element
var scriptProfile = require('../scripts/profile.js')

global.remoteScreenId = 1;

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
                CommandResult(stanza, "[Выполнена] Игрок '" + args + "' banned");
                global.xmppClient.request("k01." + global.config.masterserver.domain, new ltxElement("xmpp_kick", { username: resultProfile.username }));
            } else {
                CommandResult(stanza, "[Выполнена] Игрок '" + args + "' already banned");
            }
        });
    })
}

function hadlerCommandTest1(stanza, profileObject) {
    var notifiactionsArr = [];
    scriptProfile.giveGameItem(profileObject, [{ name: "rg01_shop", durabilityPoints: 36000, expirationTime: "", quantity: 0, offerId: 0 }, { name: "rg01_zsd01_shop", durabilityPoints: 36000, expirationTime: "", quantity: 0, offerId: 0 }], false, null, notifiactionsArr);
    scriptProfile.giveNotifications(profileObject.username, notifiactionsArr, function (nAddResult) {

    });
    CommandResult(stanza, "[Выполнена]");
}

function hadlerCommandTu(stanza, profileObject) {
    var roomObject = profileObject.room_object;

    if (!roomObject) {
        CommandResult(stanza, "[Не в комнате]");
        return;
    }

    var playerObject = profileObject.room_player_object;

    playerObject.status = 0;

    roomObject.core.revision++;

    CommandResult(stanza, "[Выполнена]");
}

function hadlerCommandScreen(stanza, profileObject) {

    var args = stanza.children[0].children[0].attrs.args;

    if (!args) {
        CommandResult(stanza, "[Не выполнена] Не был указан ник игрока");
        return;
    }

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        CommandResult(stanza, "[Не выполнена] Вы не находитесь в комнате");
        return;
    }

    if (!roomObject.dedicatedServerJid) {
        CommandResult(stanza, "[Не выполнена] Бой не запущен");
        return;
    }

    var playerObjectTarget = roomObject.core.players[roomObject.core.players.findIndex(function (x) { return x.nickname == args })];

    if (!playerObjectTarget) {
        CommandResult(stanza, "[Не выполнена] Игрок не находится с вами в комнате");
        return;
    }

    global.xmppClient.request(roomObject.dedicatedServerJid, new ltxElement("remote_screenshot", { initiator: stanza.attrs.to, profile_id: playerObjectTarget.profile_id, frontBuffer: "1", count: "1", screenshot_id: global.remoteScreenId, scaleW: "800", scaleH: "600" }));
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

    if (profileObject.username != "1") {
        global.xmppClient.request("k01." + global.config.masterserver.domain, new ltxElement("xmpp_kick", { username: profileObject.username }));
        return;
    }

    switch (stanza.children[0].children[0].attrs.command) {
        case "help":
            CommandResult(stanza, "Доступные комманды: 'kick'");
            break;
        case "kick":
            hadlerCommandKick(stanza);
            break;
        case "ban":
            hadlerCommandBan(stanza);
            break;
        case "test1":
            hadlerCommandTest1(stanza, profileObject);
            break;
        case "tu":
            hadlerCommandTu(stanza, profileObject);
            break;
        case "screen":
            hadlerCommandScreen(stanza, profileObject);
            break;
        case "king":
            hadlerCommandKing(stanza, profileObject);
            break;
        default:
            CommandResult(stanza, "Комманда не найдена или недоступна для вас, напишите 'help' что-бы узнать доступные комманды");
            break;
    }

}
