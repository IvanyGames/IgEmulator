var ltxElement = require('ltx').Element
var fs = require('fs')

exports.module = function (stanza) {

    var username = stanza.attrs.from.split("@")[0];

    if (username != "dedicated") {
        return;
    }

    /*

    var elementsCheat = stanza.children[0].children[0].getChildren("cheat");

    for (var i = 0; i < elementsCheat.length; i++) {

        var elementCheat = elementsCheat[i];

        try {
            var currentDate = new Date();
            fs.appendFileSync("./anticheat_report/" + elementCheat.attrs.profile_id + ".txt", currentDate.getDay() + "." + (currentDate.getMonth() + 1) + "." + currentDate.getFullYear() + " " + currentDate.getHours() + ":" + currentDate.getMinutes() + " | " + elementCheat.attrs.type + " " + elementCheat.attrs.score + " " + elementCheat.attrs.calls + "\n");
        } catch (e) {

        }
    }

    */

    global.xmppClient.response(stanza, new ltxElement('send_anticheat_report'));
}