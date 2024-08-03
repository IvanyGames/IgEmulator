var ltx = require('ltx');
var scriptGameroom = require('../scripts/gameroom.js');

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][GameroomUpdatePvP]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "4" });
        return;
    }

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        //console.log("[" + stanza.attrs.from + "][GameroomUpdatePvP]:The player is not in the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
        return;
    }

    var playerObject = profileObject.room_player_object;

    var by_mission_key = stanza.children[0].children[0].attrs.by_mission_key;
    var data = stanza.children[0].children[0].attrs.data;
    var mission_key = stanza.children[0].children[0].attrs.mission_key;
    var private = stanza.children[0].children[0].attrs.private;

    var friendly_fire = stanza.children[0].children[0].attrs.friendly_fire;
    var enemy_outlines = stanza.children[0].children[0].attrs.enemy_outlines;
    var auto_team_balance = stanza.children[0].children[0].attrs.auto_team_balance;
    var join_in_the_process = stanza.children[0].children[0].attrs.join_in_the_process;
    var max_players = stanza.children[0].children[0].attrs.max_players;
    var round_limit = stanza.children[0].children[0].attrs.round_limit;
    var preround_time = stanza.children[0].children[0].attrs.preround_time;
    var inventory_slot = stanza.children[0].children[0].attrs.inventory_slot;
    var locked_spectator_camera = stanza.children[0].children[0].attrs.locked_spectator_camera;
    var high_latency_autokick = stanza.children[0].children[0].attrs.high_latency_autokick;
    var overtime_mode = stanza.children[0].children[0].attrs.overtime_mode;

    var cClassRifleman = stanza.children[0].children[0].getChild("class_rifleman");
    var cClassHeavy = stanza.children[0].children[0].getChild("class_heavy");
    var cClassEngineer = stanza.children[0].children[0].getChild("class_engineer");
    var cClassMedic = stanza.children[0].children[0].getChild("class_medic");
    var cClassSniper = stanza.children[0].children[0].getChild("class_sniper");

    var class_rifleman = cClassRifleman ? cClassRifleman.attrs.enabled : null;
    var class_heavy = cClassHeavy ? cClassHeavy.attrs.enabled : null;
    var class_engineer = cClassEngineer ? cClassEngineer.attrs.enabled : null;
    var class_medic = cClassMedic ? cClassMedic.attrs.enabled : null;
    var class_sniper = cClassSniper ? cClassSniper.attrs.enabled : null;

    if (roomObject.room_type != 1 && roomObject.room_type != 2 && roomObject.room_type != 4) {
        //console.log("[" + stanza.attrs.from + "][GameroomUpdatePvP]:Changing mission is not allowed in this type of room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '6' });
        return;
    }

    if (playerObject.profile_id != roomObject.room_master.master) {
        //console.log("[" + stanza.attrs.from + "][GameroomUpdatePvP]:The player is not the master of the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '7' });
        return;
    }

    if (playerObject.status == 1) {
        //console.log("[" + stanza.attrs.from + "][GameroomUpdatePvP]:The player is ready");s
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '8' });
        return;
    }

    if (roomObject.session.status != 0) {
        //console.log("[" + stanza.attrs.from + "][GameroomUpdatePvP]:Changing leader is prohibited when the session is running");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '9' });
        return;
    }

    var missionInfo;

    if (global.config.allow_dev_maps && by_mission_key == "0" && data) {
        try {
            missionInfo = ltx.parse(data);
        } catch (e) {

        }
    } else {
        missionInfo = (global.startupParams.channel == "pve" ? global.CacheQuickAccess.missionsPvE.uid[mission_key] : global.resources.missions.uid[mission_key]);
    }

    if (!missionInfo) {
        //console.log("[" + stanza.attrs.from + "][GameroomUpdatePvP]:Mission is not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '10' });
        return;
    }

    if (!scriptGameroom.validateMissionAvailabilityOnChannel(missionInfo)) {
        //console.log("[" + stanza.attrs.from + "][GameroomUpdatePvP]:The mission is not available on this channel");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '11' });
        return;
    }

    var setRoomType = roomObject.room_type;

    if (!scriptGameroom.validateMissionByRoomType(missionInfo, setRoomType)) {
        //console.log("[" + stanza.attrs.from + "][GameroomUpdatePvP]:Validate mission by room type failed");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '12' });
        return;
    }

    var setPrivate = private != null ? (private == "1" ? 1 : 0) : roomObject.core.private;

    var missionGameModeToValidate = missionInfo.attrs.game_mode == "pve" ? missionInfo.attrs.mission_type : missionInfo.attrs.game_mode;

    var setSettingAutobalanceGroupMode = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "autobalance_group_mode", setRoomType));
    var setSettingMaxPlayers = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "max_players", setRoomType));
    var setSettingMinPlayersReady = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "min_players_ready", setRoomType));
    var setSettingNoTeamsMode = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "no_teams_mode", setRoomType));
    var setSettingTeamsReadyPlayersDiff = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "teams_ready_players_diff", setRoomType));
    var setSettingClassPattern = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "class_pattern", setRoomType));
    var setSettingAutostartIntermissionTimeoutSec = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "autostart_intermission_timeout_sec", setRoomType));
    var setSettingAutostartPostSessionTimeoutSec = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "autostart_post_session_timeout_sec", setRoomType));
    var setSettingAutostartJoinedIntermissionTimeoutSec = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "autostart_joined_intermission_timeout_sec", setRoomType));
    var setSettingMinPlayersForRoomCreation = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "min_players_for_room_creation", setRoomType));
    var setSettingMinPlayersForRoomJoining = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "min_players_for_room_joining", setRoomType));
    var setSettingRestrictMmAfterStartSec = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "restrict_mm_after_start_sec", setRoomType));
    var setSettingMaxGroupSize = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "max_group_size", setRoomType));
    var setSettingInsufficientPlayersRoomClose = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "insufficient_players_room_close", setRoomType));
    var setSettingSetObserverAllowed = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "set_observer_allowed", setRoomType));
    var setSettingIgnoreStatistics = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "ignore_statistics", setRoomType));
    var setSettingIgnoreAchievements = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "ignore_achievements", setRoomType));
    var setSettingIgnoreContracts = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "ignore_contracts", setRoomType));
    var setSettingIgnoreBattlePass = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "ignore_battle_pass", setRoomType));

    var setRestrictionFriendlyFire = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "friendly_fire", setRoomType, friendly_fire));
    var setRestrictionEnemyOutlines = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "enemy_outlines", setRoomType, enemy_outlines));
    var setRestrictionAutoTeamBalance = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "auto_team_balance", setRoomType, auto_team_balance));
    var setRestrictionJoinInTheProcess = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "join_in_the_process", setRoomType, join_in_the_process));
    var setRestrictionMaxPlayers = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "max_players", setRoomType, max_players));
    var setRestrictionRoundLimit = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "round_limit", setRoomType, round_limit));
    var setRestrictionPreroundTime = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "preround_time", setRoomType, preround_time));
    var setRestrictionInventorySlot = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "inventory_slot", setRoomType, inventory_slot));
    var setRestrictionLockedSpectatorCamera = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "locked_spectator_camera", setRoomType, locked_spectator_camera));
    var setRestrictionHighLatencyAutokick = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "high_latency_autokick", setRoomType, high_latency_autokick));
    var setRestrictionOvertimeMode = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "overtime_mode", setRoomType, overtime_mode));

    var setRestrictionClassRifleman = setRoomType != 1 ? Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "class_rifleman", setRoomType, class_rifleman)) : 1;
    var setRestrictionClassHeavy = setRoomType != 1 ? Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "class_heavy", setRoomType, class_heavy)) : 1;
    var setRestrictionClassEngineer = setRoomType != 1 ? Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "class_engineer", setRoomType, class_engineer)) : 1;
    var setRestrictionClassMedic = setRoomType != 1 ? Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "class_medic", setRoomType, class_medic)) : 1;
    var setRestrictionClassSniper = setRoomType != 1 ? Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "class_sniper", setRoomType, class_sniper)) : 1;

    var classRestrictionObject = scriptGameroom.getNewClassRestrictionObject(setRestrictionClassRifleman, setRestrictionClassHeavy, setRestrictionClassSniper, setRestrictionClassMedic, setRestrictionClassEngineer);

    //Update CustomParams
    roomObject.custom_params.friendly_fire = setRestrictionFriendlyFire;
    roomObject.custom_params.enemy_outlines = setRestrictionEnemyOutlines;
    roomObject.custom_params.auto_team_balance = setRestrictionAutoTeamBalance;
    roomObject.custom_params.join_in_the_process = setRestrictionJoinInTheProcess;
    roomObject.custom_params.max_players = setRestrictionMaxPlayers;
    roomObject.custom_params.round_limit = setRestrictionRoundLimit;
    roomObject.custom_params.preround_time = setRestrictionPreroundTime;
    roomObject.custom_params.inventory_slot = setRestrictionInventorySlot;
    roomObject.custom_params.locked_spectator_camera = setRestrictionLockedSpectatorCamera;
    roomObject.custom_params.high_latency_autokick = setRestrictionHighLatencyAutokick;
    roomObject.custom_params.overtime_mode = setRestrictionOvertimeMode;
    roomObject.custom_params.class_restriction = classRestrictionObject.setFlag;
    roomObject.custom_params.class_restriction_arr = classRestrictionObject.setArr;

    roomObject.custom_params.revision++;

    //Update Mission
    roomObject.mission.name = missionInfo.attrs.name;
    roomObject.mission.setting = missionInfo.getChild("Basemap").attrs.name;
    roomObject.mission.mode = missionInfo.attrs.game_mode;
    roomObject.mission.image = missionInfo.getChild("UI").getChild("Description").attrs.icon;
    roomObject.mission.mode_name = missionInfo.getChild("UI").getChild("GameMode").attrs.text;
    roomObject.mission.mode_icon = missionInfo.getChild("UI").getChild("GameMode").attrs.icon;
    roomObject.mission.no_teams = setSettingNoTeamsMode;
    roomObject.mission.description = missionInfo.getChild("UI").getChild("Description").attrs.text;
    roomObject.mission.mission_key = missionInfo.attrs.uid;
    roomObject.mission.time_of_day = missionInfo.attrs.time_of_day;
    roomObject.mission.difficulty = (missionInfo.attrs.difficulty ? missionInfo.attrs.difficulty : "normal");
    roomObject.mission.type = (missionInfo.attrs.mission_type ? missionInfo.attrs.mission_type : "");
    roomObject.mission.objective_info = scriptGameroom.getMissionObjectivesObject(missionInfo);
    roomObject.mission.crown_info = scriptGameroom.getCrownRewardsAndThresholdsObject(missionInfo);

    roomObject.mission.revision++;

    if (roomObject.auto_start.joined_intermission_timeout != setSettingAutostartJoinedIntermissionTimeoutSec || roomObject.auto_start.intermission_timeout_sec != setSettingAutostartIntermissionTimeoutSec || roomObject.auto_start.post_session_timeout_sec != setSettingAutostartPostSessionTimeoutSec) {

        roomObject.auto_start.joined_intermission_timeout = setSettingAutostartJoinedIntermissionTimeoutSec;
        roomObject.auto_start.intermission_timeout_sec = setSettingAutostartIntermissionTimeoutSec;
        roomObject.auto_start.post_session_timeout_sec = setSettingAutostartPostSessionTimeoutSec;

        roomObject.auto_start.revision++;
    }

    var newVoiceChatValue = (setRoomType == 32 || ((setRoomType == 1 || setRoomType == 16) && (missionInfo.attrs.mission_type != "trainingmission" && missionInfo.attrs.mission_type != "easymission" && missionInfo.attrs.mission_type != "normalmission" && missionInfo.attrs.mission_type != "hardmission"))) ? 1 : 0;

    if (roomObject.voice_chat.enabled != newVoiceChatValue) {
        roomObject.voice_chat.enabled = newVoiceChatValue;
        roomObject.voice_chat.revision++;
    }

    //Update Core
    roomObject.core.min_ready_players = setSettingMinPlayersReady;
    roomObject.core.teams_ready_players_diff = setSettingTeamsReadyPlayersDiff;
    roomObject.core.private = setPrivate;

    for (var i = 0; i < roomObject.core.players.length; i++) {

        var localObjectPlayer = roomObject.core.players[i];

        localObjectPlayer.status = scriptGameroom.getNewPlayerStatus(roomObject, localObjectPlayer.missions_unlocked, localObjectPlayer.classes_unlocked, localObjectPlayer.mission_access_tokens);
        localObjectPlayer.class_id = scriptGameroom.getNewPlayerClassId(roomObject, localObjectPlayer.class_id, localObjectPlayer.classes_unlocked);
    }

    roomObject.core.can_start = roomObject.core.can_start = scriptGameroom.getCanStart(roomObject);

    roomObject.core.revision++;

    roomObject.missionBase64 = Buffer.from(String(missionInfo)).toString('base64');

    var elementGameroom = new ltx.Element(stanza.children[0].children[0].name);
    elementGameroom.children.push(scriptGameroom.getClientLtx(roomObject, false));
    global.xmppClient.response(stanza, elementGameroom);
}