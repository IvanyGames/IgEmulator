var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][GetProfilePerformance]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    var missionsObject = global.CacheQuickAccess.missionsPvE.uid;

    if (missionsObject != null) {
        var my_id_string = String(profileObject._id);
        var response = new ltxElement("get_profile_performance", { missions_hash: global.CacheQuickAccess.missionsPvE.hash });

        var elementPveMissionsPerformance = response.c("pve_missions_performance");
        response.c("pvp_modes_to_complete");

        for (var keyMission in missionsObject) {

            var mission_id = keyMission;
            var v_success = 2;
            if (profileObject.profile_performance[mission_id] != null) {
                v_success = profileObject.profile_performance[mission_id].success;
            }

            var performance = new ltxElement('performance', { mission_id: mission_id, success: v_success });
            response.children.push(performance);
            elementPveMissionsPerformance.children.push(performance);

            for (var cur_stat = 0; cur_stat < 6; cur_stat++) {
                var key1 = String(cur_stat);
                var cur_perfm = 0;
                if (profileObject.profile_performance[mission_id] != null) {
                    cur_perfm = profileObject.profile_performance[mission_id].leaderboard[key1];
                }

                var performance_c = performance.c('leaderboard', { stat: key1, profile_performance: cur_perfm ? cur_perfm : 1, max_performance: 0, position: 0, league: 4 });
                if (global.CacheQuickAccess.performance[mission_id] != null) {
                    performance_c.attrs.max_performance = global.CacheQuickAccess.performance[mission_id][key1][0].stats[key1];
                    var cur_top_players = global.CacheQuickAccess.performance[mission_id][key1][0].players;
                    for (var cur_player in cur_top_players) {
                        performance_c.c("player", { experience: cur_top_players[cur_player].experience, class: cur_top_players[cur_player].current_class, nickname: cur_top_players[cur_player].nick, clan: cur_top_players[cur_player].clan });
                    }
                    var my_position = 0;
                    var cur_pos = 1;
                    var cur_teams = global.CacheQuickAccess.performance[mission_id][key1];
                    outer: for (var cur_team in cur_teams) {
                        ////console.log(cur_teams[cur_team].players);	
                        for (var cur_player_in_team in cur_teams[cur_team].players) {
                            if (cur_player_in_team == my_id_string) {
                                ////console.log("Finded");
                                my_position = cur_pos;
                                break outer;
                                break;
                            }
                        }
                        cur_pos++;
                    }
                    ////console.log("CurPos:"+my_position);
                    performance_c.attrs.position = my_position;
                    performance_c.attrs.league = my_position;
                    if (performance_c.attrs.league > 4) {
                        performance_c.attrs.league = 4;
                    }
                }
            }
        }

        global.xmppClient.response(stanza, response);

    } else {
        //console.log("[GetProfilePerformance]:Get Failed from "+stanza.attrs.from);	
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '2' });
    }

}