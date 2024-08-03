var ltx = require('ltx')
var zlib = require('zlib');

var get_account_profiles = require('./modules/get_account_profiles')
var items = require('./modules/items')
var create_profile = require('./modules/create_profile')
var join_channel = require('./modules/join_channel')
var persistent_settings_get = require('./modules/persistent_settings_get')
var shop_get_offers = require('./modules/shop_get_offers')
var get_configs = require('./modules/get_configs')
var get_storage_items = require('./modules/get_storage_items')
var player_status = require('./modules/player_status')
var get_profile_performance = require('./modules/get_profile_performance')
var get_achievements = require('./modules/get_achievements')
var get_player_stats = require('./modules/get_player_stats')
var missions_get_list = require('./modules/missions_get_list')
var get_contracts = require('./modules/get_contracts')
var setcurrentclass = require('./modules/setcurrentclass')
var setcharacter = require('./modules/setcharacter')
var persistent_settings_set = require('./modules/persistent_settings_set')
var shop_buy_offer = require('./modules/shop_buy_offer')
var get_expired_items = require('./modules/get_expired_items')
var delete_item = require('./modules/delete_item')
var gameroom_open = require('./modules/gameroom_open')
var gameroom_setplayer = require('./modules/gameroom_setplayer')
var gameroom_leave = require('./modules/gameroom_leave')
var gameroom_switchteams = require('./modules/gameroom_switchteams')
var gameroom_setname = require('./modules/gameroom_setname')
var gameroom_get = require('./modules/gameroom_get')
var gameroom_join = require('./modules/gameroom_join')
var gameroom_promote_to_host = require('./modules/gameroom_promote_to_host')
var gameroom_kick = require('./modules/gameroom_kick')
var gameroom_update = require('./modules/gameroom_update')
var gameroom_setprivatestatus = require('./modules/gameroom_setprivatestatus')
var voting_start = require('./modules/voting_start')
var voting_vote = require('./modules/voting_vote')
var quickplay_maplist = require('./modules/quickplay_maplist')
var gameroom_askserver = require('./modules/gameroom_askserver')
var session_join = require('./modules/session_join')
var setserver = require('./modules/setserver')
var getprofile = require('./modules/getprofile')
var update_achievements = require('./modules/update_achievements')
var send_invitation = require('./modules/send_invitation')
var confirm_notification = require('./modules/confirm_notification')
var remove_friend = require('./modules/remove_friend')
var clan_create = require('./modules/clan_create')
var set_clan_info = require('./modules/set_clan_info')
var clan_set_member_role = require('./modules/clan_set_member_role')
var clan_leave = require('./modules/clan_leave')
var clan_list = require('./modules/clan_list')
var clan_kick = require('./modules/clan_kick')
var broadcast_sync = require('./modules/broadcast_sync')
var lobbychat_getchannelid = require('./modules/lobbychat_getchannelid')
var invitation_send = require('./modules/invitation_send')
var invitation_accept = require('./modules/invitation_accept')
var gameroom_quickplay = require('./modules/gameroom_quickplay')
var gameroom_quickplay_cancel = require('./modules/gameroom_quickplay_cancel')
var gameroom_offer_response = require('./modules/gameroom_offer_response')
var get_last_seen_date = require('./modules/get_last_seen_date')
var set_banner = require('./modules/set_banner')
var profile_info_get_status = require('./modules/profile_info_get_status')
var admin_cmd = require('./modules/admin_cmd')
var set_rewards_info = require('./modules/set_rewards_info')
var channel_logout = require('./modules/channel_logout')
var user_logout = require('./modules/user_logout')
var telemetry_stream = require('./modules/telemetry_stream')
var generic_telemetry = require('./modules/generic_telemetry')
var resync_profile = require('./modules/resync_profile')
var tutorial_status = require('./modules/tutorial_status')
var tutorial_result = require('./modules/tutorial_result')
var mission_load = require('./modules/mission_load')
var consume_item = require('./modules/consume_item')
var notify_expired_items = require('./modules/notify_expired_items')
var extend_item = require('./modules/extend_item')
var repair_item = require('./modules/repair_item')
var repair_multiple_items = require('./modules/repair_multiple_items')
var ui_user_choice = require('./modules/ui_user_choice')

var class_presence = require('./modules/class_presence');
var send_anticheat_report = require('./modules/send_anticheat_report');
var punish_mode = require('./modules/punish_mode');
var online_variables_get = require('./modules/online_variables_get');
var invitation_can_follow = require('./modules/invitation_can_follow');
var add_friend = require('./modules/add_friend');
var add_friend_response = require('./modules/add_friend_response');
var clan_invite = require('./modules/clan_invite');
var clan_invite_response = require('./modules/clan_invite_response');
var gameroom_setcustomparams = require('./modules/gameroom_setcustomparams');

exports.module = function (stanza) {
	//console.log("[Masterserver]:Stanza\n" + stanza + "\n");
	switch (stanza.attrs.type) {
		case 'get':
			switch (stanza.name) {
				case "iq":
					switch (stanza.attrs.xmlns) {
						case "jabber:client":
							if (stanza.children[0] != null) {
								switch (stanza.children[0].name) {
									case "query":
										switch (stanza.children[0].attrs.xmlns) {
											case "urn:cryonline:k01":
												if (stanza.children[0].children[0] != null) {
													queryDecompress(stanza);
													console.time(stanza.children[0].children[0].name);
													//console.time("[QueryProfiler]["+stanza.children[0].children[0].name+"]["+stanza.attrs.id+"]");
													//console.log(stanza.children[0].children[0].name);
													switch (stanza.children[0].children[0].name) {
														case "get_account_profiles"://1ms
															get_account_profiles.module(stanza);
															break;
														case "items"://0.2ms
															items.module(stanza);
															break;
														case "create_profile"://TODO
															create_profile.module(stanza);
															break;
														case "join_channel"://TODO
															join_channel.module(stanza);
															break;
														case "switch_channel":
															join_channel.module(stanza);
															break;
														case "persistent_settings_get"://0.3ms
															persistent_settings_get.module(stanza);
															break;
														case "shop_get_offers"://0.2ms ?
															shop_get_offers.module(stanza);
															break;
														case "get_configs"://TODO
															get_configs.module(stanza);
															break;
														case "get_storage_items"://TODO
															get_storage_items.module(stanza);
															break;
														case "player_status"://0.3ms
															player_status.module(stanza);
															break;
														case "get_profile_performance"://1ms
															get_profile_performance.module(stanza);
															break;
														case "get_achievements"://0.2ms
															get_achievements.module(stanza);
															break;
														case "get_player_stats"://0.2ms
															get_player_stats.module(stanza);
															break;
														case "missions_get_list"://0.2ms
															missions_get_list.module(stanza);
															break;
														case "get_contracts"://0.2ms
															get_contracts.module(stanza);
															break;
														case "setcurrentclass"://0.2ms 
															setcurrentclass.module(stanza);
															break;
														case "setcharacter"://0.3ms 
															setcharacter.module(stanza);
															break;
														case "persistent_settings_set"://0.2ms TODO проверка параметров на валидность
															persistent_settings_set.module(stanza);
															break;
														case "shop_buy_offer"://
															shop_buy_offer.module(stanza);
															break;
														case "shop_buy_multiple_offer"://
															shop_buy_offer.module(stanza);
															break;
														case "get_expired_items"://1ms
															get_expired_items.module(stanza);
															break;
														case "delete_item"://0.1ms
															delete_item.module(stanza);
															break;
														case "gameroom_open"://1ms
															gameroom_open.module(stanza);
															break;
														case "gameroom_setplayer"://0.2ms
															gameroom_setplayer.module(stanza);
															break;
														case "gameroom_leave"://0.2ms
															gameroom_leave.module(stanza, true, false, 0);
															break;
														case "gameroom_switchteams"://0.2ms
															gameroom_switchteams.module(stanza);
															break;
														case "gameroom_setname"://0.2ms
															gameroom_setname.module(stanza);
															break;
														case "gameroom_get"://0.2ms
															gameroom_get.module(stanza);
															break;
														case "gameroom_join"://1ms
															gameroom_join.module(stanza);
															break;
														case "gameroom_promote_to_host"://0.2ms
															gameroom_promote_to_host.module(stanza);
															break;
														case "gameroom_kick"://0.2ms
															gameroom_kick.module(stanza);
															break;
														case "gameroom_update_pvp"://1ms
															gameroom_update.module(stanza);//TODO кик если слотов мешьше чем игроков
															break;
														case "gameroom_setinfo"://1ms
															gameroom_update.module(stanza);
															break;
														case "gameroom_setprivatestatus"://0.3ms
															gameroom_setprivatestatus.module(stanza);
															break;
														case "voting_start"://TODO Мб проверку на статус убрать
															voting_start.module(stanza);
															break;
														case "voting_vote"://TODO Мб проверку на статус убрать
															voting_vote.module(stanza);
															break;
														case "quickplay_maplist"://0.2ms
															quickplay_maplist.module(stanza);
															break;
														case "setserver"://0.2ms
															setserver.module(stanza);
															break;
														case "gameroom_askserver"://0.2ms
															gameroom_askserver.module(stanza);
															break;
														case "session_join"://0.2ms
															session_join.module(stanza);
															break;
														case "getprofile"://2ms
															getprofile.module(stanza);//TODO Вычисление vip
															break;
														case "update_achievements"://2ms
															update_achievements.module(stanza);
															break;
														case "send_invitation"://5ms
															send_invitation.module(stanza);
															break;
														case "confirm_notification"://5ms
															confirm_notification.module(stanza);
															break;
														case "remove_friend"://5ms
															remove_friend.module(stanza);
															break;
														case "clan_create"://5ms
															clan_create.module(stanza);
															break;
														case "set_clan_info"://5-10ms
															set_clan_info.module(stanza);
															break;
														case "clan_set_member_role"://5-30ms
															clan_set_member_role.module(stanza);
															break;
														case "clan_leave"://5-30ms
															clan_leave.module(stanza);
															break;
														case "clan_list"://0.1ms
															clan_list.module(stanza);
															break;
														case "clan_kick"://5-30ms
															clan_kick.module(stanza);
															break;
														case "broadcast_sync"://0.2ms
															broadcast_sync.module(stanza);
															break;
														case "lobbychat_getchannelid"://0.2ms
															lobbychat_getchannelid.module(stanza);
															break;
														case "invitation_send"://2ms
															invitation_send.module(stanza);
															break;
														case "invitation_accept"://0.3ms
															invitation_accept.module(stanza);
															break;
														case "gameroom_quickplay"://TODO
															gameroom_quickplay.module(stanza);
															break;
														case "gameroom_quickplay_cancel"://TODO
															gameroom_quickplay_cancel.module(stanza);
															break;
														case "gameroom_offer_response"://TODO
															gameroom_offer_response.module(stanza);
															break;
														case "get_last_seen_date"://1ms
															get_last_seen_date.module(stanza);
															break;
														case "set_banner"://0.2ms
															set_banner.module(stanza);
															break;
														case "profile_info_get_status"://1ms
															profile_info_get_status.module(stanza);
															break;
														case "admin_cmd"://1ms
															admin_cmd.module(stanza);
															break;
														case "set_rewards_info"://TODO за время, мб сделать более плавной выдачу клановых очков
															set_rewards_info.module(stanza);
															break;
														case "channel_logout"://0.1ms
															channel_logout.module(stanza, true);
															break;
														case "user_logout"://5-10ms
															user_logout.module(stanza);
															break;
														case "telemetry_stream"://10ms TODO удалять если дедик резко покинул
															telemetry_stream.module(stanza);
															break;
														case "generic_telemetry"://0.1ms
															generic_telemetry.module(stanza);
															break;
														case "resync_profile"://3ms TODO открытые предметы
															resync_profile.module(stanza);
															break;
														case "tutorial_status"://0.1-5ms
															tutorial_status.module(stanza);
															break;
														case "tutorial_result"://0.5ms
															tutorial_result.module(stanza);
															break;
														case "consume_item"://0.2ms
															consume_item.module(stanza);
															break;
														case "notify_expired_items"://0.2ms
															notify_expired_items.module(stanza);
															break;
														case "extend_item"://0.2ms
															extend_item.module(stanza);
															break;
														case "repair_item"://0.2ms
															repair_item.module(stanza);
															break;
														case "repair_multiple_items"://0.2ms
															repair_multiple_items.module(stanza);
															break;
														case "ui_user_choice"://0.2ms
															ui_user_choice.module(stanza);
															break;
														case "class_presence"://0.2ms
															class_presence.module(stanza);
															break;
														case "send_anticheat_report"://0.2ms
															send_anticheat_report.module(stanza);
															break;
														case "punish_mode"://0.2ms
															punish_mode.module(stanza);
															break;
														case "online_variables_get"://0.2ms
															online_variables_get.module(stanza);
															break;
														case "invitation_can_follow"://0.2ms
															invitation_can_follow.module(stanza);
															break;
														case "add_friend"://0.2ms
															add_friend.module(stanza);
															break;
														case "add_friend_response"://0.2ms
															add_friend_response.module(stanza);
															break;
														case "clan_invite"://0.2ms
															clan_invite.module(stanza);
															break;
														case "clan_invite_response"://0.2ms
															clan_invite_response.module(stanza);
															break;
														case "gameroom_setcustomparams"://0.2ms
															gameroom_setcustomparams.module(stanza);
															break;
													}
													console.timeEnd(stanza.children[0].children[0].name);
												}
												break;
										}
										break;

								}
							}
							break;

					}
					break;

			}
			break;

		case 'result':
			switch (stanza.name) {
				case "iq":
					switch (stanza.attrs.xmlns) {
						case "jabber:client":
							if (stanza.children[0] != null) {
								switch (stanza.children[0].name) {
									case "query":
										switch (stanza.children[0].attrs.xmlns) {
											case "urn:cryonline:k01":
												if (stanza.children[0].children[0] != null) {
													switch (stanza.children[0].children[0].name) {
														case "mission_load"://0.2ms
															setTimeout(mission_load.module, 5000, stanza);
															break;
													}
												}
												break;
										}
										break;

								}
							}
							break;

					}
					break;

			}
			break;

	}

}

function queryDecompress(stanza) {
	//console.time("queryDecompress");
	if (stanza.children[0].children[0].name == "data" && stanza.children[0].children[0].attrs.query_name != null && stanza.children[0].children[0].attrs.compressedData != null) {
		var b64Buffer = new Buffer.from(stanza.children[0].children[0].attrs.compressedData, 'base64');
		var inflatedData = String(zlib.inflateSync(b64Buffer));
		var parsedData = ltx.parse(inflatedData);
		if (stanza.children[0].children[0].attrs.query_name == parsedData.name) {
			stanza.children[0].children[0] = parsedData;
		}
	}
	//console.timeEnd("queryDecompress");
}