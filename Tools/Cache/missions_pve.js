var ltx = require("ltx");
var fs = require("fs");

var getFiles = function (dir, files_) {

    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files) {
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
};

function removeTextFromLtxElements(ltxElementC) {
    var newClildrenElementsArr = [];
    for (var i = 0; i < ltxElementC.children.length; i++) {
        if (typeof ltxElementC.children[i] == "object") {
            removeTextFromLtxElements(ltxElementC.children[i])
            newClildrenElementsArr.push(ltxElementC.children[i]);
        }
    }
    ltxElementC.children = newClildrenElementsArr;
}



exports.module = function (callback) {
    var resultData = [];

    console.log("[CacheMissionsPvE]:Loading SubMissionConfigs...");
    var generatorSublevelsConfigs = {};
    var missionsConfigsPaths = getFiles("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.version + "/levels");
    for (i = 0; i < missionsConfigsPaths.length; i++) {
        var missionConfigPath = missionsConfigsPaths[i].toLowerCase();
        if (missionConfigPath.split("/")[missionConfigPath.split("/").length - 1] == "submissionconfig.xml") {
            generatorSublevelsConfigs[missionConfigPath.split("/levels/")[1].split("/submissionconfig.xml")[0]] = ltx.parse(fs.readFileSync(missionConfigPath))
        }
    }

    var generatorMissionGraphs = {};

    var missions_graphs_paths = getFiles("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.version + "/libs/missiongraphs");
    for (i = 0; i < missions_graphs_paths.length; i++) {
        var parsedMg = ltx.parse(fs.readFileSync(missions_graphs_paths[i]));
        generatorMissionGraphs[parsedMg.attrs.name.toLowerCase()] = parsedMg;
    }
    //console.log(generatorMissionGraphs);
    //Конфиг генератора миссий
    console.log("[CacheMissionsPvE]:Loading MissionGenerationConfiguration...");
    var generatorMissionGenerationConfiguration = ltx.parse(fs.readFileSync("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.version + "/libs/config/masterserver/mission_generation_configuration.xml", "utf8"));

    console.log("[CacheMissionsPvE]:Loading SecondaryObjectivesDesc...");
    global.SecondaryObjectivesDesc = ltx.parse(fs.readFileSync("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.version + "/libs/config/secondaryobjectivesdesc.xml", "utf8"));

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function generate_one_mission(mission_data) {

        if (!mission_data.attrs.difficulty) {
            mission_data.attrs.difficulty = mission_data.name;
        }

        var return_missions = [];
        var LevelGraph_c = mission_data.getChild("LevelGraph").getChildren("Value");
        var Tod_c = mission_data.getChild("TimeOfDay");
        var SecondaryObjectives_c = mission_data.getChild("SecondaryObjectives");
        var CompletionScore_c = mission_data.getChild("CompletionScore");
        var Settings_c = mission_data.getChild("Settings");
        var CompletionScore_x = 0;
        if (CompletionScore_c != null) {
            CompletionScore_x = CompletionScore_c.getChild("value").getText();
        }
        var cur_expire = 0;
        var used_expires = [];
        while (cur_expire < Number(mission_data.attrs.expire_count)) {
            var mass_subl_params = [];
            var res_expire = getRandomInt(0, LevelGraph_c.length);
            if (used_expires[res_expire] == null) {
                used_expires[res_expire] = 1;
                //console.log("[CacheMissionsPvE]:Selected expire '"+ LevelGraph_c[res_expire].getText().toLowerCase()+"'");
                //console.log(generatorMissionGraphs);
                var cur_MissionGraph = generatorMissionGraphs[LevelGraph_c[res_expire].getText().toLowerCase()]
                if (cur_MissionGraph != null) {
                    //console.log(cur_MissionGraph);


                    var res_missions_xml = new ltx.Element("mission", { name: cur_MissionGraph.attrs.display_name.split(",")[getRandomInt(0, cur_MissionGraph.attrs.display_name.split(",").length)], time_of_day: Tod_c.getChild("Value").getText(), game_mode: "pve", game_mode_cfg: "pve_mode.cfg", uid: uuidv4(), release_mission: "1", clan_war_mission: "0", only_clan_war_mission: "0", difficulty: mission_data.attrs.difficulty, mission_type: (mission_data.name != mission_data.attrs.difficulty ? mission_data.name : null) });
                    res_missions_xml.c("Basemap", { name: cur_MissionGraph.attrs.setting });
                    res_missions_xml.children.push(cur_MissionGraph.getChild("UI"));
                    var Sublevels_c = res_missions_xml.c("Sublevels");

                    var SubMissions_c = cur_MissionGraph.getChildren("SubMission");
                    var used_sublevels = [];
                    var cur_sub_id = 0;
                    var allowed_maps = {};
                    var Setting_c = Settings_c.getChildren("Setting");
                    for (cur_setting in Setting_c) {
                        var Sublvs_vals_c = Setting_c[cur_setting].getChild("Sublevels").getChildren("Value");
                        for (cur_slvl in Sublvs_vals_c) {
                            allowed_maps[Sublvs_vals_c[cur_slvl].getText()] = 1;
                        }
                    }

                    //console.log(allowed_maps);
                    for (i = 0; i < SubMissions_c.length; i++) {
                        var cur_sub_mis_conf = [];

                        for (var key in generatorSublevelsConfigs) {
                            var cur_lba = String(key).split("/");
                            var cur_sln = cur_lba[cur_lba.length - 1];
                            //console.log(cur_sln);
                            if (allowed_maps[cur_sln] == 1) {
                                //console.log(key);
                                //console.log("Ok");
                                //console.log(SubMissions_c[i].attrs);
                                if (SubMissions_c[i].attrs.name != null) {
                                    //console.log(key.split("/")[key.split("/").length-1].toLowerCase()+"|"+SubMissions_c[i].attrs.name.toLowerCase());	
                                    if (key.split("/")[key.split("/").length - 1].toLowerCase() == SubMissions_c[i].attrs.name.toLowerCase()) {
                                        cur_sub_mis_conf.push({ name: key, conf: generatorSublevelsConfigs[key] });
                                        break;
                                    }
                                } else {
                                    //console.log("RN");
                                    //console.log(cur_MissionGraph.attrs.setting.split("/")[1].split("_")[0]);
                                    //console.log(key.split("/")[0]);
                                    if (cur_MissionGraph.attrs.setting.split("/")[1].split("_")[0] == key.split("/")[0] || key.split("/")[0] == "initiation") {
                                        //console.log("match");
                                        var cur_smc_c = generatorSublevelsConfigs[key].getChildren("ParameterSet");
                                        for (a = 0; a < cur_smc_c.length; a++) {
                                            if (cur_smc_c[a].attrs.difficulty == SubMissions_c[i].attrs.difficulty && cur_smc_c[a].attrs.kind == SubMissions_c[i].attrs.kind && ((SubMissions_c[i].attrs.mission_flow != null && cur_smc_c[a].attrs.mission_flow == SubMissions_c[i].attrs.mission_flow) || SubMissions_c[i].attrs.mission_flow == null)) {
                                                cur_sub_mis_conf.push({ name: key, conf: generatorSublevelsConfigs[key] });
                                                break;
                                            }
                                        }
                                    }

                                }
                            }
                        }

                        if (cur_sub_mis_conf.length != 0) {
                            //console.log(cur_sub_mis_conf);
                            while (true) {
                                var res_cur_sb = getRandomInt(0, cur_sub_mis_conf.length);
                                if (used_sublevels[cur_sub_mis_conf[res_cur_sb].name] == null) {
                                    used_sublevels[cur_sub_mis_conf[res_cur_sb].name] = 1;
                                    //console.log(cur_sub_mis_conf[res_cur_sb].name)
                                    var setp_cur = cur_sub_mis_conf[res_cur_sb].conf.getChildren("ParameterSet");
                                    var m_flows = [];
                                    for (n = 0; n < setp_cur.length; n++) {
                                        if (setp_cur[n].attrs.difficulty == SubMissions_c[i].attrs.difficulty && setp_cur[n].attrs.kind == SubMissions_c[i].attrs.kind && ((SubMissions_c[i].attrs.mission_flow != null && setp_cur[n].attrs.mission_flow == SubMissions_c[i].attrs.mission_flow) || SubMissions_c[i].attrs.mission_flow == null)) {
                                            m_flows.push(setp_cur[n]);
                                        }
                                    }

                                    if (m_flows.length == 0) {
                                        console.log("[CacheMissionsPvE]:Failed to find flows for mission '" + cur_sub_mis_conf[res_cur_sb].name + "'");
                                        throw "";
                                    }
                                    var res_lst = m_flows[getRandomInt(0, m_flows.length)];
                                    var Sublevel_c = Sublevels_c.c("Sublevel", { id: cur_sub_id, name: cur_sub_mis_conf[res_cur_sb].name, mission_flow: res_lst.attrs.mission_flow, score: res_lst.attrs.score, difficulty: res_lst.attrs.difficulty, difficulty_cfg: (res_lst.attrs.difficulty_cfg != null ? res_lst.attrs.difficulty_cfg : "diff_" + res_lst.attrs.difficulty + ".cfg"), win_pool: res_lst.attrs.win_pool, lose_pool: res_lst.attrs.lose_pool, draw_pool: res_lst.attrs.draw_pool, score_pool: res_lst.attrs.score_pool });

                                    var CrownRewardsThresholds_c = res_lst.getChild("CrownRewardsThresholds");
                                    if (CrownRewardsThresholds_c != null) {
                                        Sublevel_c.children.push(CrownRewardsThresholds_c);
                                    }

                                    var RewardPools_c = res_lst.getChild("RewardPools");
                                    if (RewardPools_c != null) {
                                        Sublevel_c.children.push(RewardPools_c);
                                    }

                                    mass_subl_params.push(res_lst.attrs);
                                    cur_sub_id++;
                                    break;
                                }
                            }

                        } else {
                            throw "SubMission для левелграфа:" + cur_MissionGraph.attrs.name + " не найден.";
                        }
                    }
                    var s_objectvs_max = Number(SecondaryObjectives_c.attrs.max);
                    var s_objectvs_min = Number(SecondaryObjectives_c.attrs.min);

                    var Objectives_c = res_missions_xml.c("Objectives");
                    var res_time_limit = 0;
                    for (k = 0; k < mass_subl_params.length; k++) {
                        res_time_limit = res_time_limit + Number(mass_subl_params[k].time_limit);
                    }
                    Objectives_c.c("Objective", { type: "primary", completion_score: CompletionScore_x, timelimit: res_time_limit });

                    if (s_objectvs_min > 0 && s_objectvs_max > 0) {
                        var random_obj_num = getRandomInt(s_objectvs_min, s_objectvs_max + 1);
                        var used_sec_obj = [];
                        for (g = 0; g < random_obj_num; g++) {
                            var objective_c = global.SecondaryObjectivesDesc.getChildren("objective");
                            while (true) {
                                var random_secondary_obj = getRandomInt(0, objective_c.length);
                                if (used_sec_obj[random_secondary_obj] == null) {
                                    used_sec_obj[random_secondary_obj] = 1;
                                    var cur_objective = objective_c[random_secondary_obj];
                                    var cur_p_to_r = cur_objective.getChild("difficulties").getChild(cur_MissionGraph.attrs.target_difficulty);
                                    if (cur_p_to_r != null) {
                                        Objectives_c.c("Objective", { type: "secondary", completion_score: Number(cur_p_to_r.attrs.progress_to_reach) * mass_subl_params.length, id: cur_objective.attrs.id });
                                    } else {
                                        throw "Difficulty:" + cur_MissionGraph.attrs.target_difficulty + " not found";
                                    }
                                    break;
                                }
                            }
                        }
                    }
                    var Teleports_c = res_missions_xml.c("Teleports");
                    for (var slb = 1; slb < mass_subl_params.length; slb++) {
                        Teleports_c.c("Teleport", { start_sublevel_id: slb - 1, start_teleport: mass_subl_params[slb - 1].finish_teleport, finish_sublevel_id: slb, finish_teleport: mass_subl_params[slb].start_teleport });
                    }
                    //console.log(res_missions_xml+"");
                    return_missions.push(res_missions_xml);
                } else {
                    throw "MissionGraph:" + LevelGraph_c[res_expire].getText() + " not found";
                }
                cur_expire++;
            }
        }
        return return_missions;
    }

    var cur_fdat = ltx.parse(String(generatorMissionGenerationConfiguration));
    var Settings_c = cur_fdat.getChildElements();
    var mtcount = 0;
    var cur_generation_count = 0;

    while (mtcount < Settings_c.length) {

        var count_to_gen = Number(Settings_c[mtcount].attrs.generate_count);
        var cur_generation_count = 0;

        while (cur_generation_count < count_to_gen) {
            console.log("[CacheMissionsPvE]:Generation mission of type '" + Settings_c[mtcount].name + "'");
            var cur_gen_missions = generate_one_mission(Settings_c[mtcount]);
            for (k = 0; k < cur_gen_missions.length; k++) {
                removeTextFromLtxElements(cur_gen_missions[k]);
                resultData.push(cur_gen_missions[k].toString());
            }
            //console.log(cur_gen_missions);
            cur_generation_count++;
        }

        if (Settings_c[mtcount].attrs.propagate_on_expire != null) {

            var nca = generatorMissionGenerationConfiguration.getChild(Settings_c[mtcount].attrs.propagate_on_expire);

            if (nca != null) {

                if (!nca.attrs.difficulty) {
                    nca.attrs.difficulty = nca.name;
                }

                Settings_c[mtcount].attrs.propagate_on_expire = nca.attrs.propagate_on_expire;
                Settings_c[mtcount].name = nca.name;
                Settings_c[mtcount].attrs.difficulty = nca.attrs.difficulty;

                var old_lg = Settings_c[mtcount].getChild("LevelGraph");
                if (old_lg != null) {
                    for (i = 0; i < old_lg.children.length; i++) {
                        if (old_lg.children[i].name != null) {
                            old_lg.children[i].children[0] = old_lg.children[i].children[0].split("_")[0] + "_" + nca.attrs.difficulty;
                        }
                    }
                }

            } else {
                throw "Ошибка-> тип:" + Settings_c[mtcount].attrs.propagate_on_expire + " не найден";
            }
        } else {
            mtcount++;
        }
    }
    console.log("[CacheMissionsPvE]:Updating ProfilesPerformance...");
    global.db.warface.profiles.updateMany({}, { "$set": { profile_performance: {} } }, function (err, dbUpdate) {
        console.log("[CacheMissionsPvE]:Updating GlobalPerformance...");
        global.db.warface.cache.updateOne({ _id: "performance" }, { "$set": { _id: "performance", hash: Math.round(new Date().getTime() / 1000), data: [] } }, { upsert: true }, function (err1, dbUpdate1) {
            callback(resultData);
        })
    });
}