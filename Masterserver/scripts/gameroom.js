var ltxElement = require('ltx').Element

exports.validateMissionAvailabilityOnChannel = function (missionInfo) {

    if (!missionInfo.attrs.channels) {
        return true;
    }

    var missionChannels = missionInfo.attrs.channels.split(" ").join("").split(",");

    if (missionChannels.indexOf(global.startupParams.channel) == -1) {
        return false;
    }

    return true;
}

exports.validateMissionByRoomType = function (missionInfo, roomType) {

    if (roomType == 1) {

        return true;
    }

    if (roomType == 2) {

        if (missionInfo.attrs.only_clan_war_mission == "1") {
            return false;
        }

        return true;
    }

    if (roomType == 4) {

        if (missionInfo.attrs.clan_war_mission != "1") {
            return false;
        }

        return true;
    }

    if (roomType == 8) {

        if (missionInfo.attrs.only_clan_war_mission == "1" || global.resources.quickplayMaps.autostartMaps.indexOf(missionInfo.attrs.uid) == -1) {
            return false;
        }

        return true;
    }

    if (roomType == 16) {

        return true;
    }

    if (roomType == 32) {
        if (missionInfo.attrs.only_clan_war_mission == "1" || global.resources.quickplayMaps.ratingGameMaps.indexOf(missionInfo.attrs.uid) == -1 || missionInfo.attrs.rating_game_mission != "1") {
            return false;
        }
        return true;
    }

    return false;
}

//TODO валидация на мат
exports.validateRoomName = function (roomName) {

    if (!roomName || roomName.length < 3 || roomName.length > 32) {
        return false;
    }

    return true;
}

var gmDefaultValue = "0";

exports.getGameModeSettingValue = function (modeName, settingName, roomType) {

    var modeInfo = global.resources.configGameModes[modeName];
    if (!modeInfo) {
        //console.log("[Tools][GetGameModeSetting]:GameMode '"+modeName+"' not found");
        return gmDefaultValue;
    }

    var settingInfo = modeInfo.settings[settingName];
    if (!settingInfo) {
        //console.log("[Tools][GetGameModeSetting]:Setting '"+settingName+"' in GameMode '"+modeName+"' not found");
        return gmDefaultValue;
    }

    var settingValue = settingInfo[roomType];
    if (!settingValue) {
        if (settingInfo["-1"]) {
            //console.log("[Tools][GetGameModeSetting]:SettingValueByRoomType '"+roomType+"' in Setting '"+settingName+"' in GameMode '"+modeName+"' not found, using default RoomType");
            settingValue = settingInfo["-1"];
        } else {
            //console.log("[Tools][GetGameModeSetting]:SettingValueByRoomType '"+roomType+"' in Setting '"+settingName+"' in GameMode '"+modeName+"' not found, using "+gmDefaultValue);
            return gmDefaultValue;
        }
    }

    return settingValue;
}

exports.getGameModeRestrictionValue = function (modeName, restrictionName, roomType, sValue) {

    var modeInfo = global.resources.configGameModes[modeName];
    if (!modeInfo) {
        //console.log("[Tools][GetGameModeRestriction]:GameMode '"+modeName+"' not found");
        return gmDefaultValue;
    }

    var restrictionInfo = modeInfo.restrictions[restrictionName];
    if (!restrictionInfo) {
        //console.log("[Tools][GetGameModeRestriction]:Restriction '"+restrictionName+"' in GameMode '"+modeName+"' not found");
        return gmDefaultValue;
    }

    var restrictionValue = restrictionInfo[roomType];
    if (!restrictionValue) {
        if (restrictionInfo["-1"]) {
            //console.log("[Tools][GetGameModeRestriction]:RestrictionValueByRoomType '"+roomType+"' in Setting '"+restrictionName+"' in GameMode '"+modeName+"' not found, using default RoomType");
            restrictionValue = restrictionInfo["-1"];
        } else {
            //console.log("[Tools][GetGameModeRestriction]:RestrictionValueByRoomType '"+roomType+"' in Setting '"+restrictionName+"' in GameMode '"+modeName+"' not found, using "+gmDefaultValue);
            return gmDefaultValue;
        }
    }

    /*
    if(restrictionValue.channels && restrictionValue.channels.indexOf(global.startupParams.channel) == -1){
        console.log("[Tools][GetGameModeRestriction]:RestrictionValue '"+sValue+"' in RoomType '"+roomType+"' in Setting '"+restrictionName+"' in GameMode '"+modeName+"' not supported on '"+global.startupParams.channel+"' channel, using "+gmDefaultValue);
        return gmDefaultValue;		
    }
    */

    if (restrictionValue.allowed.indexOf(sValue) == -1) {
        //console.log("[Tools][GetGameModeRestriction]:RestrictionValue '"+sValue+"' in RoomType '"+roomType+"' in Setting '"+restrictionName+"' in GameMode '"+modeName+"' validation failed, using default value");
        return restrictionValue.default;
    }

    return sValue;
}

exports.getNewClassRestrictionObject = function (bRifleman, bHeavy, bSniper, bMedic, bEngineer) {

    var setClassRestrictionFlag = 255;
    var setClassRestrictionArr = [];

    bRifleman == 0 ? setClassRestrictionFlag -= 1 : setClassRestrictionArr.push(0);
    bHeavy == 0 ? setClassRestrictionFlag -= 2 : setClassRestrictionArr.push(1);
    bSniper == 0 ? setClassRestrictionFlag -= 4 : setClassRestrictionArr.push(2);
    bMedic == 0 ? setClassRestrictionFlag -= 8 : setClassRestrictionArr.push(3);
    bEngineer == 0 ? setClassRestrictionFlag -= 16 : setClassRestrictionArr.push(4);

    return { setFlag: setClassRestrictionFlag, setArr: setClassRestrictionArr };
}

exports.getMissionObjectivesObject = function (missionInfo) {

    var objectivesFactor = missionInfo.getChild("Sublevels").getChildren("Sublevel").length;

    if (objectivesFactor == 0) {
        objectivesFactor = 1;
    }

    var objectivesArr = [];

    var missionInfoObjectives = missionInfo.getChild("Objectives");

    if (missionInfoObjectives) {
        var missionInfoObjectivesArr = missionInfoObjectives.getChildren("Objective");
        for (var i = 0; i < missionInfoObjectivesArr.length; i++) {
            var missionObjectiveAttrs = missionInfoObjectivesArr[i].attrs;
            objectivesArr.push({ id: (missionObjectiveAttrs.id ? missionObjectiveAttrs.id : 0), type: missionObjectiveAttrs.type });
        }
    }

    return { factor: objectivesFactor, objectives: objectivesArr };
}

exports.getCrownRewardsAndThresholdsObject = function (missionInfo) {

    var mElementSublevelsArr = missionInfo.getChild("Sublevels").getChildren("Sublevel");

    var vTotalPerformance = { bronze: 0, silver: 0, gold: 0 };
    var vTime = { bronze: 4194304, silver: 4194304, gold: 4194304 };
    var vCrownRewards = { bronze: 0, silver: 0, gold: 0 };
    var vIsHaveCrownRewardsThresholds = false;

    for (var s = 0; s < mElementSublevelsArr.length; s++) {
        var mElementSublevel = mElementSublevelsArr[s];

        var mSublevelCrownRewardsThresholds = mElementSublevel.getChild("CrownRewardsThresholds");

        if (mSublevelCrownRewardsThresholds) {
            vIsHaveCrownRewardsThresholds = true;
            var mSublevelCrownRewardsThresholdsTotalPerformance = mSublevelCrownRewardsThresholds.getChild("TotalPerformance");
            var mSublevelCrownRewardsThresholdsTime = mSublevelCrownRewardsThresholds.getChild("Time");

            vTotalPerformance.bronze += Number(mSublevelCrownRewardsThresholdsTotalPerformance.attrs.bronze);
            vTotalPerformance.silver += Number(mSublevelCrownRewardsThresholdsTotalPerformance.attrs.silver);
            vTotalPerformance.gold += Number(mSublevelCrownRewardsThresholdsTotalPerformance.attrs.gold);

            vTime.bronze -= Number(mSublevelCrownRewardsThresholdsTime.attrs.bronze);
            vTime.silver -= Number(mSublevelCrownRewardsThresholdsTime.attrs.silver);
            vTime.gold -= Number(mSublevelCrownRewardsThresholdsTime.attrs.gold);
        }
    }

    if (!vIsHaveCrownRewardsThresholds) {
        return null;
    }

    var vCrownRewards = global.resources.RewardsConfiguration.CrownRewards[missionInfo.attrs.mission_type];
    if (!vCrownRewards) {
        console.log("[Tools][getGameRoomCrownRewardsAndThresholds]:Failed to get CrownRewardsInfo for mission type '" + missionInfo.attrs.mission_type)
        throw "";
    }


    return { TotalPerformance: vTotalPerformance, Time: vTime, CrownRewards: vCrownRewards };
}

exports.getNewPlayerTeamId = function (roomObject, playerClan) {

    if (roomObject.room_type == 1) {
        return 1;
    }

    if (roomObject.room_type == 4) {

        if (roomObject.clan_war.clan_1 == playerClan) {
            return 1;
        }

        if (roomObject.clan_war.clan_2 == playerClan) {
            return 2;
        }

        return 1;
    }

    if (roomObject.room_type == 2 || roomObject.room_type == 8) {

        var countPlayersTeam1 = 0;
        var countPlayersTeam2 = 0;

        for (var i = 0; i < roomObject.core.players.length; i++) {
            if (roomObject.core.players[i].team_id == 1) {
                countPlayersTeam1++;
            }
            if (roomObject.core.players[i].team_id == 2) {
                countPlayersTeam2++;
            }
        }

        if (countPlayersTeam2 >= countPlayersTeam1) {
            return 1;
        }

        return 2;
    }

    return 1;
}

exports.getNewPlayerStatus = function (roomObject, missionsUnlocked, classesUnlocked, missionAccessTokens) {

    var isClassesVerificationPassed = false;
    for (var i = 0; i < roomObject.custom_params.class_restriction_arr.length; i++) {
        if (classesUnlocked.indexOf(roomObject.custom_params.class_restriction_arr[i]) != -1) {
            isClassesVerificationPassed = true;
            break;
        }
    }

    //if ((roomObject.mission.mode == "pve" && missionsUnlocked.indexOf(roomObject.mission.type) == -1) || !isClassesVerificationPassed || (roomObject.mission.mode == "pve" && roomObject.mission.type != "trainingmission" && roomObject.mission.type != "easymission" && roomObject.mission.type != "normalmission" && roomObject.mission.type != "hardmission" && missionAccessTokens < 1)) {
    if ((roomObject.mission.mode == "pve" && (missionsUnlocked.indexOf(roomObject.mission.type) == -1 || (missionAccessTokens < 1 && roomObject.mission.type != "trainingmission" && roomObject.mission.type != "easymission" && roomObject.mission.type != "normalmission" && roomObject.mission.type != "hardmission"))) || !isClassesVerificationPassed) {
        return 2;
    }

    if (roomObject.room_type == 1 || roomObject.room_type == 2 || roomObject.room_type == 4) {
        return 0;
    }

    if (roomObject.room_type == 8 || roomObject.room_type == 16 || roomObject.room_type == 32) {
        return 1;
    }

    return 0;
}

exports.getNewPlayerClassId = function (roomObject, classId, classesArr) {

    if (roomObject.custom_params.class_restriction_arr.length == 0 || classesArr.length == 0) {
        return 0;
    }

    if (roomObject.custom_params.class_restriction_arr.indexOf(classId) == -1 || classesArr.indexOf(classId) == -1) {

        for (var i = 0; i < roomObject.custom_params.class_restriction_arr.length; i++) {
            if (classesArr.indexOf(roomObject.custom_params.class_restriction_arr[i]) != -1) {
                return roomObject.custom_params.class_restriction_arr[i];
            }
        }

        return classesArr[0];
    }

    return classId;
}

exports.getNewPlayerMissionAccessTokens = function (profileItemsArr) {

    var indexItemMissionAccessToken = profileItemsArr.findIndex(function (x) { return x.name == "mission_access_token_04" });

    if (indexItemMissionAccessToken == -1) {
        return 0;
    }

    return profileItemsArr[indexItemMissionAccessToken].quantity;
}

exports.getCanStart = function (roomObject) {

    return 1;

    var countPlayersTeam1 = 0;
    var countPlayersTeam2 = 0;

    for (var i = 0; i < roomObject.core.players.length; i++) {
        if (roomObject.core.players[i].status == 1) {
            if (roomObject.core.players[i].team_id == 1) {
                countPlayersTeam1++;
            }
            if (roomObject.core.players[i].team_id == 2) {
                countPlayersTeam2++;
            }
        }
    }

    var result = 1;

    if (roomObject.core.teams_ready_players_diff == 1) {
        if (countPlayersTeam1 < (roomObject.core.min_ready_players / 2) || countPlayersTeam2 < (roomObject.core.min_ready_players / 2)) {
            result = 0;
        }
    } else {
        if (countPlayersTeam1 + countPlayersTeam2 < roomObject.core.min_ready_players) {
            result = 0;
        }
    }

    return result;
}

exports.getClientLtx = function (roomObject, isGetAll) {

    var elementGameRoom = new ltxElement("game_room", { room_id: roomObject.room_id, room_type: roomObject.room_type });

    //Core group_id
    if (isGetAll || roomObject.core.revision != roomObject.core.synchronized_revision) {
        var elementCore = elementGameRoom.c("core", { teams_switched: roomObject.core.teams_switched, room_name: roomObject.core.room_name, private: roomObject.core.private, players: roomObject.core.players.length, can_start: roomObject.core.can_start, team_balanced: roomObject.core.team_balanced, min_ready_players: roomObject.core.min_ready_players, can_pause: roomObject.core.can_pause, revision: roomObject.core.revision });
        var elementPlayers = elementCore.c("players");
        var elementPlayersReserved = elementCore.c("playersReserved");
        for (var i = 0; i < roomObject.core.players.length; i++) {
            var roomPlayer = roomObject.core.players[i];
            var elementPlayer = new ltxElement("player", { profile_id: roomPlayer.profile_id, team_id: roomPlayer.team_id, status: roomPlayer.status, observer: roomPlayer.observer, skill: roomPlayer.skill, nickname: roomPlayer.nickname, clanName: roomPlayer.clanName, class_id: roomPlayer.class_id, online_id: roomPlayer.online_id, group_id: roomPlayer.group_id, presence: roomPlayer.presence, experience: roomPlayer.experience, rank: roomPlayer.rank, banner_badge: roomPlayer.banner_badge, banner_mark: roomPlayer.banner_mark, banner_stripe: roomPlayer.banner_stripe, region_id: roomPlayer.region_id });
            if (roomPlayer.is_reserved) {
                elementPlayersReserved.children.push(elementPlayer);
            } else {
                elementPlayers.children.push(elementPlayer);
            }
        }
        var elementTeamColors = elementCore.c("team_colors");
        for (var i = 0; i < roomObject.core.team_colors.length; i++) {
            var teamColor = roomObject.core.team_colors[i];
            elementTeamColors.c("team_color", { id: teamColor.id, color: teamColor.color });
        }
    }

    //Session
    if (isGetAll || roomObject.session.revision != roomObject.session.synchronized_revision) {
        elementGameRoom.c("session", { id: roomObject.session.id, status: roomObject.session.status, game_progress: roomObject.session.game_progress, start_time: roomObject.session.start_time, revision: roomObject.session.revision });
    }

    //CustomParams
    if (isGetAll || roomObject.custom_params.revision != roomObject.custom_params.synchronized_revision) {
        elementGameRoom.c("custom_params", { friendly_fire: roomObject.custom_params.friendly_fire, enemy_outlines: roomObject.custom_params.enemy_outlines, auto_team_balance: roomObject.custom_params.auto_team_balance, join_in_the_process: roomObject.custom_params.join_in_the_process, max_players: roomObject.custom_params.max_players, round_limit: roomObject.custom_params.round_limit, preround_time: roomObject.custom_params.preround_time, class_restriction: roomObject.custom_params.class_restriction, inventory_slot: roomObject.custom_params.inventory_slot, locked_spectator_camera: roomObject.custom_params.locked_spectator_camera, high_latency_autokick: roomObject.custom_params.high_latency_autokick, overtime_mode: roomObject.custom_params.overtime_mode, revision: roomObject.custom_params.revision });
    }

    //Mission
    if (isGetAll || roomObject.mission.revision != roomObject.mission.synchronized_revision) {

        var elementMission = elementGameRoom.c("mission", { mission_key: roomObject.mission.mission_key, no_teams: roomObject.mission.no_teams, name: roomObject.mission.name, setting: roomObject.mission.setting, mode: roomObject.mission.mode, mode_name: roomObject.mission.mode_name, mode_icon: roomObject.mission.mode_icon, description: roomObject.mission.description, image: roomObject.mission.image, difficulty: roomObject.mission.difficulty, type: roomObject.mission.type, time_of_day: roomObject.mission.time_of_day, revision: roomObject.mission.revision });
        var elementObjectives = elementMission.c("objectives", { factor: roomObject.mission.objective_info.factor });

        for (var i = 0; i < roomObject.mission.objective_info.objectives.length; i++) {
            var objectiveInfo = roomObject.mission.objective_info.objectives[i];
            elementObjectives.c("objective", { id: objectiveInfo.id, type: objectiveInfo.type });
        }

        if (roomObject.mission.crown_info != null) {
            var cElementCrownRewardsThresholds = elementMission.c("CrownRewardsThresholds");
            cElementCrownRewardsThresholds.c("TotalPerformance", roomObject.mission.crown_info.TotalPerformance);
            cElementCrownRewardsThresholds.c("Time", roomObject.mission.crown_info.Time);
            elementMission.c("CrownRewards", roomObject.mission.crown_info.CrownRewards);
        }
    }

    //ClanWar
    if (roomObject.room_type == 4 && (isGetAll || roomObject.clan_war.revision != roomObject.clan_war.synchronized_revision)) {
        elementGameRoom.c("clan_war", { clan_1: roomObject.clan_war.clan_1, clan_2: roomObject.clan_war.clan_2, revision: roomObject.clan_war.revision });
    }

    //VoiceChat
    if (isGetAll || roomObject.voice_chat.revision != roomObject.voice_chat.synchronized_revision) {
        elementGameRoom.c("voice_chat", { enabled: roomObject.voice_chat.enabled, revision: roomObject.voice_chat.revision });
    }

    /*
    //VoteStates
    if (isGetAll || roomObject.vote_states.revision != roomObject.vote_states.synchronized_revision) {
        var elementVoteStates = elementGameRoom.c("vote_states", { revision: roomObject.vote_states.revision });
        elementVoteStates.c("KickVote", { room_cooldown: roomObject.vote_states.room_cooldown });
    }
    */

    //RoomMaster
    if ((roomObject.room_type == 1 || roomObject.room_type == 2 || roomObject.room_type == 4) && (isGetAll || roomObject.room_master.revision != roomObject.room_master.synchronized_revision)) {
        elementGameRoom.c("room_master", { master: roomObject.room_master.master, revision: roomObject.room_master.revision });
    }

    //AutoStart
    if ((roomObject.room_type == 8 || roomObject.room_type == 16 || roomObject.room_type == 32) && (isGetAll || roomObject.auto_start.revision != roomObject.auto_start.synchronized_revision)) {

        var auto_start_timeout_left = 0;

        if (roomObject.auto_start.auto_start_timeout == 1) {

            auto_start_timeout_left = roomObject.auto_start.auto_start_timeout_end - Math.round(new Date().getTime() / 1000)

            if (auto_start_timeout_left < 0) {
                auto_start_timeout_left = 0;
            }
        }

        elementGameRoom.c("auto_start", { auto_start_timeout: roomObject.auto_start.auto_start_timeout, auto_start_timeout_left: auto_start_timeout_left, can_manual_start: roomObject.auto_start.can_manual_start, joined_intermission_timeout: roomObject.auto_start.joined_intermission_timeout, revision: roomObject.auto_start.revision });
    }


    //Regions
    if (isGetAll || roomObject.regions.revision != roomObject.regions.synchronized_revision) {
        elementGameRoom.c("regions", { region_id: roomObject.regions.region_id, revision: roomObject.regions.revision });
    }

    /*
    //SquadsColors
    if (isGetAll || roomObject.squads_colors.revision != roomObject.squads_colors.synchronized_revision) {
        var elementSquadsColors = elementGameRoom.c("squads_colors", { revision: roomObject.squads_colors.revision });
        for (var i = 0; i < roomObject.squads_colors.colors.length; i++) {
            var colorInfo = roomObject.squads_colors.colors[i];
            elementSquadsColors.c("squad_color", { id: colorInfo.id, color: colorInfo.color });
        }
    }
    */

    //KickVoteParams
    if (isGetAll || roomObject.kick_vote_params.revision != roomObject.kick_vote_params.synchronized_revision) {
        elementGameRoom.c("kick_vote_params", { success: roomObject.kick_vote_params.success, timeout: roomObject.kick_vote_params.timeout, cooldown: roomObject.kick_vote_params.cooldown, revision: roomObject.kick_vote_params.revision });
    }

    return elementGameRoom;
}

exports.getDedicatedLtx = function (roomObject, isGetAll) {

    var elementGameRoom = new ltxElement("game_room", { room_id: roomObject.room_id, room_type: roomObject.room_type });

    //Core
    if (isGetAll || roomObject.core.revision != roomObject.core.synchronized_revision) {
        var elementCore = elementGameRoom.c("core", { teams_switched: roomObject.core.teams_switched, revision: roomObject.core.revision });
        var elementPlayers = elementCore.c("players");
        for (var i = 0; i < roomObject.core.players.length; i++) {
            var roomPlayer = roomObject.core.players[i];
            var elementPlayer = new ltxElement("player", { profile_id: roomPlayer.profile_id, team_id: roomPlayer.team_id, status: roomPlayer.status, observer: roomPlayer.observer, skill: roomPlayer.skill });
            elementPlayers.children.push(elementPlayer);
        }
        var elementTeamColors = elementCore.c("team_colors");
        for (var i = 0; i < roomObject.core.team_colors.length; i++) {
            var teamColor = roomObject.core.team_colors[i];
            elementTeamColors.c("team_color", { id: teamColor.id, color: teamColor.color });
        }
        var elementRoomLeftPlayers = elementCore.c("room_left_players");
        for (var i = 0; i < roomObject.core.room_left_players.length; i++) {
            var roomLeftPlayer = roomObject.core.room_left_players[i];
            elementRoomLeftPlayers.c("player", { profile_id: roomLeftPlayer.profile_id, left_reason: roomLeftPlayer.left_reason });
        }
    }

    //Session
    if (isGetAll || roomObject.session.revision != roomObject.session.synchronized_revision) {
        elementGameRoom.c("session", { id: roomObject.session.id, start_time: roomObject.session.start_time, team1_start_score: roomObject.session.team1_start_score, team2_start_score: roomObject.session.team2_start_score, revision: roomObject.session.revision });
    }

    //CustomParams
    if (isGetAll || roomObject.custom_params.revision != roomObject.custom_params.synchronized_revision) {
        elementGameRoom.c("custom_params", { friendly_fire: roomObject.custom_params.friendly_fire, enemy_outlines: roomObject.custom_params.enemy_outlines, auto_team_balance: roomObject.custom_params.auto_team_balance, join_in_the_process: roomObject.custom_params.join_in_the_process, max_players: roomObject.custom_params.max_players, round_limit: roomObject.custom_params.round_limit, preround_time: roomObject.custom_params.preround_time, class_restriction: roomObject.custom_params.class_restriction, inventory_slot: roomObject.custom_params.inventory_slot, locked_spectator_camera: roomObject.custom_params.locked_spectator_camera, high_latency_autokick: roomObject.custom_params.high_latency_autokick, overtime_mode: roomObject.custom_params.overtime_mode, revision: roomObject.custom_params.revision });
    }

    //Mission
    if (isGetAll || roomObject.mission.revision != roomObject.mission.synchronized_revision) {
        elementGameRoom.c("mission", { mission_key: roomObject.mission.mission_key, no_teams: roomObject.mission.no_teams, mode: roomObject.mission.mode, type: roomObject.mission.type, data: roomObject.missionBase64, revision: roomObject.mission.revision });
    }

    //ClanWar
    if (roomObject.room_type == 4 && (isGetAll || roomObject.clan_war.revision != roomObject.clan_war.synchronized_revision)) {
        elementGameRoom.c("clan_war", { clan_1: roomObject.clan_war.clan_1, clan_2: roomObject.clan_war.clan_2, revision: roomObject.clan_war.revision });
    }

    //InGameChat
    if (isGetAll || roomObject.ingame_chat.revision != roomObject.ingame_chat.synchronized_revision) {
        elementGameRoom.c("ingame_chat", { revision: roomObject.ingame_chat.revision });
    }

    return elementGameRoom;
}

exports.getBrowserLtx = function (roomObject) {

    var elementGameRoom = new ltxElement("game_room", { room_id: roomObject.room_id, room_type: roomObject.room_type });

    //Core
    elementGameRoom.c("core", { teams_switched: roomObject.core.teams_switched, room_name: roomObject.core.room_name, private: roomObject.core.private, players: roomObject.core.players.length, can_start: roomObject.core.can_start, team_balanced: roomObject.core.team_balanced, min_ready_players: roomObject.core.min_ready_players, can_pause: roomObject.core.can_pause, revision: roomObject.core.revision });

    //Session
    elementGameRoom.c("session", { id: roomObject.session.id, status: roomObject.session.status, game_progress: roomObject.session.game_progress, start_time: roomObject.session.start_time, revision: roomObject.session.revision });

    //CustomParams
    elementGameRoom.c("custom_params", { friendly_fire: roomObject.custom_params.friendly_fire, enemy_outlines: roomObject.custom_params.enemy_outlines, auto_team_balance: roomObject.custom_params.auto_team_balance, join_in_the_process: roomObject.custom_params.join_in_the_process, max_players: roomObject.custom_params.max_players, round_limit: roomObject.custom_params.round_limit, preround_time: roomObject.custom_params.preround_time, class_restriction: roomObject.custom_params.class_restriction, inventory_slot: roomObject.custom_params.inventory_slot, locked_spectator_camera: roomObject.custom_params.locked_spectator_camera, high_latency_autokick: roomObject.custom_params.high_latency_autokick, overtime_mode: roomObject.custom_params.overtime_mode, revision: roomObject.custom_params.revision });

    //Mission
    elementGameRoom.c("mission", { mission_key: roomObject.mission.mission_key, no_teams: roomObject.mission.no_teams, name: roomObject.mission.name, setting: roomObject.mission.setting, mode: roomObject.mission.mode, mode_name: roomObject.mission.mode_name, mode_icon: roomObject.mission.mode_icon, description: roomObject.mission.description, image: roomObject.mission.image, difficulty: roomObject.mission.difficulty, type: roomObject.mission.type, time_of_day: roomObject.mission.time_of_day, revision: roomObject.mission.revision });

    //ClanWar
    if (roomObject.room_type == 4) {
        elementGameRoom.c("clan_war", { clan_1: roomObject.clan_war.clan_1, clan_2: roomObject.clan_war.clan_2, revision: roomObject.clan_war.revision });
    }

    //VoiceChat
    //elementGameRoom.c("voice_chat", { enabled: roomObject.voice_chat.enabled, revision: roomObject.voice_chat.revision });

    //Regions
    elementGameRoom.c("regions", { region_id: roomObject.regions.region_id, revision: roomObject.regions.revision });

    return elementGameRoom;
}

exports.startSession = function (roomObject, server) {

    var serverKey = null;

    for (serverLocalKey in global.dedicatedServersObject) {

        if (global.gamerooms.findIndex(function (x) { return x.dedicatedServerJid == serverLocalKey }) != -1) {
            continue;
        }

        var dedicatedServerObject = global.dedicatedServersObject[serverLocalKey];

        if (!server && dedicatedServerObject.server.indexOf("-local") != -1) {
            continue;
        }

        if (server && dedicatedServerObject.server != server) {
            continue;
        }

        serverKey = serverLocalKey;
        break;
    }

    if (!serverKey) {
        //console.log("[Gameroom][StartSession]:Not found free dedicated server");
        return false;
    }

    roomObject.session.id = global.sessionId;
    roomObject.session.status = 1;
    roomObject.session.game_progress = 0;
    roomObject.session.start_time = Math.round((new Date().getTime()) / 1000);
    roomObject.dedicatedServerJid = serverKey;
    roomObject.session.revision++;
    global.sessionId++;

    global.xmppClient.request(serverKey, new ltxElement("mission_unload"));

    var elementMissionLoad = new ltxElement("mission_load", { bootstrap_mode: "0", bootstrap_name: "trunk", session_id: roomObject.session.id, verbosity_level: "1" });
    elementMissionLoad.children.push(exports.getDedicatedLtx(roomObject, true));
    elementMissionLoad.children.push(global.resources.ltxAnticheatConfiguration);

    var elementVariables = elementMissionLoad.c("online_variables").c("variables");
    for (varKey in global.config.variables_server) {
        elementVariables.c("item", { key: varKey, value: global.config.variables_server[varKey] });
    }

    if (roomObject.room_type == 2 || roomObject.room_type == 4 || roomObject.room_type == 8 || roomObject.room_type == 32) {
        elementVariables.c("item", { key: "cvar:pl_lerp_depth", value: "0.066" });
        elementVariables.c("item", { key: "cvar:sv_boost_rates", value: "optimized" });
        elementVariables.c("item", { key: "cvar:cl_boost_rates", value: "optimized" });
    } else {
        elementVariables.c("item", { key: "cvar:pl_lerp_depth", value: "0.1" });
        elementVariables.c("item", { key: "cvar:sv_boost_rates", value: "optimized" });
        elementVariables.c("item", { key: "cvar:cl_boost_rates", value: "optimized" });
    }

    global.xmppClient.request(serverKey, elementMissionLoad);

    return true;
}

exports.endSession = function (roomObject) {
    roomObject.dedicatedServerJid = null;
    roomObject.session.id = "";
    roomObject.session.status = 0;
    roomObject.session.game_progress = 0;
    roomObject.session.start_time = 0;
    roomObject.session.end_time = Math.round(new Date().getTime() / 1000);
    roomObject.session.revision++;

    roomObject.core.room_left_players = [];
    roomObject.core.revision++;
}