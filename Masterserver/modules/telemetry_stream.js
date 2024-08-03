var ltx = require('ltx')
var fs = require('fs')
var scriptTools = require('../scripts/tools.js')

var telemetryClassesArr = ["Rifleman", "Heavy", "Recon", "Medic", "Engineer"];

exports.module = function (stanza) {

	var username = stanza.attrs.from.split("@")[0];

	if (username != "dedicated") {
		return;
	}

	var telem_recvd = ltx.parse(String(stanza).split("&lt;").join("<").split("&gt;").join(">").split(">\n").join(">").split(">    <").join("><").split(">   <").join("><").split(">  <").join("><").split("> <").join("><").split("><").join("><"));//Замена знаков

	var cur_telemetry = telem_recvd.children[0].children[0];//Указатель на текущий telemetry_stream

	if (global.sessions_data[cur_telemetry.attrs.session_id] == null) {
		global.sessions_data[cur_telemetry.attrs.session_id] = new ltx.Element("telemetry_stream");
		global.sessions_data[cur_telemetry.attrs.session_id].c("rounds");
		global.sessions_data[cur_telemetry.attrs.session_id].c("teams");
		global.sessions_data[cur_telemetry.attrs.session_id].c("players");
	}

	var cur_session_data = global.sessions_data[cur_telemetry.attrs.session_id];

	////console.log(cur_session_data);
	////console.log(cur_telemetry);
	var telem_ch = cur_telemetry.children;
	for (var cur_tf_key = 0; cur_tf_key < telem_ch.length; cur_tf_key++) {
		var cur_tf = telem_ch[cur_tf_key];
		if (cur_tf.attrs != null) {
			var cur_key = telem_ch[cur_tf_key + 1].split("{1}[")[1].split("]")[0].split(",");
			var key_1 = Number(cur_key[0]);
			var key_2 = Number(cur_key[1]);
			var key_3 = Number(cur_key[2]);
			var key_4 = Number(cur_key[3]);
			var key_5 = Number(cur_key[4]);
			var type_key = key_1 + key_2 + key_3;
			var cur_session_data_element = null;
			switch (type_key) {
				case -1://Main
					cur_session_data_element = cur_session_data;
					break;
				case 0://Rounds
					cur_session_data_element = cur_session_data.getChild("rounds");
					break;
				case 5://Players
					cur_session_data_element = cur_session_data.getChild("players");
					break;
				case 2://Players
					cur_session_data_element = cur_session_data.getChild("teams");
					break;
			}
			if (cur_session_data_element != null) {
				////console.log(cur_tf.name+" "+Number(key_1+key_2+key_3)+" "+key_5);
				var cur_element_in_session_data_element = null
				for (cur_key_00 in cur_session_data_element.children) {
					var cur_session_data_element_child_element = cur_session_data_element.children[cur_key_00];
					if (cur_session_data_element_child_element.attrs.itr_id == key_5) {
						cur_element_in_session_data_element = cur_session_data_element_child_element;
					}
				}

				if (cur_element_in_session_data_element == null) {
					////console.log("NF");
					cur_tf.attrs.itr_id = key_5;
					cur_session_data_element.children.push(cur_tf);
				} else {
					////console.log("FF");
					//Складывание атрибутов
					for (cur_elm_attr in cur_tf.attrs) {
						cur_element_in_session_data_element.attrs[cur_elm_attr] = cur_tf.attrs[cur_elm_attr];
					}
					//Сложение тамлайнов
					var tf_timelines = cur_tf.getChild("timelines").getChildren("timeline");
					var session_cur_data_timelines = cur_element_in_session_data_element.getChild("timelines");
					for (key_timeline in tf_timelines) {
						var tf_timeline = tf_timelines[key_timeline];
						////console.log(tf_timeline.attrs.name);
						var cur_timeline_vals = null;
						for (cur_timelinevals_sess in session_cur_data_timelines.children) {
							if (session_cur_data_timelines.children[cur_timelinevals_sess].attrs != null && session_cur_data_timelines.children[cur_timelinevals_sess].attrs.name == tf_timeline.attrs.name) {
								cur_timeline_vals = session_cur_data_timelines.children[cur_timelinevals_sess];
							}
						}
						if (cur_timeline_vals == null) {
							////console.log("TMLN NF");
							session_cur_data_timelines.children.push(tf_timeline);
						} else {
							////console.log("TMLN FF");
							var mass_vals_cur = tf_timeline.getChildren("val");
							for (cur_ttvt_valls in mass_vals_cur) {
								cur_timeline_vals.children.push(mass_vals_cur[cur_ttvt_valls]);
							}
						}


					}

				}
				////console.log("key1:"+key_1+" key2:"+key_2+" key3:"+key_3+" key4:"+key_4+" key5:"+key_5);


			} else {
				//console.log("Undefined type_key:"+type_key);
			}
		}
	}

	if (cur_telemetry.attrs.finalize == "1") {
		calculate_session_stats(cur_session_data, cur_telemetry.attrs.session_id);
	}
	////console.timeEnd("parse");
	global.xmppClient.response(stanza, new ltx.Element("telemetry_stream"));
}
//Доп функции
function get_wpn_usage(users_data, user_id) {
	var result = null;
	for (cur_user in users_data) {
		if (users_data[cur_user]._id == user_id) {
			result = users_data[cur_user].wpn_usage;
			break;
		}
	}
	return result;
}
function set_stat_Value_by_attrs(users_data, user_id, attrs, inc_value) {
	first: for (cur_user in users_data) {
		if (users_data[cur_user]._id == user_id) {
			two: for (cur_stat in users_data[cur_user].stats) {
				var attrs_check_result = true;
				thre: for (cur_attr in attrs) {
					if (users_data[cur_user].stats[cur_stat][cur_attr] == null || users_data[cur_user].stats[cur_stat][cur_attr] != attrs[cur_attr]) {
						attrs_check_result = false;
						break thre;
					}
				}

				if (attrs_check_result == true) {
					users_data[cur_user].stats[cur_stat].Value = inc_value;
				}
			}
		}
	}
}
function set_stat_Value_and_item_type_by_attrs(users_data, user_id, attrs, inc_value, item_type) {
	first: for (cur_user in users_data) {
		if (users_data[cur_user]._id == user_id) {
			two: for (cur_stat in users_data[cur_user].stats) {
				var attrs_check_result = true;
				thre: for (cur_attr in attrs) {
					if (users_data[cur_user].stats[cur_stat][cur_attr] == null || users_data[cur_user].stats[cur_stat][cur_attr] != attrs[cur_attr]) {
						attrs_check_result = false;
						break thre;
					}
				}

				if (attrs_check_result == true) {
					users_data[cur_user].stats[cur_stat].Value = inc_value;
					users_data[cur_user].stats[cur_stat].item_type = item_type;
				}
			}
		}
	}
}
function inc_wpn_usage(users_data, user_id, wpn_name, inc_value, player_class) {
	for (cur_user in users_data) {
		if (users_data[cur_user]._id == user_id) {
			if (users_data[cur_user].wpn_usage[player_class] != null) {
				if (users_data[cur_user].wpn_usage[player_class][wpn_name] != null) {
					users_data[cur_user].wpn_usage[player_class][wpn_name] = users_data[cur_user].wpn_usage[player_class][wpn_name] + inc_value;
				} else {
					users_data[cur_user].wpn_usage[player_class][wpn_name] = inc_value;
				}
			} else {
				users_data[cur_user].wpn_usage[player_class] = {};
				users_data[cur_user].wpn_usage[player_class][wpn_name] = inc_value;
			}
			break;
		}
	}
}
function inc_stat_Value_by_attrs(users_data, user_id, attrs, inc_value) {
	first: for (cur_user in users_data) {
		if (users_data[cur_user]._id == user_id) {
			two: for (cur_stat in users_data[cur_user].stats) {
				var attrs_check_result = true;
				thre: for (cur_attr in attrs) {
					if (users_data[cur_user].stats[cur_stat][cur_attr] == null || users_data[cur_user].stats[cur_stat][cur_attr] != attrs[cur_attr]) {
						attrs_check_result = false;
						break thre;
					}
				}

				if (attrs_check_result == true) {
					users_data[cur_user].stats[cur_stat].Value = users_data[cur_user].stats[cur_stat].Value + inc_value;
				}
			}
		}
	}
}
function get_stat_Value_by_attrs(users_data, user_id, attrs) {
	var result = null;
	first: for (cur_user in users_data) {
		if (users_data[cur_user]._id == user_id) {
			two: for (cur_stat in users_data[cur_user].stats) {
				var attrs_check_result = true;
				thre: for (cur_attr in attrs) {
					if (users_data[cur_user].stats[cur_stat][cur_attr] == null || users_data[cur_user].stats[cur_stat][cur_attr] != attrs[cur_attr]) {
						attrs_check_result = false;
						break thre;
					}
				}

				if (attrs_check_result == true) {
					result = users_data[cur_user].stats[cur_stat].Value;
				}
			}
		}
	}
	return result;
}
function get_timeline_by_name(timelines, name) {
	var result = null;
	for (cur_tm in timelines.children) {
		if (timelines.children[cur_tm].attrs != null && timelines.children[cur_tm].attrs.name == name) {
			result = timelines.children[cur_tm];
		}
	}
	return result;
}
function calculate_session_stats(telemetry, session_id) {
	var players = telemetry.getChild("players");
	var stats_session = telemetry.getChild("stats_session");
	var profiles_ids_arr = [];
	for (cur_profile in players.children) {
		var cur_id = Number(players.children[cur_profile].attrs.profile_id);
		var is_avaible = false;
		for (p_id in profiles_ids_arr) {
			if (profiles_ids_arr[p_id] == cur_id) {
				is_avaible = true;
			}
		}
		if (is_avaible == false) {
			profiles_ids_arr.push(cur_id);
		}
	}

	var profiles_lst = [];

	for (var i = 0; i < profiles_ids_arr.length; i++) {
		var profileObject = global.users._id[profiles_ids_arr[i]];
		if (profileObject) {
			profiles_lst.push(profileObject);
		}
	}

	var disconnected_players = {};//Обьект с ид и временем дисконннекта игроков
	//Заполенение disconnected_players
	var stats_session_timelines = stats_session.getChild("timelines");
	var stats_session_timeline_disconnect = get_timeline_by_name(stats_session_timelines, "disconnect");
	if (stats_session_timeline_disconnect != null) {
		for (cur_val in stats_session_timeline_disconnect.children) {
			if (stats_session_timeline_disconnect.children[cur_val].name == "val") {
				var cur_params = stats_session_timeline_disconnect.children[cur_val].getChild("param").attrs;

				if (cur_params.cause != "session_ended" && cur_params.cause != "11") {
					disconnected_players[cur_params.profile_id] = Number(stats_session_timeline_disconnect.children[cur_val].attrs.time);
					if (cur_params.cause == "kicked") {
						inc_stat_Value_by_attrs(profiles_lst, Number(cur_params.profile_id), { mode: stats_session.attrs.gamemode, stat: 'player_sessions_kicked' }, 1);
					} else if (cur_params.cause == "left") {
						inc_stat_Value_by_attrs(profiles_lst, Number(cur_params.profile_id), { mode: stats_session.attrs.gamemode, stat: 'player_sessions_left' }, 1);
					} else {
						inc_stat_Value_by_attrs(profiles_lst, Number(cur_params.profile_id), { mode: stats_session.attrs.gamemode, stat: 'player_sessions_lost_connection' }, 1);
					}
				}


			}
		}
	}
	var win_lose_draw_data = {};
	for (cur_profile in players.children) {
		var cur_player = players.children[cur_profile];

		if(cur_player.name != "player"){
			continue;
		}

		//Пропуск если текущие данные были до последнего disconnect игрока
		if (disconnected_players[cur_player.attrs.profile_id] != null && disconnected_players[cur_player.attrs.profile_id] > Number(cur_player.attrs.lifetime_begin)) {
			continue;
		}
		//Определение выиграл игрок или проиграл или ничья
		if (stats_session.attrs.winner == "0" || stats_session.attrs.winner == "-1") {
			win_lose_draw_data[cur_player.attrs.profile_id] = 0;
		} else {
			if (cur_player.attrs.team == stats_session.attrs.winner) {
				win_lose_draw_data[cur_player.attrs.profile_id] = 1;
			} else {
				win_lose_draw_data[cur_player.attrs.profile_id] = 2;
			}
		}
		var timelines = cur_player.getChild("timelines");//Таймлайны игрока

		//Подсчёт убийств
		var timeline_kill = get_timeline_by_name(timelines, "kill");
		if (timeline_kill != null) {
			var max_streak = get_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { mode: stats_session.attrs.gamemode, stat: 'player_kill_streak' });
			var friendly_kills = 0;
			var ai_kills = 0;
			var player_kills = 0;
			var clymore_kills = 0;
			var melee_kills = 0;
			var cur_streak = 0;
			for (cur_val in timeline_kill.children) {
				if (timeline_kill.children[cur_val].name == "val") {
					var cur_params = timeline_kill.children[cur_val].getChild("param").attrs;
					if (cur_params.friendly_fire != "1") {
						if (cur_params.is_player == "1") {
							player_kills++;
						} else {
							ai_kills++;
						}

						if (cur_params.hit_type == "claymore") {
							clymore_kills++;
						} else if (cur_params.hit_type == "melee" || cur_params.hit_type == "melee_secondary") {
							melee_kills++;
						}
						cur_streak++;
					} else {
						friendly_kills++;
					}

				}
			}
			if (cur_streak > max_streak) {
				max_streak = cur_streak;
			}
			inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { mode: stats_session.attrs.gamemode, stat: 'player_kills_player_friendly' }, friendly_kills);
			inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { mode: stats_session.attrs.gamemode, stat: 'player_kills_ai' }, ai_kills);
			inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { mode: stats_session.attrs.gamemode, stat: 'player_kills_player' }, player_kills);
			inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { mode: stats_session.attrs.gamemode, stat: 'player_kills_melee' }, melee_kills);
			inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { mode: stats_session.attrs.gamemode, stat: 'player_kills_claymore' }, clymore_kills);
			set_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { mode: stats_session.attrs.gamemode, stat: 'player_kill_streak' }, max_streak);
		}
		//Подсчёт смертей
		var timeline_death = get_timeline_by_name(timelines, "death");
		if (timeline_death != null) {
			var deaths_count = 0;
			for (cur_val in timeline_death.children) {
				if (timeline_death.children[cur_val].name == "val") {
					deaths_count++;
				}
			}
			inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { mode: stats_session.attrs.gamemode, stat: 'player_deaths' }, deaths_count);
		}
		//Подсчёт выстрелов
		var timeline_shoot = get_timeline_by_name(timelines, "shot");
		if (timeline_shoot != null) {
			var shoots_count = 0;
			for (cur_val in timeline_shoot.children) {
				if (timeline_shoot.children[cur_val].name == "val") {
					shoots_count++;
				}
			}
			inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { class: cur_player.attrs.character_class, mode: stats_session.attrs.gamemode, stat: 'player_shots' }, shoots_count);
		}
		//Подсчёт попаданий
		var timeline_hit = get_timeline_by_name(timelines, "hit");
		if (timeline_hit != null) {
			var cur_max_damage = get_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { stat: 'player_max_damage' });
			var hits_count = 0;
			var all_damage = 0;
			var headshots = 0;
			for (cur_val in timeline_hit.children) {
				if (timeline_hit.children[cur_val].name == "val") {
					var cur_params = timeline_hit.children[cur_val].getChild("param").attrs;
					//Восстановление хп игроку
					if (cur_params.hit_type == "healing") {
						inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { stat: 'player_heal' }, Number(cur_params.damage));
					} else if (cur_params.hit_type == "repair") {
						inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { stat: 'player_repair' }, Number(cur_params.damage));
					} else {
						if (Number(cur_params.damage) > cur_max_damage) {
							cur_max_damage = Number(cur_params.damage);
						}
						all_damage = all_damage + Number(cur_params.damage);
						//Хедшот
						if (cur_params.fatal == "1" && cur_params.material_type == "head") {
							headshots++;
						}

						hits_count++;
					}



				}
			}
			set_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { stat: 'player_max_damage' }, cur_max_damage);
			inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { class: cur_player.attrs.character_class, mode: stats_session.attrs.gamemode, stat: 'player_hits' }, hits_count);
			inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { class: cur_player.attrs.character_class, mode: stats_session.attrs.gamemode, stat: 'player_headshots' }, headshots);
			inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { stat: 'player_damage' }, all_damage);
		}
		//Подсчёт по score event
		var timeline_score = get_timeline_by_name(timelines, "score");
		if (timeline_score != null) {
			for (cur_val in timeline_score.children) {
				if (timeline_score.children[cur_val].name == "val") {
					var cur_params = timeline_score.children[cur_val].getChild("param").attrs;
					//Воскрешение игрока
					if (cur_params.event == "teammate_resurrect") {
						inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { stat: 'player_resurrect_made' }, 1);
					}
					//Пополнение запаса патрон
					if (cur_params.event == "teammate_give_ammo") {
						inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { stat: 'player_ammo_restored' }, Number(cur_params.score));
					}
					//Совместные действия
					if (cur_params.event == "sm_coop_climb") {
						inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { stat: 'player_climb_coops' }, 1);
					}
					//Помощь в совместных действиях
					if (cur_params.event == "sm_coop_assist") {
						inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { stat: 'player_climb_assists' }, 1);
					}
				}
			}
		}
		//Подсчёт воскрешений медиком,при помощи знака
		var timeline_resurrect = get_timeline_by_name(timelines, "resurrect");
		if (timeline_resurrect != null) {
			for (cur_val in timeline_resurrect.children) {
				if (timeline_resurrect.children[cur_val].name == "val") {
					var cur_params = timeline_resurrect.children[cur_val].attrs;
					if (cur_params.prm == "defibrillator") {
						inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { stat: 'player_resurrected_by_medic' }, 1);
					} else if (cur_params.prm == "coin") {
						inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { stat: 'player_resurrected_by_coin' }, 1);
					}
				}
			}
		}

		var weaponSumUsageArr = [];

		//Подсчёт времени использования оружия
		var timeline_weapon = get_timeline_by_name(timelines, "weapon");
		if (timeline_weapon != null) {
			var last_weapon = null;
			for (cur_val in timeline_weapon.children) {
				if (timeline_weapon.children[cur_val].name == "val") {
					var cur_params = timeline_weapon.children[cur_val].attrs;
					if (last_weapon != null) {
						//console.log("TestSt1 name:"+last_weapon.name+" inc:"+Math.round((Number(cur_params.time)-last_weapon.time)/1000) );

						var weaponSumUsageIndex = weaponSumUsageArr.findIndex(function (x) { return x[0] == last_weapon.name });

						if (weaponSumUsageIndex == -1) {
							weaponSumUsageArr.push([last_weapon.name, Math.round((Number(cur_params.time) - last_weapon.time) / 1000)]);
						} else {
							weaponSumUsageArr[weaponSumUsageIndex][1] += Math.round((Number(cur_params.time) - last_weapon.time) / 1000);
						}

						inc_wpn_usage(profiles_lst, Number(cur_player.attrs.profile_id), last_weapon.name, Math.round((Number(cur_params.time) - last_weapon.time) / 1000), cur_player.attrs.character_class);
					}

					last_weapon = { name: cur_params.prm, time: Number(cur_params.time) };
				}
			}
			if (last_weapon != null) {
				//console.log("TestSt1 name:"+last_weapon.name+" inc:"+Math.round((Number(cur_params.time)-last_weapon.time)/1000) );

				var weaponSumUsageIndex = weaponSumUsageArr.findIndex(function (x) { return x[0] == last_weapon.name });

				if (weaponSumUsageIndex == -1) {
					weaponSumUsageArr.push([last_weapon.name, Math.round((Number(cur_params.time) - last_weapon.time) / 1000)]);
				} else {
					weaponSumUsageArr[weaponSumUsageIndex][1] += Math.round((Number(cur_params.time) - last_weapon.time) / 1000);
				}

				inc_wpn_usage(profiles_lst, Number(cur_player.attrs.profile_id), last_weapon.name, Math.round((Number(cur_params.time) - last_weapon.time) / 1000), cur_player.attrs.character_class);
			}
		}

		//console.log(weaponSumUsageArr);
		/*
		if (weaponSumUsageArr.length) {

			var profileObject = global.users._id[cur_player.attrs.profile_id];

			if (profileObject) {

				for (var e = 0; e < profileObject.items.length; e++) {

					var itemObject = profileObject.items[e];

					if (!itemObject.durability_points || !itemObject.slot) {
						continue;
					}

					var itemSlotArr = scriptTools.getItemSlotArr(itemObject.slot);

					if (itemSlotArr[telemetryClassesArr[cur_player.attrs.character_class]] == 0) {
						continue;
					}

					var weaponSumUsageInfo = weaponSumUsageArr[weaponSumUsageArr.findIndex(function (x) { return x[0] == itemObject.name })];

					if (!weaponSumUsageInfo) {
						continue;
					}

					var sumTime = weaponSumUsageInfo[1];

					if (!sumTime) {
						continue;
					}

					//console.log("WeapponDurability name:" + itemObject.name + " sum:" + sumTime);

					var gameItemObject = global.resources.items.data[global.resources.items.data.findIndex(function (x) { return x.name == itemObject.name; })];

					if (!gameItemObject || !gameItemObject.repair_cost) {
						//console.log("[" + stanza.attrs.from + "][ClassPresence]:Item '" + itemObject.name + " not found in game items or not have repair_cost");
						continue;
					}

					itemObject.durability_points -= sumTime;

					if (itemObject.durability_points < 0) {
						itemObject.durability_points = 0;
					}

					var newRepairCost = Math.ceil(((gameItemObject.repair_cost) / 100) * (100 - (100 / (itemObject.total_durability_points / itemObject.durability_points))));

					if (newRepairCost > 0) {
						itemObject.repair_cost = newRepairCost;
					}

				}
			}
		}
		*/
		
		//Подсчёт времени игры за текущий клас класс
		var play_time = Math.round((Number(cur_player.attrs.lifetime_end) - Number(cur_player.attrs.lifetime_begin)) / 100);
		inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { class: cur_player.attrs.character_class, mode: stats_session.attrs.gamemode, stat: 'player_playtime' }, play_time);
		inc_stat_Value_by_attrs(profiles_lst, Number(cur_player.attrs.profile_id), { stat: 'player_online_time' }, play_time);

	}
	//Обновление статистики побед/поражений для игроков
	//console.log(stats_session.attrs.mission_type);
	for (cur_pl in win_lose_draw_data) {
		if (win_lose_draw_data[cur_pl] == 0) {
			var sObj = { mode: stats_session.attrs.gamemode, stat: 'player_sessions_draw' };
			if (stats_session.attrs.gamemode == "PVE") {
				sObj.difficulty = stats_session.attrs.difficulty;
			}
			inc_stat_Value_by_attrs(profiles_lst, Number(cur_pl), sObj, 1);
		} else if (win_lose_draw_data[cur_pl] == 1) {
			var sObj = { mode: stats_session.attrs.gamemode, stat: 'player_sessions_won' };
			if (stats_session.attrs.gamemode == "PVE") {
				sObj.difficulty = stats_session.attrs.difficulty;
			}
			inc_stat_Value_by_attrs(profiles_lst, Number(cur_pl), sObj, 1);
		} else if (win_lose_draw_data[cur_pl] == 2) {
			var sObj = { mode: stats_session.attrs.gamemode, stat: 'player_sessions_lost' };
			if (stats_session.attrs.gamemode == "PVE") {
				sObj.difficulty = stats_session.attrs.difficulty;
			}
			inc_stat_Value_by_attrs(profiles_lst, Number(cur_pl), sObj, 1);
		}
		//Посчёт максимального веремени сессии
		var cur_max_session_time = get_stat_Value_by_attrs(profiles_lst, Number(cur_pl), { stat: 'player_max_session_time' });
		if (Number(stats_session.attrs.session_time) * 10 > cur_max_session_time) {
			cur_max_session_time = Number(stats_session.attrs.session_time) * 10;
		}
		set_stat_Value_by_attrs(profiles_lst, Number(cur_pl), { stat: 'player_max_session_time' }, cur_max_session_time);
		//Подсчёт любимого оружия
		var wpn_usage_ech = get_wpn_usage(profiles_lst, Number(cur_pl));
		if (wpn_usage_ech != null) {
			for (cur_class in wpn_usage_ech) {
				var liked_weapon = { time: 0, name: "" };
				for (cur_wpn in wpn_usage_ech[cur_class]) {
					if (wpn_usage_ech[cur_class][cur_wpn] > liked_weapon.time) {
						liked_weapon.time = wpn_usage_ech[cur_class][cur_wpn];
						liked_weapon.name = cur_wpn;
					}
				}
				set_stat_Value_and_item_type_by_attrs(profiles_lst, Number(cur_pl), { class: cur_class, stat: 'player_wpn_usage' }, liked_weapon.time, liked_weapon.name);
			}
		}
	}
	////console.log(win_lose_draw_data);
	////console.log(profiles_lst[0]);

	delete global.sessions_data[session_id];
}