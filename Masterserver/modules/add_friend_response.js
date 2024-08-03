var ltxElement = require('ltx').Element
var confirm_notification = require('./confirm_notification')

exports.module = function (stanza) {

    var request_id = stanza.children[0].children[0].attrs.request_id;
    var result = stanza.children[0].children[0].attrs.result;

    var elementNotif = stanza.children[0].children[0].c("notif", { id: request_id });
    elementNotif.c("confirmation", { result: result });

    confirm_notification.module(stanza);
}

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