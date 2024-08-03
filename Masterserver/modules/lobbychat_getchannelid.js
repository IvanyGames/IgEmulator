var ltxElement = require('ltx').Element
var scriptTools = require('../scripts/tools.js')

exports.module = function (stanza) {
    var channel = stanza.children[0].children[0].attrs.channel;

    var profileObject = global.users.jid[stanza.attrs.from];

    if(!profileObject){
        //console.log("[" + stanza.attrs.from + "][LobbychatGetchannelid]:Profile not found");
        return;
    }

    switch (channel) {
        case "0":
            //console.log("[" + stanza.attrs.from + "][LobbychatGetchannelid]:Chat channel '" + channel + "' is globalchat, ok");
            global.xmppClient.response(stanza, new ltxElement("chat", { "channel": channel, "channel_id": "global." + global.startupParams.resource, "service_id": "conference." + global.config.masterserver.domain }));
            break;
        case "1":

            var roomObject = profileObject.room_object;

            if (!roomObject) {
                //console.log("[" + stanza.attrs.from + "][LobbychatGetchannelid]:Chat channel '" + channel + "' is roomAll, the player is not in the room");
                return;
            }

            global.xmppClient.response(stanza, new ltxElement("chat", { "channel": channel, "channel_id": "room." + global.startupParams.resource + "." + roomObject.room_id, "service_id": "conference." + global.config.masterserver.domain }));
            break;
        case "2":

            var roomObject = profileObject.room_object;

            if (!roomObject) {
                //console.log("[" + stanza.attrs.from + "][LobbychatGetchannelid]:Chat channel '" + channel + "' is roomTeam, the player is not in the room");
                return;
            }
        
            var playerObject = profileObject.room_player_object;

            global.xmppClient.response(stanza, new ltxElement("chat", { "channel": channel, "channel_id": "room." + global.startupParams.resource + "." + roomObject.room_id + "." + playerObject.team_id, "service_id": "conference." + global.config.masterserver.domain }));
            break;
        case "3":

            if(!profileObject.clan_name){
                //console.log("[" + stanza.attrs.from + "][LobbychatGetchannelid]:Chat channel '" + channel + "' is clanchat, user in not in clan");
                return;
            }

            global.xmppClient.response(stanza, new ltxElement("chat", { "channel": channel, "channel_id": "clan." + scriptTools.getHexStringFromString(profileObject.clan_name), "service_id": "conference." + global.config.masterserver.domain }));
            break;
        default:
            //console.log("[" + stanza.attrs.from + "][LobbychatGetchannelid]:Chat channel '" + channel + "' in not found");
            global.xmppClient.response(stanza, new ltxElement("chat", { "channel": channel, "channel_id": "undefined", "service_id": "conference." + global.config.masterserver.domain }));
    }
}