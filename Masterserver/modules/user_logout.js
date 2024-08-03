var channel_logout = require('../modules/channel_logout')
var scriptGameroom = require('../scripts/gameroom.js');

exports.module = function (stanza) {

    var username = stanza.attrs.from.split("@")[0];

    if (username == "dedicated") {

        delete global.dedicatedServersObject[stanza.attrs.from];

        var roomObject = global.gamerooms[global.gamerooms.findIndex(function (x) { return x.dedicatedServerJid == stanza.attrs.from })];

        if (!roomObject) {
            return;
        }

        //delete global.sessions_data[roomObject.session.id];

        scriptGameroom.endSession(roomObject);

        return;
    }

    channel_logout.module(stanza, false, function () {

        global.db.warface.profiles.findOneAndUpdate({ username: username }, { $set: { status: 2, last_seen_date: Math.round((new Date().getTime()) / 1000) } }, { projection: { "_id": 1 } }, function (errUpdate, resultUpdate) {

            if (errUpdate) {
                //console.log("["+stanza.attrs.from+"][UserLogout]:Failed to save to the database");
            }

            if (!resultUpdate || !resultUpdate.lastErrorObject.updatedExisting) {
                //console.log("["+stanza.attrs.from+"][UserLogout]:Failed to save class");  
            }
        });

    });
}