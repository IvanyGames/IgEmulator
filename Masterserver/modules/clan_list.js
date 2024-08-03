var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][ClanList]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    var profileClanName = profileObject.clan_name;

    if (!profileClanName) {
        responseClanList(stanza, 0);
        return;
    }

    global.db.warface.clans.findOne({ "name": profileClanName }, { "projection": { "leaderboard_position": 1 } }, function (errClan, resultClan) {

        if (errClan) {
            console.log("[Clan][GetClanInfo]:ClanName '" + profileClanName + "', failed to find, db query execute error");
            responseClanList(stanza, 0);
            return;
        }

        if (!resultClan) {
            console.log("[Clan][GetClanInfo]:ClanName '" + profileClanName + "', failed to find, not found");
            responseClanList(stanza, 0);
            return;
        }

        responseClanList(stanza, resultClan.leaderboard_position);
    });


}

function responseClanList(stanza, leaderboardPosition) {

    var elementClanList = new ltxElement("clan_list");

    var elementClanPerformance = elementClanList.c("clan_performance", { position: leaderboardPosition });

    for (var i = 0; i < global.cache.clan_list.data.length; i++) {
        var clanInfo = global.cache.clan_list.data[i];
        elementClanPerformance.c("clan", { name: clanInfo.name, master: clanInfo.master, clan_points: clanInfo.clan_points, members: clanInfo.members });
    }

    global.xmppClient.response(stanza, elementClanList);
}