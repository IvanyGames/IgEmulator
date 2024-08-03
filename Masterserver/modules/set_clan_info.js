var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][SetClanInfo]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "8" });
        return;
    }

    var description = base64ToString(stanza.children[0].children[0].attrs.description);

    if (description.length > 2000) {
        //console.log("[" + stanza.attrs.from + "][SetClanInfo]:Clan description too big");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '1' });
    }

    description = stringToBase64(description);

    var username = stanza.attrs.from.split("@")[0];

    global.db.warface.profiles.findOne({ username: username }, { projection: { "clan_name": 1, "clan_role": 1 } }, function (errProfile, resultProfile) {

        if (errProfile) {
            //console.log("[" + stanza.attrs.from + "][SetClanInfo]:Failed to getting data from the database");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '2' });
            return;
        }

        if (!resultProfile) {
            //console.log("[" + stanza.attrs.from + "][SetClanInfo]:Profile not found");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '3' });
            return;
        }

        if (!resultProfile.clan_name) {
            //console.log("[" + stanza.attrs.from + "][SetClanInfo]:User not in clan");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '4' });
            return;
        }

        if (resultProfile.clan_role != 1) {
            //console.log("[" + stanza.attrs.from + "][SetClanInfo]:Not have permissions");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
            return;
        }

        global.db.warface.clans.findOneAndUpdate({ name: resultProfile.clan_name }, { $set: { description: description } }, { projection: { "_id": 1 } }, function (errUpdate, resultUpdate) {

            if (errUpdate) {
                //console.log("[" + stanza.attrs.from + "][SetClanInfo]:Failed to execute to the database");
                global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "6" });
                return;
            }


            if (!resultUpdate.lastErrorObject.updatedExisting) {
                //console.log("[" + stanza.attrs.from + "][SetClanInfo]:Failed to update in data base");
                global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "7" });
                return;
            }

            global.db.warface.profiles.find({ "clan_name": resultProfile.clan_name }, { "projection": { "username": 1 } }).toArray(function (errAllProfiles, resultAllProfiles) {

                if (errAllProfiles) {
                    //console.log("[SetClanInfo]:Failed to get clan profiles usernames, db query execute error");
                    return;
                }

                global.xmppClient.response(stanza, new ltxElement("set_clan_info"));

                var elementClanDescriptionUpdated = new ltxElement("clan_description_updated", { description: description })

                for (var i = 0; i < resultAllProfiles.length; i++) {
                    global.xmppClient.request(resultAllProfiles[i].username + "@" + global.config.masterserver.domain + "/GameClient", elementClanDescriptionUpdated);
                }

            });

        });
    });
}

function base64ToString(b64data) {
    try {
        return (typeof Buffer.from === "function" ? Buffer.from(b64data, 'base64') : new Buffer(b64data, 'base64')).toString('utf-8');
    } catch (err) {
        return "";
    }
}

function stringToBase64(stringData) {
    try {
        return (typeof Buffer.from === "function" ? Buffer.from(stringData, 'utf-8') : new Buffer(stringData, 'utf-8')).toString('base64');
    } catch (err) {
        return "";
    }
}