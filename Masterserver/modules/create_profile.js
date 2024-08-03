var ltxElement = require('ltx').Element
var moduleJoinChannel = require('./join_channel.js')

var RegExpNameRU = new RegExp("[^-.0-9_А-ЯЁа-яё]");
var RegExpNameEN = new RegExp("[^-.0-9_A-Za-z]");

var defaultStats = [
	{ "stat": 'player_online_time', "Value": 0 },
	{ "stat": 'player_max_session_time', "Value": 0 },
	{ "stat": 'player_ammo_restored', "Value": 0 },
	{ "stat": 'player_climb_coops', "Value": 0 },
	{ "stat": 'player_repair', "Value": 0 },
	{ "stat": 'player_heal', "Value": 0 },
	{ "stat": 'player_resurrected_by_coin', "Value": 0 },
	{ "stat": 'player_climb_assists', "Value": 0 },
	{ "stat": 'player_resurrect_made', "Value": 0 },
	{ "mode": 'PVP', "stat": 'player_kills_player', "Value": 0 },
	{ "mode": 'PVP', "stat": 'player_kill_streak', "Value": 0 },
	{ "mode": 'PVP', "stat": 'player_kills_melee', "Value": 0 },
	{ "mode": 'PVP', "stat": 'player_kills_claymore', "Value": 0 },
	{ "mode": 'PVP', "stat": 'player_deaths', "Value": 0 },
	{ "mode": 'PVP', "stat": 'player_sessions_left', "Value": 0 },
	{ "class": 'Rifleman', "mode": 'PVP', "stat": 'player_shots', "Value": 0 },
	{ "class": 'Rifleman', "mode": 'PVP', "stat": 'player_hits', "Value": 0 },
	{ "class": 'Rifleman', "mode": 'PVP', "stat": 'player_headshots', "Value": 0 },
	{ "class": 'Rifleman', "mode": 'PVP', "stat": 'player_playtime', "Value": 0 },
	{ "class": 'Recon', "mode": 'PVP', "stat": 'player_shots', "Value": 0 },
	{ "class": 'Recon', "mode": 'PVP', "stat": 'player_hits', "Value": 0 },
	{ "class": 'Recon', "mode": 'PVP', "stat": 'player_headshots', "Value": 0 },
	{ "class": 'Recon', "mode": 'PVP', "stat": 'player_playtime', "Value": 0 },
	{ "class": 'Engineer', "mode": 'PVP', "stat": 'player_shots', "Value": 0 },
	{ "class": 'Engineer', "mode": 'PVP', "stat": 'player_hits', "Value": 0 },
	{ "class": 'Engineer', "mode": 'PVP', "stat": 'player_headshots', "Value": 0 },
	{ "class": 'Engineer', "mode": 'PVP', "stat": 'player_playtime', "Value": 0 },
	{ "class": 'Medic', "mode": 'PVP', "stat": 'player_shots', "Value": 0 },
	{ "class": 'Medic', "mode": 'PVP', "stat": 'player_hits', "Value": 0 },
	{ "class": 'Medic', "mode": 'PVP', "stat": 'player_headshots', "Value": 0 },
	{ "class": 'Medic', "mode": 'PVP', "stat": 'player_playtime', "Value": 0 },
	{ "difficulty": '', "mode": 'PVP', "stat": 'player_sessions_won', "Value": 0 },
	{ "difficulty": '', "mode": 'PVP', "stat": 'player_sessions_lost', "Value": 0 },
	{ "difficulty": '', "mode": 'PVP', "stat": 'player_sessions_draw', "Value": 0 },
	{ "mode": 'PVE', "stat": 'player_kills_ai', "Value": 0 },
	{ "mode": 'PVE', "stat": 'player_kill_streak', "Value": 0 },
	{ "mode": 'PVE', "stat": 'player_kills_melee', "Value": 0 },
	{ "mode": 'PVE', "stat": 'player_kills_claymore', "Value": 0 },
	{ "mode": 'PVE', "stat": 'player_deaths', "Value": 0 },
	{ "mode": 'PVE', "stat": 'player_sessions_left', "Value": 0 },
	{ "class": 'Rifleman', "mode": 'PVE', "stat": 'player_shots', "Value": 0 },
	{ "class": 'Rifleman', "mode": 'PVE', "stat": 'player_hits', "Value": 0 },
	{ "class": 'Rifleman', "mode": 'PVE', "stat": 'player_headshots', "Value": 0 },
	{ "class": 'Rifleman', "mode": 'PVE', "stat": 'player_playtime', "Value": 0 },
	{ "class": 'Recon', "mode": 'PVE', "stat": 'player_shots', "Value": 0 },
	{ "class": 'Recon', "mode": 'PVE', "stat": 'player_hits', "Value": 0 },
	{ "class": 'Recon', "mode": 'PVE', "stat": 'player_headshots', "Value": 0 },
	{ "class": 'Recon', "mode": 'PVE', "stat": 'player_playtime', "Value": 0 },
	{ "class": 'Engineer', "mode": 'PVE', "stat": 'player_shots', "Value": 0 },
	{ "class": 'Engineer', "mode": 'PVE', "stat": 'player_hits', "Value": 0 },
	{ "class": 'Engineer', "mode": 'PVE', "stat": 'player_headshots', "Value": 0 },
	{ "class": 'Engineer', "mode": 'PVE', "stat": 'player_playtime', "Value": 0 },
	{ "class": 'Medic', "mode": 'PVE', "stat": 'player_shots', "Value": 0 },
	{ "class": 'Medic', "mode": 'PVE', "stat": 'player_hits', "Value": 0 },
	{ "class": 'Medic', "mode": 'PVE', "stat": 'player_headshots', "Value": 0 },
	{ "class": 'Medic', "mode": 'PVE', "stat": 'player_playtime', "Value": 0 },
	{ "difficulty": 'easy', "mode": 'PVE', "stat": 'player_sessions_won', "Value": 0 },
	{ "difficulty": 'easy', "mode": 'PVE', "stat": 'player_sessions_lost', "Value": 0 },
	{ "difficulty": 'normal', "mode": 'PVE', "stat": 'player_sessions_won', "Value": 0 },
	{ "difficulty": 'normal', "mode": 'PVE', "stat": 'player_sessions_lost', "Value": 0 },
	{ "difficulty": 'hard', "mode": 'PVE', "stat": 'player_sessions_won', "Value": 0 },
	{ "difficulty": 'hard', "mode": 'PVE', "stat": 'player_sessions_lost', "Value": 0 },
	{ "class": 'Rifleman', "item_type": '', "stat": 'player_wpn_usage', "Value": 0 },
	{ "class": 'Recon', "item_type": '', "stat": 'player_wpn_usage', "Value": 0 },
	{ "class": 'Engineer', "item_type": '', "stat": 'player_wpn_usage', "Value": 0 },
	{ "class": 'Medic', "item_type": '', "stat": 'player_wpn_usage', "Value": 0 }
];


exports.module = function (stanza) {

	var version = stanza.children[0].children[0].attrs.version;
	var user_id = stanza.children[0].children[0].attrs.user_id;
	var token = stanza.children[0].children[0].attrs.token;
	var nickname = stanza.children[0].children[0].attrs.nickname;
	var head = stanza.children[0].children[0].attrs.head;

	var hw_id = Number(stanza.children[0].children[0].attrs.hw_id);
	var build_type = stanza.children[0].children[0].attrs.build_type;

	var username = stanza.attrs.from.split("@")[0];

	if (Number.isNaN(hw_id) || !Number.isSafeInteger(hw_id) || hw_id < 0 || hw_id > 2147483647) {
		//console.log("["+stanza.attrs.from+"][CreateProfile]:Uncorrect Hwid");
		//global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "13" });
		//return;
		hw_id = 0;
	}

	//Проверка версии игры
	if (version && global.startupParams.ver && version != global.startupParams.ver) {
		//console.log("["+stanza.attrs.from+"][CreateProfile]:Version mismatch");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "4" });
		return;
	}

	//Проверка совпадения аттрибута user_id с реальным username
	if (user_id != username && user_id != "0") {
		//console.log("["+stanza.attrs.from+"][CreateProfile]:UserId mismatch");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "8" });
		return;
	}

	/*
	//Проверка токена
	if(token != connection.active_token){
		//console.log("["+stanza.attrs.from+"][CreateProfile]:Active token mismatch");
		global.xmppClient.responseError(stanza, {type:'continue', code:"8", custom_code:"10"});
		return;
	}	
	*/

	//Проверка длины и символов ника
	if (!nickname || nickname.length < 4 || nickname.length > 16 || (RegExpNameRU.test(nickname) && RegExpNameEN.test(nickname))) {
		//console.log("["+stanza.attrs.from+"][CreateProfile]:Incorrect nickname");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "11" });
		return;
	}

	//Проверка на мат
	//TODO

	/*
	//Проверка наличия головы в списке предметов
	if (global.resources.items.data[global.resources.items.data.findIndex(function (x) { return x.name == head; })]) {
		//console.log("["+stanza.attrs.from+"][CreateProfile]:Incorrect head");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "9" });
		return;
	}
	*/

	сreateProfile({
		"username": username,
		"gender": "male",
		"height": 1,
		"fatness": 0,
		"game_money": 10000000,
		"cry_money": 10000000,
		"crown_money": 10000000,
		"experience": 0,
		"current_class": 0,
		"banner_badge": 4294967295,
		"banner_mark": 4294967295,
		"banner_stripe": 4294967295,
		"status": 9,
		"location": "",
		"nick": nickname,
		"clan_name": "",
		"head": head,

		"items": global.resources.defaultItems,
		"expired_items": [],

		"missions_unlocked": [
			"easy",
			"normal",
			"hard",
			"trainingmission",
			"easymission",
			"normalmission",
			"hardmission",
			"survivalmission",
			"campaignsection1",
			"campaignsection2",
			"campaignsection3",
			"campaignsections",
			"zombieeasy",
			"zombienormal",
			"zombiehard",
			"volcanoeasy",
			"volcanonormal",
			"volcanohard",
			"volcanosurvival",
			"anubiseasy",
			"anubisnormal",
			"anubishard",
			"zombietowereasy",
			"zombietowernormal",
			"zombietowerhard",
			"icebreakereasy",
			"icebreakernormal",
			"icebreakerhard"
		],

		"tutorial_passed": false,
		"tutorials_passed": [],

		"classes_unlocked": [0, 2, 3, 4],

		"persistent_settings": {},

		"achievements": [],
		"is_starting_achievements_issued": false,

		"stats": defaultStats,

		"contracts": {
			"rotation_id": 0,
			"contract_name": "",
			"current": 0,
			"total": 0,
			"rotation_time": 0,
			"status": 0,
			"is_available": 0
		},

		"last_seen_date": 0,

		"profile_performance": {},

		"wpn_usage": {},

		"login_bonus": {
			"prvday": Math.floor((new Date().getTime() + 10800000) / 86400000),
			"reward": -1
		},

		"win_limits": {},

		"pvp_rating_points": 0,

		"clan_points": 0,
		"clan_role": 0,
		"invite_date": 0,

		"notifications": [],
		"last_notification_id": 1,

		"friends": [],

		"authorization_events": [],

		"remote_give": {
			"items": [],
			"achievements": []
		}

	}, global.db.warface.profiles, (errCreate, resultCreate) => {

		if (errCreate) {

			var errKey = null;

			if (errCreate.errmsg) {
				errKey = errCreate.errmsg.split("index: ")[1].split(" dup")[0];
			}

			if (errKey == "warface.profiles.$_username_" || errKey == "_username_") {
				//console.log("["+stanza.attrs.from+"][CreateProfile]:The profile has already been created");
				moduleJoinChannel.module(stanza);
			} else if (errKey == "warface.profiles.$_nick_" || errKey == "_nick_") {
				//console.log("["+stanza.attrs.from+"][CreateProfile]:Couldn't create, nickname is busy");
				global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '1' });
			} else {
				//console.log("["+stanza.attrs.from+"][CreateProfile]:Failed to create, unknown error");	
				global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '12' });
			}

			return;
		}

		//console.log("["+stanza.attrs.from+"][CreateProfile]:Created successfully");
		moduleJoinChannel.module(stanza);

	});

}

function сreateProfile(doc, datbase_cur, callback) {
	datbase_cur.find({}).sort({ _id: -1 }).limit(1).toArray(function (err_a, results) {

		if (results != null) {
			var new_id = 1;

			if (results[0] != null) {
				new_id = results[0]._id + 1;
			}

			doc._id = new_id;

			datbase_cur.insertOne(doc, function (err, res) {

				var errKey = null;
				if (err != null && err.errmsg != null) {
					errKey = err.errmsg.split("index: ")[1].split(" dup")[0];
				}

				if (errKey == null || (errKey != "warface.profiles.$_id_" && errKey != "_id_")) {
					callback(err, res);
				} else {
					setTimeout(сreateProfile, (Math.floor(Math.random() * (10000 - 1000)) + 1000), doc, datbase_cur, callback);
				}

			});
		} else {
			callback(err_a, null);
		}

	})
}

/*

create_profile
0-Failed to connect to pvp_pro_52 (pvp_pro), trying to switch to another MS.
1-Имя '****' уже занято
2-Недопустимое имя бойца
3-Это имя уже зарезервировано другим игроком
4-Несовпадение версий игры
5-Skip
6-Skip
7-Имя 'Ивани' уже занято

<iq to="masterserver@russia.warface/pve_001" id="uid0000009d" type="get" from="1@russia.warface/GameClient" xmlns="jabber:client">
<query xmlns="urn:cryonline:k01">
<create_profile user_id="1" version="1.22400.5519.45100" token="$WF_1_1623078838049_816f510576e62315c09d9b61424fc616" nickname="4324432432" region_id="global" head="default_head_13" hw_id="670721246" cpu_vendor="1" cpu_family="6" cpu_model="10" cpu_stepping="7" cpu_speed="3391" cpu_num_cores="4" gpu_vendor_id="4318" gpu_device_id="5121" physical_memory="12271" os_ver="6" os_64="1" language="Russian" build_type="--profile"/>
</query>
</iq>

*/