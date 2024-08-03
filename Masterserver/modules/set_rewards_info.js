var ltx = require('ltx')
var scriptProfile = require('../scripts/profile.js')
var scriptTools = require('../scripts/tools.js')
var scriptClan = require('../scripts/clan.js')

exports.module = function (stanza) {

    var username = stanza.attrs.from.split("@")[0];

    if (username != "dedicated") {
        return;
    }

    var session_id = stanza.children[0].children[0].attrs.session_id;
    var difficulty = stanza.children[0].children[0].attrs.difficulty;
    var isPvE = Number(stanza.children[0].children[0].attrs.isPvE);
    var isClanWar = Number(stanza.children[0].children[0].attrs.isClanWar);
    var mission_id = stanza.children[0].children[0].attrs.mission_id;
    var incomplete_session = Number(stanza.children[0].children[0].attrs.incomplete_session);
    var session_time = Number(stanza.children[0].children[0].attrs.session_time);
    var session_kill_count = Number(stanza.children[0].children[0].attrs.session_kill_count);
    var winning_team_id = Number(stanza.children[0].children[0].attrs.winning_team_id);
    var passed_sublevels_count = Number(stanza.children[0].children[0].attrs.passed_sublevels_count);
    var passed_checkpoints_count = Number(stanza.children[0].children[0].attrs.passed_checkpoints_count);
    var secondary_objectives_completed = Number(stanza.children[0].children[0].attrs.secondary_objectives_completed);
    var max_session_score = Number(stanza.children[0].children[0].attrs.max_session_score);

    var elementSetRewardsInfo = stanza.children[0].children[0];
    
    var roomObject = global.gamerooms[global.gamerooms.findIndex(function (x) { return x.dedicatedServerJid == stanza.attrs.from })];

    if (!roomObject) {
        //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:Couldn't find a room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '1' });
        return;
    }

    if (mission_id != roomObject.mission.mission_key) {
        //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:MissionId mismatch");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '1' });
        return;
    }

    var baseSecondaryObjectiveBonusPool = secondary_objectives_completed * global.resources.RewardsConfiguration.SecondaryObjectiveBonus;//Пыл для жоп зажаний

    var baseWinPool = global.resources.RewardsConfiguration.WinPoolDefault;
    var baseLosePool = global.resources.RewardsConfiguration.LosePoolDefault;
    var baseDrawPool = global.resources.RewardsConfiguration.DrawPoolDefault;
    var baseScorePool = global.resources.RewardsConfiguration.ScorePoolDefault;

    var missionInfo = ltx.parse(Buffer.from(roomObject.missionBase64, 'base64').toString('utf8'));

    var elementSublevels = missionInfo.getChild("Sublevels");
    var elementsSublevel = elementSublevels.getChildren("Sublevel");

    if (elementsSublevel.length == 0) {
        //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:Use one sublevel");
        baseWinPool = Number(elementSublevels.attrs.win_pool);
        baseLosePool = Number(elementSublevels.attrs.lose_pool);
        baseDrawPool = Number(elementSublevels.attrs.draw_pool);
        baseScorePool = Number(elementSublevels.attrs.score_pool);
    } else if (passed_sublevels_count > 0 && elementsSublevel.length >= passed_sublevels_count) {
        //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:Use many sublevels");

        baseWinPool = 0;
        baseLosePool = 0;
        baseDrawPool = 0;
        baseScorePool = 0;

        for (var i = 0; i < passed_sublevels_count; i++) {
            var elementSublevel = elementsSublevel[i];

            baseWinPool += Number(elementSublevel.attrs.win_pool);
            baseLosePool += Number(elementSublevel.attrs.lose_pool);
            baseDrawPool += Number(elementSublevel.attrs.draw_pool);
            baseScorePool += Number(elementSublevel.attrs.score_pool);
        }

    } else {
        //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:Use default pools");
    }

    var dbClanBulkOperationsArr = [];
    var objectClansToSync = {};

    var missionPerformance;
    var missionCrownReawardsByLeages;
    var missionCrownRewardsThresholds;

    var elementPlayersPerformance;

    var missionBonusRewardPool;

    var missionRewardPool = 0;

    var missionSpecicalReward = global.resources.objectCustomRules.mission_reward[(missionInfo.attrs.mission_type ? missionInfo.attrs.mission_type : missionInfo.attrs.difficulty)];

    if (missionInfo.attrs.game_mode == "pve") {

        elementPlayersPerformance = elementSetRewardsInfo.getChild("players_performance");
        if (elementPlayersPerformance) {

            var elementPerformance0 = elementPlayersPerformance.getChildByAttr("id", "0");
            var elementPerformance1 = elementPlayersPerformance.getChildByAttr("id", "1");
            var elementPerformance2 = elementPlayersPerformance.getChildByAttr("id", "2");
            var elementPerformance3 = elementPlayersPerformance.getChildByAttr("id", "3");
            var elementPerformance4 = elementPlayersPerformance.getChildByAttr("id", "4");
            var elementPerformance5 = elementPlayersPerformance.getChildByAttr("id", "5");

            if (elementPerformance0 && elementPerformance1 && elementPerformance2 && elementPerformance3 && elementPerformance4 && elementPerformance5) {
                missionPerformance = {
                    "0": Number(elementPerformance0.attrs.value),
                    "1": Number(elementPerformance1.attrs.value),
                    "2": Number(elementPerformance2.attrs.value),
                    "3": Number(elementPerformance3.attrs.value),
                    "4": Number(elementPerformance4.attrs.value),
                    "5": Number(elementPerformance5.attrs.value)
                };
            }
        } else {
            //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:No PlayersPerformance");
        }

        if (missionPerformance) {
            missionCrownReawardsByLeages = global.resources.RewardsConfiguration.CrownRewards[(missionInfo.attrs.mission_type ? missionInfo.attrs.mission_type : missionInfo.attrs.difficulty)];
        } else {
            //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:No missionPerformance");
        }

        if (elementsSublevel.length > 0) {
            for (var i = 0; i < elementsSublevel.length; i++) {
                var elementSublevel = elementsSublevel[i];

                var elementCrownRewardsThresholds = elementSublevel.getChild("CrownRewardsThresholds");
                if (missionCrownReawardsByLeages && elementCrownRewardsThresholds) {
                    if (!missionCrownRewardsThresholds) {
                        missionCrownRewardsThresholds = { time: { bronze: 0, silver: 0, gold: 0 }, totalPerformance: { bronze: 0, silver: 0, gold: 0 } };
                    }

                    var elementTime = elementCrownRewardsThresholds.getChild("Time");
                    var elementTotalPerformance = elementCrownRewardsThresholds.getChild("TotalPerformance");

                    missionCrownRewardsThresholds.time.bronze += Number(elementTime.attrs.bronze)
                    missionCrownRewardsThresholds.time.silver += Number(elementTime.attrs.silver)
                    missionCrownRewardsThresholds.time.gold += Number(elementTime.attrs.gold)

                    missionCrownRewardsThresholds.totalPerformance.bronze += Number(elementTotalPerformance.attrs.bronze)
                    missionCrownRewardsThresholds.totalPerformance.silver += Number(elementTotalPerformance.attrs.silver)
                    missionCrownRewardsThresholds.totalPerformance.gold += Number(elementTotalPerformance.attrs.gold)

                }

                var elementRewardPools = elementSublevel.getChild("RewardPools");
                if (elementRewardPools) {
                    var elementPool = elementRewardPools.getChildByAttr("name", String(passed_checkpoints_count));
                    if (elementPool) {
                        missionRewardPool += Number(elementPool.attrs.value);
                    }
                }
            }
        } else {
            //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:No sublevels");
        }

        var missionBonusRewardPoolLocal = global.resources.RewardsConfiguration.BonusRewardPool[(missionInfo.attrs.mission_type ? missionInfo.attrs.mission_type : missionInfo.attrs.difficulty)];
        if (missionBonusRewardPoolLocal) {
            missionBonusRewardPool = missionBonusRewardPoolLocal;
        }
    }

    //console.log(missionRewardPool);
    //console.log(missionCrownRewardsThresholds);

    //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:DefaultPools WinPool:" + baseWinPool + " LosePool:" + baseLosePool + " DrawPool:" + baseDrawPool + " ScorePool:" + baseScorePool + " SecondaryObjectiveBonusPool:" + baseSecondaryObjectiveBonusPool);

    var missionMultiplierMoney = (global.resources.RewardsConfiguration.MoneyMultiplier[(roomObject.mission.type ? roomObject.mission.type : roomObject.mission.difficulty)] ? global.resources.RewardsConfiguration.MoneyMultiplier[(roomObject.mission.type ? roomObject.mission.type : roomObject.mission.difficulty)] : global.resources.RewardsConfiguration.MoneyMultiplier["default"]);
    var missionMultiplierExperience = (global.resources.RewardsConfiguration.ExperienceMultiplier[(roomObject.mission.type ? roomObject.mission.type : roomObject.mission.difficulty)] ? global.resources.RewardsConfiguration.ExperienceMultiplier[(roomObject.mission.type ? roomObject.mission.type : roomObject.mission.difficulty)] : global.resources.RewardsConfiguration.ExperienceMultiplier["default"]);
    var missionMultiplierSponsorPoints = (global.resources.RewardsConfiguration.SponsorPointsMultiplier[(roomObject.mission.type ? roomObject.mission.type : roomObject.mission.difficulty)] ? global.resources.RewardsConfiguration.SponsorPointsMultiplier[(roomObject.mission.type ? roomObject.mission.type : roomObject.mission.difficulty)] : global.resources.RewardsConfiguration.SponsorPointsMultiplier["default"])
    var missionMultiplierClanPointsClanWar = (roomObject.room_type == 4 ? global.resources.RewardsConfiguration.ClanPointsClanWarMultiplier : global.resources.RewardsConfiguration.ClanPointsMultiplier);

    var elementBroadcastSessionResult = new ltx.Element("broadcast_session_result");
    var elementBrodcastSessionResult = new ltx.Element("brodcast_session_result");

    var arrBcastReceivers = [];

    var elementsTeam = elementSetRewardsInfo.getChildren("team");

    var playersCountInRewards = 0;
    for (var t = 0; t < elementsTeam.length; t++) {
        playersCountInRewards += elementsTeam[t].getChildren("profile").length;
    }

    var playersCountMult = global.resources.RewardsConfiguration.player_count_reward_mults[playersCountInRewards - 1];

    var playersJson = {};

    for (var t = 0; t < elementsTeam.length; t++) {
        var elementTeam = elementsTeam[t];

        //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:ProcessingTeam " + elementTeam.attrs.id);

        var isWin = Number(elementTeam.attrs.id) == winning_team_id;

        var elementsProfile = elementTeam.getChildren("profile");
        for (var p = 0; p < elementsProfile.length; p++) {
            var elementProfile = elementsProfile[p];
            //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:ProcessingProfile " + elementProfile.attrs.profile_id);

            var profileObject = global.users._id[elementProfile.attrs.profile_id];

            if (!profileObject) {
                //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:Profile not found");
                continue;
            }

            if (missionInfo.attrs.game_mode == "pve" && missionPerformance && winning_team_id == 1) {
                playersJson[profileObject._id] = { nick: profileObject.nick, experience: profileObject.experience, current_class: profileObject.current_class, clan: profileObject.clan_name };
            }

            var profileScorePool = 0;
            if (Number(elementProfile.attrs.score) != 0 && max_session_score != 0) {
                profileScorePool = baseScorePool / 100 * Number(elementProfile.attrs.score) / max_session_score * 100;
            }

            var profileResultPool = 0;
            if (winning_team_id == -1) {
                profileResultPool = baseDrawPool + profileScorePool + baseSecondaryObjectiveBonusPool + missionRewardPool;
            } else if (isWin) {
                profileResultPool = baseWinPool + profileScorePool + baseSecondaryObjectiveBonusPool + missionRewardPool;
            } else {
                profileResultPool = baseLosePool + profileScorePool + baseSecondaryObjectiveBonusPool + missionRewardPool;
            }

            //Тут типо TODO проверка в сессии ли игрок с самого начала и вычлесление сколько он был в сессии 

            if (playersCountMult != null && missionInfo.attrs.game_mode != "pve") {
                profileResultPool = profileResultPool * playersCountMult;
            }

            if (profileResultPool < global.resources.RewardsConfiguration.MinReward) {
                profileResultPool = global.resources.RewardsConfiguration.MinReward;
            }

            var profileNoCrownRewards = 1;
            var profileGainedCrownMoney = 0;

            var profileBonusPool = 0;

            if (missionPerformance) {

                var profilePerformanceOldStat0 = profileObject.profile_performance[roomObject.mission.mission_key] ? profileObject.profile_performance[roomObject.mission.mission_key].leaderboard["0"] : 0;
                var profilePerformanceOldStat5 = profileObject.profile_performance[roomObject.mission.mission_key] ? profileObject.profile_performance[roomObject.mission.mission_key].leaderboard["5"] : 0;

                var profileMissionIsWinOld = profileObject.profile_performance[roomObject.mission.mission_key] ? profileObject.profile_performance[roomObject.mission.mission_key].success : 0;

                scriptProfile.updateProfilePerformance(profileObject, isWin, roomObject.mission.mission_key, missionPerformance);

                if (missionBonusRewardPool && profileMissionIsWinOld == 0 && isWin == 1) {
                    profileBonusPool = missionBonusRewardPool;
                }

                if (isWin && missionCrownRewardsThresholds) {

                    var profilePerformanceNewStat0 = profileObject.profile_performance[roomObject.mission.mission_key] ? profileObject.profile_performance[roomObject.mission.mission_key].leaderboard["0"] : 0;
                    var profilePerformanceNewStat5 = profileObject.profile_performance[roomObject.mission.mission_key] ? profileObject.profile_performance[roomObject.mission.mission_key].leaderboard["5"] : 0;

                    var gainedCrownsTotalPerfomanceOld = 0;
                    var gainedCrownsTimePerfomanceOld = 0;

                    var gainedCrownsTotalPerfomanceNew = 0;
                    var gainedCrownsTimePerfomanceNew = 0;

                    for (var leage in missionCrownRewardsThresholds.totalPerformance) {
                        if (profilePerformanceOldStat0 > missionCrownRewardsThresholds.totalPerformance[leage]) {
                            gainedCrownsTotalPerfomanceOld += missionCrownReawardsByLeages[leage];
                        }
                        if (profilePerformanceNewStat0 > missionCrownRewardsThresholds.totalPerformance[leage]) {
                            gainedCrownsTotalPerfomanceNew += missionCrownReawardsByLeages[leage];
                        }
                    }

                    for (var leage in missionCrownRewardsThresholds.time) {
                        if (profilePerformanceOldStat5 > missionCrownRewardsThresholds.time[leage]) {
                            gainedCrownsTimePerfomanceOld += missionCrownReawardsByLeages[leage];
                        }
                        if (profilePerformanceNewStat5 > missionCrownRewardsThresholds.time[leage]) {
                            gainedCrownsTimePerfomanceNew += missionCrownReawardsByLeages[leage];
                        }
                    }

                    var gainedCrownsTotalPerfomance = gainedCrownsTotalPerfomanceNew - gainedCrownsTotalPerfomanceOld;
                    var gainedCrownsTimePerfomance = gainedCrownsTimePerfomanceNew - gainedCrownsTimePerfomanceOld;

                    var gainedCrownsSum = gainedCrownsTotalPerfomance + gainedCrownsTimePerfomance;

                    //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:GainedCrownsOld Total:" + gainedCrownsTotalPerfomanceOld + " Time:" + gainedCrownsTimePerfomanceOld);
                    //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:GainedCrownsNew Total:" + gainedCrownsTotalPerfomanceNew + " Time:" + gainedCrownsTimePerfomanceNew);
                    //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:GainedCrowns Total:" + gainedCrownsTotalPerfomance + " Time:" + gainedCrownsTimePerfomance);
                    //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:GainedCrownsSum " + gainedCrownsSum);

                    profileGainedCrownMoney = gainedCrownsSum;
                    profileNoCrownRewards = 0;
                }
            }

            //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:ProfilePools ResultPool:" + profileResultPool + " ScorePool:" + profileScorePool);

            var profileBoostIs = 0;
            var profileBoostMulVp = 1;
            var profileBoostMulGm = 1;
            var profileBoostMulXp = 1;

            for (var i = 0; i < profileObject.items.length; i++) {
                var itemObject = profileObject.items[i];
                if (itemObject.seconds_left != 0) {
                    var specialItemInfo = global.resources.items.data[global.resources.items.data.findIndex(function (x) { return x.isShopItem == true && x.name == itemObject.name; })];
                    if (specialItemInfo && specialItemInfo.itemType == "booster") {
                        profileBoostMulVp += specialItemInfo.boosterInfo.vpBoost;
                        profileBoostMulGm += specialItemInfo.boosterInfo.gmBoost;
                        profileBoostMulXp += specialItemInfo.boosterInfo.xpBoost;
                        profileBoostIs = 1;
                    }
                }
            }

            var profileIntermediateNoBoostMoney = Math.round(profileResultPool * missionMultiplierMoney);
            var profileIntermediateNoBoostExperience = Math.round(profileResultPool * missionMultiplierExperience);
            var profileIntermediateNoBoostSponsorPoints = Math.round(profileResultPool * missionMultiplierSponsorPoints);

            var profileIntermediateBoostMoney = Math.round(profileIntermediateNoBoostMoney * profileBoostMulGm);
            var profileIntermediateBoostExperience = Math.round(profileIntermediateNoBoostExperience * profileBoostMulXp);
            var profileIntermediateBoostSponsorPoints = Math.round(profileIntermediateNoBoostSponsorPoints * profileBoostMulVp);


            var profileIntermediateNoBoostBonusMoney = Math.round(profileBonusPool * missionMultiplierMoney);
            var profileIntermediateNoBoostBonusExperience = Math.round(profileBonusPool * missionMultiplierExperience);
            var profileIntermediateNoBoostBonusSponsorPoints = Math.round(profileBonusPool * missionMultiplierSponsorPoints);

            var profileIntermediateBoostBonusMoney = Math.round(profileIntermediateNoBoostBonusMoney * profileBoostMulGm);
            var profileIntermediateBoostBonusExperience = Math.round(profileIntermediateNoBoostBonusExperience * profileBoostMulXp);
            var profileIntermediateBoostBonusSponsorPoints = Math.round(profileIntermediateNoBoostBonusSponsorPoints * profileBoostMulVp);


            var profileResultBoostedMoney = profileIntermediateBoostMoney + profileIntermediateBoostBonusMoney;
            var profileResultBoostedExperience = profileIntermediateBoostExperience + profileIntermediateBoostBonusExperience;
            var profileResultBoostedSponsorPoints = profileIntermediateBoostSponsorPoints + profileIntermediateBoostBonusSponsorPoints;

            var profileResultNoBoostedMoney = profileIntermediateNoBoostMoney + profileIntermediateNoBoostBonusMoney;
            var profileResultNoBoostedExperience = profileIntermediateNoBoostExperience + profileIntermediateNoBoostBonusExperience;
            var profileResultNoBoostedSponsorPoints = profileIntermediateNoBoostSponsorPoints + profileIntermediateNoBoostBonusSponsorPoints;


            var profileResultBonusMoney = profileIntermediateBoostBonusMoney;
            var profileResultBonusExperience = profileIntermediateBoostBonusExperience;
            var profileResultBonusSponsorPoints = profileIntermediateBoostBonusSponsorPoints;

            var profileResultBoostMoney = profileResultBoostedMoney - profileResultNoBoostedMoney;
            var profileResultBoostExperience = profileResultBoostedExperience - profileResultNoBoostedExperience;
            var profileResultBoostSponsorPoints = profileResultBoostedSponsorPoints - profileResultNoBoostedSponsorPoints;

            var profileResultMoney = profileResultBoostedMoney;
            var profileResultExperience = profileResultBoostedExperience;
            var profileResultSponsorPoints = profileResultBoostedSponsorPoints;
            var profileResultClanPoints = Math.round(profileResultPool * missionMultiplierClanPointsClanWar);
            var profileResultCrownMoney = profileGainedCrownMoney;

            //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:ProfileResult Money:" + profileResultMoney + " Experience:" + profileResultExperience + " SponsorPoints:" + profileResultSponsorPoints + " ClanPoints:" + profileResultClanPoints);
            //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:ProfileResultBonus Money:" + profileResultBonusMoney + " Experience:" + profileResultBonusExperience + " SponsorPoints:" + profileResultBonusSponsorPoints);
            //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:ProfileResultBoost Money:" + profileResultBoostMoney + " Experience:" + profileResultBoostExperience + " SponsorPoints:" + profileResultBoostSponsorPoints);

            var profileOldMoney = profileObject.game_money;
            var profileOldExperience = profileObject.experience;
            var profileOldSponsorPoints = 0;
            var profileOldCrownMoney = profileObject.crown_money;

            scriptProfile.giveGameItem(profileObject, [{ name: "game_money_item_01", durabilityPoints: 0, expirationTime: "", quantity: profileResultMoney, offerId: 0 }, { name: "exp_item_01", durabilityPoints: 0, expirationTime: "", quantity: profileResultExperience, offerId: 0 }, { name: "crown_money_item_01", durabilityPoints: 0, expirationTime: "", quantity: profileResultCrownMoney, offerId: 0 }], false, null, null);

            var profileResultValidatedMoney = profileObject.game_money - profileOldMoney;
            var profileResultValidatedExperience = profileObject.experience - profileOldExperience;
            var profileResultValidatedSponsorPoints = 0 - profileOldSponsorPoints;
            var profileResultValidatedCrownMoney = profileObject.crown_money - profileOldCrownMoney;

            if (profileObject.clan_name) {
                dbClanBulkOperationsArr.push({ "updateOne": { "filter": { _id: profileObject._id, clan_name: profileObject.clan_name }, "update": { $inc: { "clan_points": profileResultClanPoints } } } });

                if (!objectClansToSync[profileObject.clan_name]) {
                    objectClansToSync[profileObject.clan_name] = [];
                }
                objectClansToSync[profileObject.clan_name].push(profileObject.nick);
            }

            if (isWin && missionSpecicalReward) {
                scriptProfile.giveSpecialReward(profileObject, missionSpecicalReward, null);
            }

            if (global.resources.objectRatingCurve && roomObject.room_type == 32) {

                if (isWin) {
                    profileObject.pvp_rating_points++;
                } else {
                    profileObject.pvp_rating_points--;
                }

                var maxPvpRatingPoints = global.resources.objectRatingCurve.ratings.length > 0 ? global.resources.objectRatingCurve.ratings[global.resources.objectRatingCurve.ratings.length - 1].points_required : 0;

                if (profileObject.pvp_rating_points > maxPvpRatingPoints) {
                    profileObject.pvp_rating_points = maxPvpRatingPoints;
                }

                if (profileObject.pvp_rating_points < 0) {
                    profileObject.pvp_rating_points = 0;
                }
            }

            //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:ProfileResultValidated Money:" + profileResultValidatedMoney + " Experience:" + profileResultValidatedExperience + " SponsorPoints:" + profileResultValidatedSponsorPoints);

            var elementPlayerResult = elementBroadcastSessionResult.c("player_result", { nickname: profileObject.nick, money: profileResultValidatedMoney, experience: profileResultValidatedExperience, pvp_rating_points: profileObject.pvp_rating_points, sponsor_points: profileResultValidatedSponsorPoints, bonus_money: profileResultBonusMoney, bonus_experience: profileResultBonusExperience, bonus_sponsor_points: profileResultBonusSponsorPoints, gained_crown_money: profileResultValidatedCrownMoney, completed_stages: passed_checkpoints_count, money_boost: profileResultBoostMoney, experience_boost: profileResultBoostExperience, sponsor_points_boost: profileResultBoostSponsorPoints, experience_boost_percent: profileBoostMulXp - 1, money_boost_percent: profileBoostMulGm - 1, sponsor_points_boost_percent: profileBoostMulVp - 1, is_vip: profileBoostIs, score: elementProfile.attrs.score, no_crown_rewards: profileNoCrownRewards, dynamic_multipliers_info: "", dynamic_crown_multiplier: 1, misison_passed: (0 + (profileObject.missions_unlocked.indexOf("easymission") != -1 ? 64 : 0) + (profileObject.missions_unlocked.indexOf("normalmission") != -1 ? 128 : 0) + (profileObject.missions_unlocked.indexOf("hardmission") != -1 ? 256 : 0)) });
            elementPlayerResult.c("profile_progression_update", { profile_id: profileObject._id, mission_unlocked: "none," + profileObject.missions_unlocked.join(",") + ",all", tutorial_unlocked: (1 + (profileObject.experience >= 120 ? 2 : 0) + (profileObject.experience >= 2900 ? 4 : 0)), tutorial_passed: scriptTools.getFlagByNumericArray(profileObject.tutorials_passed), class_unlocked: scriptTools.getFlagByNumericArray(profileObject.classes_unlocked) });
            elementBrodcastSessionResult.children.push(elementPlayerResult);
            arrBcastReceivers.push(profileObject.username + "@" + global.config.masterserver.domain + "/GameClient");
        }
    }

    if (elementPlayersPerformance) {
        elementBroadcastSessionResult.children.push(elementPlayersPerformance);
        elementBrodcastSessionResult.children.push(elementPlayersPerformance);
    }

    if (winning_team_id == 1 && missionPerformance) {

        global.db.warface.cache.updateOne({ _id: "performance" }, { "$set": { _id: "performance", hash: Math.round(new Date().getTime() / 1000) }, "$push": { data: { mission_id: mission_id, stats: missionPerformance, players: playersJson } } }, { upsert: true }, function (err, dbUpdate) {

        });

    }

    if (dbClanBulkOperationsArr.length) {
        global.db.warface.profiles.bulkWrite(dbClanBulkOperationsArr, function (errBulkWrite, resultBulkWrite) {

            if (errBulkWrite) {
                //console.log("[" + stanza.attrs.from + "][SetRewardsInfo]:Failed to execute db clan update points query");
                return;
            }

            for (var clanKey in objectClansToSync) {
                var clanMembersNicksArr = objectClansToSync[clanKey];
                scriptClan.syncMembersInfo(clanKey, clanMembersNicksArr, function (updateResult) {

                });
            }

        });
    }

    elementBroadcastSessionResult.attrs.bcast_receivers = arrBcastReceivers.join(",");
    global.xmppClient.request("k01." + global.config.masterserver.domain, elementBroadcastSessionResult);

    elementBrodcastSessionResult.attrs.bcast_receivers = arrBcastReceivers.join(",");
    global.xmppClient.request("k01." + global.config.masterserver.domain, elementBrodcastSessionResult);
}