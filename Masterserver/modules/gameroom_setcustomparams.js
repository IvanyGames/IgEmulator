var ltxElement = require('ltx').Element
var scriptGameroom = require('../scripts/gameroom.js');

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][GameroomSetcustomparams]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "4" });
        return;
    }

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        //console.log("[" + stanza.attrs.from + "][GameroomSetcustomparams]:The player is not in the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
        return;
    }

    var playerObject = profileObject.room_player_object;

    var friendly_fire = stanza.children[0].children[0].attrs.friendly_fire;
    var enemy_outlines = stanza.children[0].children[0].attrs.enemy_outlines;
    //var auto_team_balance = stanza.children[0].children[0].attrs.auto_team_balance;
    var dead_can_chat = stanza.children[0].children[0].attrs.dead_can_chat;
    var join_in_the_process = stanza.children[0].children[0].attrs.join_in_the_process;
    var max_players = stanza.children[0].children[0].attrs.max_players;
    //var round_limit = stanza.children[0].children[0].attrs.round_limit;
    //var inventory_slot = stanza.children[0].children[0].attrs.inventory_slot;


    if (roomObject.room_type != 1 && roomObject.room_type != 2 && roomObject.room_type != 4) {
        //console.log("[" + stanza.attrs.from + "][GameroomSetcustomparams]:Changing mission is not allowed in this type of room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '6' });
        return;
    }

    if (playerObject.profile_id != roomObject.room_master.master) {
        //console.log("[" + stanza.attrs.from + "][GameroomSetcustomparams]:The player is not the master of the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '7' });
        return;
    }

    if (playerObject.status == 1) {
        //console.log("[" + stanza.attrs.from + "][GameroomSetcustomparams]:The player is ready");s
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '8' });
        return;
    }

    if (roomObject.session.status != 0) {
        //console.log("[" + stanza.attrs.from + "][GameroomSetcustomparams]:Changing leader is prohibited when the session is running");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '9' });
        return;
    }

    var setRoomType = roomObject.room_type;

    var missionGameModeToValidate = roomObject.mission.mode;

    var setRestrictionFriendlyFire = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "friendly_fire", setRoomType, friendly_fire));
    var setRestrictionEnemyOutlines = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "enemy_outlines", setRoomType, enemy_outlines));
    //var setRestrictionAutoTeamBalance = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "auto_team_balance", setRoomType, auto_team_balance));
    var setRestrictionDeadCanChat = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "dead_can_chat", setRoomType, dead_can_chat));
    var setRestrictionJoinInTheProcess = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "join_in_the_process", setRoomType, join_in_the_process));
    var setRestrictionMaxPlayers = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "max_players", setRoomType, max_players));
    //var setRestrictionRoundLimit = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "round_limit", setRoomType, round_limit));
    //var setRestrictionInventorySlot = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "inventory_slot", setRoomType, inventory_slot));

    //Update CustomParams
    roomObject.custom_params.friendly_fire = setRestrictionFriendlyFire;
    roomObject.custom_params.enemy_outlines = setRestrictionEnemyOutlines;
    //roomObject.custom_params.auto_team_balance = setRestrictionAutoTeamBalance;
    roomObject.custom_params.dead_can_chat = setRestrictionDeadCanChat;
    roomObject.custom_params.join_in_the_process = setRestrictionJoinInTheProcess;
    roomObject.custom_params.max_players = setRestrictionMaxPlayers;
    //roomObject.custom_params.round_limit = setRestrictionRoundLimit;
    //roomObject.custom_params.inventory_slot = setRestrictionInventorySlot;

    roomObject.custom_params.revision++;

    var elementGameroom = new ltxElement("gameroom_setcustomparams");
    elementGameroom.children.push(scriptGameroom.getClientLtx(roomObject, false));
    global.xmppClient.response(stanza, elementGameroom);
}