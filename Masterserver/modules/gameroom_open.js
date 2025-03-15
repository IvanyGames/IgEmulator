var ltxElement = require('ltx').Element
var gameroom_leave = require('./gameroom_leave.js')
var scriptGameroom = require('../scripts/gameroom.js');

exports.module = function (stanza, isAutomaticCreation, manualRoomType, manualMission, manualRoomName) {

    if (!isAutomaticCreation) {

        var profileObject = global.users.jid[stanza.attrs.from];

        if (!profileObject) {
            //console.log("[" + stanza.attrs.from + "][GameroomOpen]:Profile not found");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "25" });
            return;
        }

    }

    var room_name = null;

    var team_id = null;
    var status = null;
    var class_id = null;

    var room_type = null;

    var private = null;
    var mission = null;

    var friendly_fire = null;
    var enemy_outlines = null;
    var auto_team_balance = null;
    var dead_can_chat = null;
    var join_in_the_process = null;
    var max_players = null;
    var round_limit = null;
    var inventory_slot = null;

    var cClassRifleman = null;
    var cClassEngineer = null;
    var cClassMedic = null;
    var cClassSniper = null;

    if (!isAutomaticCreation) {

        room_name = stanza.children[0].children[0].attrs.room_name;

        team_id = stanza.children[0].children[0].attrs.team_id;
        status = stanza.children[0].children[0].attrs.status;
        class_id = stanza.children[0].children[0].attrs.class_id;

        room_type = stanza.children[0].children[0].attrs.room_type;

        private = stanza.children[0].children[0].attrs.private;
        mission = stanza.children[0].children[0].attrs.mission;

        friendly_fire = stanza.children[0].children[0].attrs.friendly_fire;
        enemy_outlines = stanza.children[0].children[0].attrs.enemy_outlines;
        auto_team_balance = stanza.children[0].children[0].attrs.auto_team_balance;
        dead_can_chat = stanza.children[0].children[0].attrs.dead_can_chat;
        join_in_the_process = stanza.children[0].children[0].attrs.join_in_the_process;
        max_players = stanza.children[0].children[0].attrs.max_players;
        round_limit = stanza.children[0].children[0].attrs.round_limit;
        inventory_slot = stanza.children[0].children[0].attrs.inventory_slot;

        cClassRifleman = stanza.children[0].children[0].getChild("class_rifleman");
        cClassEngineer = stanza.children[0].children[0].getChild("class_engineer");
        cClassMedic = stanza.children[0].children[0].getChild("class_medic");
        cClassSniper = stanza.children[0].children[0].getChild("class_sniper");

    }

    if (isAutomaticCreation) {
        var room_name = manualRoomName;
        var room_type = manualRoomType;
        var mission = manualMission;
    }

    var class_rifleman = cClassRifleman ? cClassRifleman.attrs.enabled : null;
    var class_engineer = cClassEngineer ? cClassEngineer.attrs.enabled : null;
    var class_medic = cClassMedic ? cClassMedic.attrs.enabled : null;
    var class_sniper = cClassSniper ? cClassSniper.attrs.enabled : null;

    if (!isAutomaticCreation) {
        gameroom_leave.module(stanza, false, false, 0);
    }

    var missionInfo;

    if (global.startupParams.channel == "pve") {
        missionInfo = global.CacheQuickAccess.missionsPvE.uid[mission];
    } else if (global.startupParams.channel == "pvp_newbie" || global.startupParams.channel == "pvp_skilled" || global.startupParams.channel == "pvp_pro") {
        missionInfo = global.resources.missions.uid[mission];
    } else {

        missionInfo = global.CacheQuickAccess.missionsPvE.uid[mission];

        if (!missionInfo) {
            missionInfo = global.resources.missions.uid[mission];
        }
    }

    if (!missionInfo) {
        //console.log("[" + stanza.attrs.from + "][GameroomOpen]:Mission is not found");
        if (!isAutomaticCreation) {
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '1' });
        }
        return;
    }

    if (!scriptGameroom.validateMissionAvailabilityOnChannel(missionInfo)) {
        //console.log("[" + stanza.attrs.from + "][GameroomOpen]:The mission is not available on this channel");
        if (!isAutomaticCreation) {
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '1' });
        }
        return;
    }

    var setRoomType = Number(room_type);

    if (!scriptGameroom.validateMissionByRoomType(missionInfo, setRoomType)) {
        //console.log("[" + stanza.attrs.from + "][GameroomOpen]:Validate mission by room type failed");
        if (!isAutomaticCreation) {
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '1' });
        }
        return;
    }

    if (global.startupParams.swap_room_type == "1") {
        if (setRoomType == 1) {
            setRoomType = 2;
        } else if (setRoomType == 2) {
            setRoomType = 1;
        }
    }

    var setRoomName = room_name;
    if (!scriptGameroom.validateRoomName(setRoomName)) {
        //console.log("[" + stanza.attrs.from + "][GameroomOpen]:RoomName validation failed");
        if (!isAutomaticCreation) {
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '16' });
        }
        return;
    }

    var setPrivate = (private == "1" ? 1 : 0);

    var missionGameModeToValidate = (missionInfo.attrs.game_mode == "pve" && missionInfo.attrs.mission_type && scriptGameroom.getGameMode(missionInfo.attrs.mission_type)) ? missionInfo.attrs.mission_type : missionInfo.attrs.game_mode;

    //var setSettingMinPlayersReady = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "min_players_ready", setRoomType));
    var setSettingMinPlayersReady = 2;
    var setSettingNoTeamsMode = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "no_teams_mode", setRoomType));
    var setSettingTeamsReadyPlayersDiff = Number(scriptGameroom.getGameModeSettingValue(missionGameModeToValidate, "teams_ready_players_diff", setRoomType));

    var setRestrictionFriendlyFire = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "friendly_fire", setRoomType, friendly_fire));
    var setRestrictionEnemyOutlines = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "enemy_outlines", setRoomType, enemy_outlines));
    var setRestrictionAutoTeamBalance = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "auto_team_balance", setRoomType, auto_team_balance));
    var setRestrictionDeadCanChat = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "dead_can_chat", setRoomType, dead_can_chat));
    var setRestrictionJoinInTheProcess = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "join_in_the_process", setRoomType, join_in_the_process));
    var setRestrictionMaxPlayers = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "max_players", setRoomType, max_players));
    var setRestrictionRoundLimit = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "round_limit", setRoomType, round_limit));
    var setRestrictionInventorySlot = Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "inventory_slot", setRoomType, inventory_slot));

    var setRestrictionClassRifleman = setRoomType != 1 ? Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "class_rifleman", setRoomType, class_rifleman)) : 1;
    var setRestrictionClassEngineer = setRoomType != 1 ? Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "class_engineer", setRoomType, class_engineer)) : 1;
    var setRestrictionClassMedic = setRoomType != 1 ? Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "class_medic", setRoomType, class_medic)) : 1;
    var setRestrictionClassSniper = setRoomType != 1 ? Number(scriptGameroom.getGameModeRestrictionValue(missionGameModeToValidate, "class_sniper", setRoomType, class_sniper)) : 1;

    var classRestrictionObject = scriptGameroom.getNewClassRestrictionObject(setRestrictionClassRifleman, setRestrictionClassSniper, setRestrictionClassMedic, setRestrictionClassEngineer);

    var setRoomId = global.roomId; global.roomId++;

    //var setSettingMinPlayersReady = 2;

    var roomObject = {
        room_id: setRoomId,
        room_type: setRoomType,
        core: {
            room_name: setRoomName,
            private: setPrivate,
            teams_switched: 0,
            can_start: 0,
            team_balanced: 1,
            min_ready_players: setSettingMinPlayersReady,
            teams_ready_players_diff: setSettingTeamsReadyPlayersDiff,
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
            master: (setRoomType == 1 || setRoomType == 2 || setRoomType == 4) ? profileObject._id : 0,
            revision: 1,
            synchronized_revision: 1
        },
        auto_start: {
            auto_start_timeout_end: 0,
            auto_start_timeout: 0,
            can_manual_start: 0,
            joined_intermission_timeout: 10,
            intermission_timeout_sec: 30,
            post_session_timeout_sec: 60,
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
            type: (missionInfo.attrs.mission_type ? missionInfo.attrs.mission_type : null),
            objective_info: scriptGameroom.getMissionObjectivesObject(missionInfo),
            crown_info: scriptGameroom.getCrownRewardsAndThresholdsObject(missionInfo),
            revision: 1,
            synchronized_revision: 1
        },
        clan_war: {
            clan_1: !isAutomaticCreation ? profileObject.clan_name : "",
            clan_2: "",
            revision: 1,
            synchronized_revision: 1
        },
        custom_params: {
            friendly_fire: setRestrictionFriendlyFire,
            enemy_outlines: setRestrictionEnemyOutlines,
            auto_team_balance: setRestrictionAutoTeamBalance,
            dead_can_chat: setRestrictionDeadCanChat,
            join_in_the_process: setRestrictionJoinInTheProcess,
            max_players: setRestrictionMaxPlayers,
            round_limit: setRestrictionRoundLimit,
            inventory_slot: setRestrictionInventorySlot,
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
        regions: {
            region_id: !isAutomaticCreation ? profileObject.region_id : "global",
            revision: 1,
            synchronized_revision: 1
        },
        kicked: [],
        invited: [],
        voting: [],
        dedicatedServerJid: null,
        missionBase64: Buffer.from(String(missionInfo)).toString('base64')
    }

    if (!isAutomaticCreation) {

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
            banner_badge: profileObject.banner_badge,
            banner_mark: profileObject.banner_mark,
            banner_stripe: profileObject.banner_stripe,
            team_id: setTeamId,
            group_id: "",
            region_id: profileObject.region_id,
            status: setStatus,
            presence: profileObject.status,
            class_id: setClassId,
            observer: 0,
            skill: "1.000",
            missions_unlocked: profileObject.missions_unlocked.slice(0),
            classes_unlocked: profileObject.classes_unlocked.slice(0),
            mission_access_tokens: setMissionAccessTokens
        };

        roomObject.core.players.push(playerObject);

        profileObject.room_object = roomObject;
        profileObject.room_player_object = playerObject;

    }

    roomObject.core.can_start = scriptGameroom.getCanStart(roomObject);

    global.gamerooms.push(roomObject);

    if (!isAutomaticCreation) {

        var elementGameroomOpen = new ltxElement("gameroom_open");
        elementGameroomOpen.children.push(scriptGameroom.getClientLtx(roomObject, true));
        global.xmppClient.response(stanza, elementGameroomOpen);

        /*
        if (roomObject.room_type == 1) {
            setTimeout(global.xmppClient.request, 3000, stanza.attrs.from, new ltxElement("admin_cmd", { command: "Инфо", result: "Оригинальная логика ботов не сохранилась, но она была написана с нуля, поэтому она может отличатся" }));
        }
        */

    }

    if (isAutomaticCreation) {
        return roomObject;
    }
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