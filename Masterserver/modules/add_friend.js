var ltxElement = require('ltx').Element
var send_invitation = require('./send_invitation')


exports.module = function (stanza) {

    stanza.children[0].children[0].attrs.type = "64";
    send_invitation.module(stanza);
}

//global.arrFriendInvitations
//0-Теперь в вашем списке друзей
//1-Отклоняет
//2-Успешно Отправлен
//3-Уже в вашем списке друзей
//4-Нет в сети, попробуйте позже
//5-Нет в зале, попробуйте позже
//6-Достигнуто ограничение на количество людей у вас
//7-Системеная ошибка произошла
//8-Не отвечает, попробуйте позже
//9-Не удалось оправить зза системной ошибки
//10-Игрока не существует
//11-Не удалось оправить зза системной ошибки