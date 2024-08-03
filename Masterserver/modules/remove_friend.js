var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("[" + stanza.attrs.from + "][RemoveFriend]:Profile target not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
        return;
    }

    var target = stanza.children[0].children[0].attrs.target;

    global.db.warface.profiles.find({ $or: [{ username: profileObject.username }, { nick: target }] }, { projection: { "username": 1, "nick": 1 } }).limit(2).toArray(function (errProfiles, resultProfiles) {

        if (errProfiles) {
            //console.log("[" + stanza.attrs.from + "][RemoveFriend]:Failed to getting data from the database");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '1' });
            return;
        }

        var myProfileIndex = resultProfiles.findIndex(x => x.username == profileObject.username);
        if (myProfileIndex == -1) {
            //console.log("[" + stanza.attrs.from + "][RemoveFriend]:Profile not found");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '2' });
            return;
        }
        var myProfile = resultProfiles[myProfileIndex];

        var targetProfileIndex = resultProfiles.findIndex(x => x.nick == target);
        if (targetProfileIndex == -1) {
            //console.log("[" + stanza.attrs.from + "][RemoveFriend]:Profile target not found");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '3' });
            return;
        }
        var targetProfile = resultProfiles[targetProfileIndex];

        global.db.warface.profiles.bulkWrite([{ "updateOne": { "filter": { _id: targetProfile._id }, "update": { $pull: { friends: myProfile._id } } } }, { "updateOne": { "filter": { _id: myProfile._id }, "update": { $pull: { friends: targetProfile._id } } } }], function (errBulkWrite, resultBulkWrite) {

            if (errBulkWrite) {
                //console.log("["+stanza.attrs.from+"][RemoveFriend]:Failed to remove, db error");
                global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '4' });
                return;
            }

            global.xmppClient.request(targetProfile.username + "@" + global.config.masterserver.domain + "/GameClient", new ltxElement("remove_friend", { target: myProfile.nick }));
            global.xmppClient.response(stanza, new ltxElement("remove_friend", { target: target }));

        });
    });
}