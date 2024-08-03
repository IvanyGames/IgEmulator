var ltxElement = require('ltx').Element
var gameroom_leave = require('./gameroom_leave.js')
var scriptGameroom = require('../scripts/gameroom.js');

exports.module = function (stanza) {

	var profileObject = global.users.jid[stanza.attrs.from];

	if (!profileObject) {
		//console.log("["+stanza.attrs.from+"][GameroomJoin]:Profile not found");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "25" });
		return;
	}

	var room_id = Number(stanza.children[0].children[0].attrs.room_id);
	var team_id = Number(stanza.children[0].children[0].attrs.team_id);
	var group_id = stanza.children[0].children[0].attrs.group_id;
	var status = Number(stanza.children[0].children[0].attrs.status);
	var join_reason = Number(stanza.children[0].children[0].attrs.join_reason);
	var wait_time_to_join = Number(stanza.children[0].children[0].attrs.wait_time_to_join);

	gameroom_leave.module(stanza, false, false, 0);

	var roomObject = global.gamerooms[global.gamerooms.findIndex(function (x) { return x.room_id == room_id })];

	if (!roomObject) {
		//console.log("[" + stanza.attrs.from + "][GameroomJoin]:Room not found");
		global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '10' });
		return;
	}

	var inviteIndex = roomObject.invited.indexOf(stanza.attrs.from);

	if (inviteIndex != -1) {
		roomObject.invited.slice(inviteIndex, inviteIndex);
	}

	if (roomObject.core.private == 1 && inviteIndex == -1) {
		//console.log("[" + stanza.attrs.from + "][GameroomJoin]:This is a closed room");
		global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '10' });
		return;
	}

	var kickedIndex = roomObject.kicked.indexOf(stanza.attrs.from);

	if (kickedIndex != -1) {
		//console.log("[" + stanza.attrs.from + "][GameroomJoin]:This player is kicked");
		global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '2' });
		return;
	}

	if (roomObject.session.status != 0 && roomObject.custom_params.join_in_the_process == 0) {
		//console.log("[" + stanza.attrs.from + "][GameroomJoin]:The game has already started, connection is not possible");
		global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '8' });
		return;
	}

	if (roomObject.core.players.length == roomObject.custom_params.max_players) {
		//console.log("[" + stanza.attrs.from + "][GameroomJoin]:The room is full, connection is not possible");
		global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '4' });
		return;
	}

	var isClassesVerificationPassed = false;
	for (var i = 0; i < roomObject.custom_params.class_restriction_arr.length; i++) {
		if (profileObject.classes_unlocked.indexOf(roomObject.custom_params.class_restriction_arr[i]) != -1) {
			isClassesVerificationPassed = true;
			break;
		}
	}

	if (!isClassesVerificationPassed) {
		//console.log("[" + stanza.attrs.from + "][GameroomJoin]:Classes verification failed");
		global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '15' });
		return;
	}

	if (roomObject.mission.mode == "pve" && profileObject.missions_unlocked.indexOf((roomObject.mission.type ? roomObject.mission.type : roomObject.mission.difficulty)) == -1) {
		//console.log("[" + stanza.attrs.from + "][GameroomJoin]:Room mission is locked");
		global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '12' });
		return;
	}

	if (roomObject.room_type == 4) {

		if (!profileObject.clan_name) {
			//console.log("[" + stanza.attrs.from + "][GameroomJoin]:In order to join the clan battle, you must be a member of the clan");
			global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '13' });
			return;
		}

		if (roomObject.clan_war.clan_1 != profileObject.clan_name && roomObject.clan_war.clan_2 != profileObject.clan_name) {

			if (roomObject.clan_war.clan_1 == "") {
				roomObject.clan_war.clan_1 = profileObject.clan_name;
				roomObject.clan_war.revision++;
			}

			if (roomObject.clan_war.clan_2 == "") {
				roomObject.clan_war.clan_2 = profileObject.clan_name;
				roomObject.clan_war.revision++;
			}

		}

		if (roomObject.clan_war.clan_1 != profileObject.clan_name && roomObject.clan_war.clan_2 != profileObject.clan_name) {
			//console.log("[" + stanza.attrs.from + "][GameroomJoin]:You cannot enter the room because your clan is not participating in this battle");
			global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '14' });
			return;
		}

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

		if ((roomObject.clan_war.clan_1 == profileObject.clan_name && countPlayersTeam1 >= (roomObject.custom_params.max_players / 2)) || (roomObject.clan_war.clan_2 == profileObject.clan_name && countPlayersTeam2 >= (roomObject.custom_params.max_players / 2))) {
			//console.log("[" + stanza.attrs.from + "][GameroomJoin]:The room is full, connection is not possible");
			global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '4' });
			return;
		}

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
		banner_badge: profileObject.banner_badge,
		banner_mark: profileObject.banner_mark,
		banner_stripe: profileObject.banner_stripe,
		team_id: setTeamId,
		group_id: group_id,
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

    var roomLeftPlayerIndex = roomObject.core.room_left_players.findIndex(function (x) { return x.profile_id == profileObject._id });

    if (roomLeftPlayerIndex != -1) {
        roomObject.core.room_left_players.splice(roomLeftPlayerIndex, 1);
    }

	roomObject.core.can_start = scriptGameroom.getCanStart(roomObject);

	roomObject.core.revision++;

	var elementGameroom = new ltxElement("gameroom_join", { code: 0 });
	elementGameroom.children.push(scriptGameroom.getClientLtx(roomObject, true));
	global.xmppClient.response(stanza, elementGameroom);

	/*
	if(roomObject.room_type == 1){
		setTimeout(global.xmppClient.request, 3000, stanza.attrs.from, new ltxElement("admin_cmd", { command: "Инфо", result: "Оригинальная логика ботов не сохранилась, но она была написана с нуля, поэтому она может отличатся" }));
	}
	*/

	/*
	if (roomObject.room_type == 32) {
		for(var i = 0; i < roomObject.core.players.length; i++){
			global.xmppClient.request(roomObject.core.players.online_id, new ltxElement("admin_cmd", { command: "Инфо", result: "" }));
		}
	}
	*/
}
/*
1-Миссиия недоступна
 2-Не удалось подключится к игре
 3-Не удалось подключится к игре
 4-Комната заполнена, подключение не возможно
 8-Игра уже началась, подключение не возможно
 9-Не соответствие версий
 10-Невозможно присоединится к закрытой комнате
 12-Вы не можете создать миссию к которой у вас нет доступа
 13-Для того, что-бы присоединится к клановой битве, вы должны состоять в клане.
 14-Вы не можете войти в комнату т.к ваш клан не учавствует в этой битве
15-Все доступные вам классы отключены в этой комнате
 18-Версия игры устарела, пожалуйста запустите обновление
21-Ничего
24-Невозможно начать рейтинговый пвп матчах, вы используете запрещённое снаряжение

*/