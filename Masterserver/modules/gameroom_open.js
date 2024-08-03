var ltxElement = require('ltx').Element
var gameroom_leave = require('./gameroom_leave.js')
var scriptGameroom = require('../scripts/gameroom.js');
var scriptTools = require('../scripts/tools.js');

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("[" + stanza.attrs.from + "][GameroomOpen]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "25" });
        return;
    }

    var room_name = stanza.children[0].children[0].attrs.room_name;

    var team_id = stanza.children[0].children[0].attrs.team_id;
    var status = stanza.children[0].children[0].attrs.status;
    var class_id = stanza.children[0].children[0].attrs.class_id;

    var room_type = stanza.children[0].children[0].attrs.room_type;
    //room_type = 8;

    var private = stanza.children[0].children[0].attrs.private;
    var mission = stanza.children[0].children[0].attrs.mission;

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

    gameroom_leave.module(stanza, false, false, 0);

    var missionInfo = (global.startupParams.channel == "pve" ? global.CacheQuickAccess.missionsPvE.uid[mission] : global.resources.missions.uid[mission]);

    if (!missionInfo) {
        //console.log("[" + stanza.attrs.from + "][GameroomOpen]:Mission is not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '1' });
        return;
    }

    if (!scriptGameroom.validateMissionAvailabilityOnChannel(missionInfo)) {
        //console.log("[" + stanza.attrs.from + "][GameroomOpen]:The mission is not available on this channel");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '1' });
        return;
    }

    var setRoomType = Number(room_type);

    if (!scriptGameroom.validateMissionByRoomType(missionInfo, setRoomType)) {
        //console.log("[" + stanza.attrs.from + "][GameroomOpen]:Validate mission by room type failed");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '1' });
        return;
    }

    var setRoomName = room_name;
    if (!scriptGameroom.validateRoomName(setRoomName)) {
        //console.log("[" + stanza.attrs.from + "][GameroomOpen]:RoomName validation failed");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '16' });
        return;
    }

    var setPrivate = (private == "1" ? 1 : 0);

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

    var setRoomId = global.roomId; global.roomId++;

    var roomObject = {
        room_id: setRoomId,
        room_type: setRoomType,
        core: {
            room_name: setRoomName,
            private: setPrivate,
            teams_switched: 0,
            can_start: 0,
            team_balanced: 1,
            min_ready_players: setSettingMinPlayersReady,//setSettingMinPlayersReady
            can_pause: 1,
            teams_ready_players_diff: setSettingTeamsReadyPlayersDiff,//setSettingTeamsReadyPlayersDiff
            players: [],
            team_colors: [
                { id: 1, color: 4294907157 },
                { id: 2, color: 4279655162 }
            ],
            room_left_players: [],
            revision: 1,
            synchronized_revision: 1
        },
        room_master: {
            master: profileObject._id,
            revision: 1,
            synchronized_revision: 1
        },
        auto_start: {
            auto_start_timeout_end: 0,
            auto_start_timeout: 0,
            can_manual_start: 0,
            joined_intermission_timeout: setSettingAutostartJoinedIntermissionTimeoutSec,
            intermission_timeout_sec: setSettingAutostartIntermissionTimeoutSec,
            post_session_timeout_sec: setSettingAutostartPostSessionTimeoutSec,
            revision: 1,
            synchronized_revision: 1
        },
        regions: {
            region_id: profileObject.region_id,
            revision: 1,
            synchronized_revision: 1
        },
        session: {
            id: "",
            status: 0,
            game_progress: 0,
            start_time: 0,
            team1_start_score: 0,
            team2_start_score: 0,
            end_time: 0,
            revision: 1,
            synchronized_revision: 1
        },
        mission: {
            name: missionInfo.attrs.name,
            setting: missionInfo.getChild("Basemap").attrs.name,
            mode: missionInfo.attrs.game_mode,
            image: missionInfo.getChild("UI").getChild("Description").attrs.icon,
            mode_name: missionInfo.getChild("UI").getChild("GameMode").attrs.text,
            mode_icon: missionInfo.getChild("UI").getChild("GameMode").attrs.icon,
            no_teams: setSettingNoTeamsMode,
            description: missionInfo.getChild("UI").getChild("Description").attrs.text,
            mission_key: missionInfo.attrs.uid,
            time_of_day: missionInfo.attrs.time_of_day,
            difficulty: (missionInfo.attrs.difficulty ? missionInfo.attrs.difficulty : "normal"),
            type: (missionInfo.attrs.mission_type ? missionInfo.attrs.mission_type : ""),
            objective_info: scriptGameroom.getMissionObjectivesObject(missionInfo),
            crown_info: scriptGameroom.getCrownRewardsAndThresholdsObject(missionInfo),
            revision: 1,
            synchronized_revision: 1
        },
        clan_war: {
            clan_1: profileObject.clan_name,
            clan_2: "",
            revision: 1,
            synchronized_revision: 1
        },
        voice_chat: {
            enabled: (setRoomType == 32 || ((setRoomType == 1 || setRoomType == 16) && (missionInfo.attrs.mission_type != "trainingmission" && missionInfo.attrs.mission_type != "easymission" && missionInfo.attrs.mission_type != "normalmission" && missionInfo.attrs.mission_type != "hardmission"))) ? 1 : 0,
            revision: 1,
            synchronized_revision: 1
        },
        custom_params: {
            friendly_fire: setRestrictionFriendlyFire,
            enemy_outlines: setRestrictionEnemyOutlines,
            auto_team_balance: setRestrictionAutoTeamBalance,
            join_in_the_process: setRestrictionJoinInTheProcess,
            max_players: setRestrictionMaxPlayers,
            round_limit: setRestrictionRoundLimit,
            preround_time: setRestrictionPreroundTime,
            inventory_slot: setRestrictionInventorySlot,
            locked_spectator_camera: setRestrictionLockedSpectatorCamera,
            high_latency_autokick: setRestrictionHighLatencyAutokick,
            overtime_mode: setRestrictionOvertimeMode,
            class_restriction: classRestrictionObject.setFlag,
            class_restriction_arr: classRestrictionObject.setArr,
            revision: 1,
            synchronized_revision: 1
        },
        kick_vote_params: {
            success: 0.6,
            timeout: 60,
            cooldown: 10,//300
            revision: 1,
            synchronized_revision: 1
        },
        ingame_chat: {
            revision: 1,
            synchronized_revision: 1
        },
        kicked: [],
        invited: [],
        voting: [],
        dedicatedServerJid: null,
        missionBase64: Buffer.from(String(missionInfo)).toString('base64')
    }

    var setMissionAccessTokens = scriptGameroom.getNewPlayerMissionAccessTokens(profileObject.items);

    var setTeamId = scriptGameroom.getNewPlayerTeamId(roomObject, profileObject.clan_name);
    var setStatus = scriptGameroom.getNewPlayerStatus(roomObject, profileObject.missions_unlocked, profileObject.classes_unlocked, setMissionAccessTokens);
    var setClassId = scriptGameroom.getNewPlayerClassId(roomObject, profileObject.current_class, profileObject.classes_unlocked);

    var playerObject = {
        profile_id: profileObject._id,
        online_id: stanza.attrs.from,
        nickname: profileObject.nick,
        clanName: profileObject.clan_name,
        experience: profileObject.experience,
        rank: scriptTools.getLevelByExp(profileObject.experience),
        banner_badge: profileObject.banner_badge,
        banner_mark: profileObject.banner_mark,
        banner_stripe: profileObject.banner_stripe,
        team_id: setTeamId,
        status: setStatus,
        skill: 0.000,
        presence: profileObject.status,
        class_id: setClassId,
        observer: 0,
        region_id: profileObject.region_id,
        missions_unlocked: profileObject.missions_unlocked.slice(0),
        classes_unlocked: profileObject.classes_unlocked.slice(0),
        mission_access_tokens: setMissionAccessTokens,
        is_reserved: false
    };

    roomObject.core.players.push(playerObject);

    profileObject.room_object = roomObject;
    profileObject.room_player_object = playerObject;

    roomObject.core.can_start = scriptGameroom.getCanStart(roomObject);

    global.gamerooms.push(roomObject);

    var elementGameroomOpen = new ltxElement("gameroom_open");
    elementGameroomOpen.children.push(scriptGameroom.getClientLtx(roomObject, true));
    global.xmppClient.response(stanza, elementGameroomOpen);
}

//1-Миссия недоступна
//2-Не удалось подключится к игру, вход в комнату
//3-Не удалось подключится к игру, вход в комнату
//4-Не удалось подключится к игру, вход в комнату
//5-Не удалось подключится к игру, вход в комнату
//6-Не удалось создать комнату
//7-Не удалось создать комнату
//8-Не удалось подключится к игру, вход в комнату
//9-Не удалось подключится к игру, вход в комнату
//10-Не удалось подключится к игру, вход в комнату
//11-Не удалось подключится к игру, вход в комнату
//12-Не удалось подключится к игру, вход в комнату
//16-Не допустимое название комнаты
//17-Это назване комнаты зарезервировано
//18-Не удалось подключится к игру, вход в комнату, версия игры устарела, пожалуйста запустите обновление
//19-Ну удалось создать комнату
//20-Ну удалось создать комнату
//21-Не удалось подключится к игру, вход в комнату
//22-Не удалось подключится к игру, вход в комнату
//23-Ну удалось создать комнату
//24-Не удалось подключится к игру, вход в комнату
//25-Ну удалось создать комнату