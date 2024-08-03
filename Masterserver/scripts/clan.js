var ltxElement = require('ltx').Element

exports.getClanInfo = function (clan_name, callBack) {

	if (!clan_name) {
		callBack(null);
		return;
	}

	global.db.warface.clans.findOne({ "name": clan_name }, function (errClan, resultClan) {

		if (errClan) {
			console.log("[Clan][GetClanInfo]:ClanName '" + clan_name + "', failed to find, db query execute error");
			callBack(null);
			return;
		}

		if (!resultClan) {
			console.log("[Clan][GetClanInfo]:ClanName '" + clan_name + "', failed to find, not found");
			callBack(null);
			return;
		}

		global.db.warface.profiles.find({ "clan_name": clan_name }, { "projection": { "username": 1, "experience": 1, "banner_badge": 1, "banner_mark": 1, "banner_stripe": 1, "status": 1, "nick": 1, "clan_points": 1, "clan_role": 1, "invite_date": 1 } }).toArray(function (errProfiles, resultProfiles) {

			if (errProfiles) {
				console.log("[Clan][GetClanInfo]:ClanName '" + clan_name + "', failed to get clan profiles, db query execute error");
				callBack(null);
				return;
			}

			var elementClanInfo = new ltxElement("clan_info");

			var elementClan = elementClanInfo.c("clan", { "name": resultClan.name, "description": resultClan.description, "clan_id": resultClan._id, "creation_date": resultClan.creation_date, "leaderboard_position": resultClan.leaderboard_position, "master_badge": "0", "master_mark": "0", "master_stripe": "0" });

			for (var i = 0; i < resultProfiles.length; i++) {

				var memberInfo = resultProfiles[i];

				elementClan.c("clan_member_info", { "jid": memberInfo.username + "@" + global.config.masterserver.domain + "/GameClient", online_id: memberInfo.username + "@" + global.config.masterserver.domain + "/GameClient", "nickname": memberInfo.nick, "profile_id": memberInfo._id, "experience": memberInfo.experience, "clan_points": memberInfo.clan_points, "invite_date": memberInfo.invite_date, "clan_role": memberInfo.clan_role, "status": memberInfo.status });

				if (memberInfo.clan_role == 1) {
					elementClan.attrs.master_badge = memberInfo.banner_badge;
					elementClan.attrs.master_mark = memberInfo.banner_mark;
					elementClan.attrs.master_stripe = memberInfo.banner_stripe;
				}

			}

			callBack(elementClanInfo);

		});

	});

}
/*
exports.syncMembersInfo = function (clan_name, membersNicksArr, callBack) {
	global.db.warface.profiles.find({ "clan_name": clan_name, nick: { $in: membersNicksArr } }, { "projection": { "username": 1, "experience": 1, "status": 1, "nick": 1, "clan_points": 1, "clan_role": 1, "invite_date": 1 } }).toArray(function (errProfiles, resultProfiles) {

		if (errProfiles) {
			console.log("[Clan][UpdateMembersInfo]:ClanName '" + clan_name + "', failed to get clan profiles, db query execute error");
			callBack(false);
			return;
		}

		var elementClanMembersUpdated = new ltxElement("clan_members_updated");

		for (var i = 0; i < membersNicksArr.length; i++) {

			var memberNick = membersNicksArr[i];

			var elementUpdate = elementClanMembersUpdated.c("update", { nickname: memberNick });

			var memberProfileIndex = resultProfiles.findIndex(x => x.nick == memberNick);

			if (memberProfileIndex != -1) {
				var memberInfo = resultProfiles[memberProfileIndex];
				elementUpdate.c("clan_member_info", { "jid": memberInfo.username + "@" + global.config.masterserver.domain + "/GameClient", "nickname": memberInfo.nick, "profile_id": memberInfo._id, "experience": memberInfo.experience, "clan_points": memberInfo.clan_points, "invite_date": memberInfo.invite_date, "clan_role": memberInfo.clan_role, "status": memberInfo.status });
			}
		}

		global.db.warface.profiles.find({ "clan_name": clan_name }, { "projection": { "username": 1 } }).toArray(function (errAllProfiles, resultAllProfiles) {

			if (errAllProfiles) {
				console.log("[Clan][UpdateMembersInfo]:ClanName '" + clan_name + "', failed to get clan profiles usernames, db query execute error");
				callBack(false);
				return;
			}
			
			for (var i = 0; i < resultAllProfiles.length; i++) {
				global.xmppClient.request(resultAllProfiles[i].username + "@" + global.config.masterserver.domain + "/GameClient", elementClanMembersUpdated);
			}

			callBack(true);
		});
	});
}
*/

/*V2
exports.syncMembersInfo = function (clan_name, membersNicksArr, callBack) {
	
	global.db.warface.profiles.find({ nick: { $in: membersNicksArr } }, { "projection": { "_id": 1 } }).toArray(function (errProfilesToConv, resultProfilesToConv) {

		if (errProfilesToConv) {
			console.log("[Clan][UpdateMembersInfo]:ProfilesToConv, failed to get clan profiles, db query execute error");
			callBack(false);
			return;
		}	
	
		var membersProfileIdArr = [];
		for(var i = 0; i < resultProfilesToConv.length; i++){
			membersProfileIdArr.push(resultProfilesToConv[i]._id);
		}
	
		global.db.warface.profiles.find({ "clan_name": clan_name, nick: { $in: membersNicksArr } }, { "projection": { "username": 1, "experience": 1, "status": 1, "nick": 1, "clan_points": 1, "clan_role": 1, "invite_date": 1 } }).toArray(function (errProfiles, resultProfiles) {

			if (errProfiles) {
				console.log("[Clan][UpdateMembersInfo]:ClanName '" + clan_name + "', failed to get clan profiles, db query execute error");
				callBack(false);
				return;
			}

			var elementClanMembersUpdated = new ltxElement("clan_members_updated");

			for (var i = 0; i < membersNicksArr.length; i++) {

				var memberNick = membersNicksArr[i];

				var elementUpdate = elementClanMembersUpdated.c("update", { nickname: memberNick });

				var memberProfileIndex = resultProfiles.findIndex(x => x.nick == memberNick);

				if (memberProfileIndex != -1) {
					var memberInfo = resultProfiles[memberProfileIndex];
					elementUpdate.c("clan_member_info", { "jid": memberInfo.username + "@" + global.config.masterserver.domain + "/GameClient", "nickname": memberInfo.nick, "profile_id": memberInfo._id, "experience": memberInfo.experience, "clan_points": memberInfo.clan_points, "invite_date": memberInfo.invite_date, "clan_role": memberInfo.clan_role, "status": memberInfo.status });
				}
			}

			global.db.warface.profiles.find({ "clan_name": clan_name }, { "projection": { "username": 1 } }).toArray(function (errAllProfiles, resultAllProfiles) {

				if (errAllProfiles) {
					console.log("[Clan][UpdateMembersInfo]:ClanName '" + clan_name + "', failed to get clan profiles usernames, db query execute error");
					callBack(false);
					return;
				}
				
				for (var i = 0; i < resultAllProfiles.length; i++) {
					global.xmppClient.request(resultAllProfiles[i].username + "@" + global.config.masterserver.domain + "/GameClient", elementClanMembersUpdated);
				}

				callBack(true);
			});
		});
	
	});
}

//2015
exports.syncMembersInfo = function (clan_name, membersNicksArr, callBack) {
	global.db.warface.profiles.find({ nick: { $in: membersNicksArr } }, { "projection": { "username": 1, "experience": 1, "status": 1, "nick": 1, "clan_name":1, "clan_points": 1, "clan_role": 1, "invite_date": 1 } }).toArray(function (errProfiles, resultProfiles) {

		if (errProfiles) {
			console.log("[Clan][UpdateMembersInfo]:ClanName '" + clan_name + "', failed to get clan profiles, db query execute error");
			callBack(false);
			return;
		}

		var elementClanMembersUpdated = new ltxElement("clan_members_updated");

		for (var i = 0; i < membersNicksArr.length; i++) {

			var memberNick = membersNicksArr[i];

			var elementUpdate = elementClanMembersUpdated.c("update", { nickname: memberNick, profile_id: 0 });

			var memberProfileIndex = resultProfiles.findIndex(x => x.nick == memberNick);

			if (memberProfileIndex != -1) {
				var memberInfo = resultProfiles[memberProfileIndex];
				elementUpdate.attrs.profile_id = memberInfo._id;
				
				if(memberInfo.clan_name == clan_name){
					elementUpdate.c("clan_member_info", { "jid": memberInfo.username + "@" + global.config.masterserver.domain + "/GameClient", "nickname": memberInfo.nick, "profile_id": memberInfo._id, "experience": memberInfo.experience, "clan_points": memberInfo.clan_points, "invite_date": memberInfo.invite_date, "clan_role": memberInfo.clan_role, "status": memberInfo.status });
				}
			}
		}

		global.db.warface.profiles.find({ "clan_name": clan_name }, { "projection": { "username": 1 } }).toArray(function (errAllProfiles, resultAllProfiles) {

			if (errAllProfiles) {
				console.log("[Clan][UpdateMembersInfo]:ClanName '" + clan_name + "', failed to get clan profiles usernames, db query execute error");
				callBack(false);
				return;
			}
			
			for (var i = 0; i < resultAllProfiles.length; i++) {
				global.xmppClient.request(resultAllProfiles[i].username + "@" + global.config.masterserver.domain + "/GameClient", elementClanMembersUpdated);
			}

			callBack(true);
		});
	});
}

*/

exports.syncMembersInfo = function (clan_name, membersNicksArr, callBack) {
	global.db.warface.profiles.find({ nick: { $in: membersNicksArr } }, { "projection": { "username": 1, "experience": 1, "status": 1, "nick": 1, "clan_name": 1, "clan_points": 1, "clan_role": 1, "invite_date": 1 } }).toArray(function (errProfiles, resultProfiles) {

		if (errProfiles) {
			console.log("[Clan][UpdateMembersInfo]:ClanName '" + clan_name + "', failed to get clan profiles, db query execute error");
			callBack(false);
			return;
		}

		var elementClanMembersUpdated = new ltxElement("clan_members_updated");

		for (var i = 0; i < resultProfiles.length; i++) {

			var memberInfo = resultProfiles[i];

			var elementUpdate = elementClanMembersUpdated.c("update", { nickname: memberInfo.nick, profile_id: memberInfo._id });

			if (memberInfo.clan_name != clan_name) {
				continue;
			}

			elementUpdate.c("clan_member_info", { "jid": memberInfo.username + "@" + global.config.masterserver.domain + "/GameClient", online_id: memberInfo.username + "@" + global.config.masterserver.domain + "/GameClient", "nickname": memberInfo.nick, "profile_id": memberInfo._id, "experience": memberInfo.experience, "clan_points": memberInfo.clan_points, "invite_date": memberInfo.invite_date, "clan_role": memberInfo.clan_role, "status": memberInfo.status });
		}

		global.db.warface.profiles.find({ "clan_name": clan_name }, { "projection": { "username": 1 } }).toArray(function (errAllProfiles, resultAllProfiles) {

			if (errAllProfiles) {
				console.log("[Clan][UpdateMembersInfo]:ClanName '" + clan_name + "', failed to get clan profiles usernames, db query execute error");
				callBack(false);
				return;
			}

			for (var i = 0; i < resultAllProfiles.length; i++) {
				global.xmppClient.request(resultAllProfiles[i].username + "@" + global.config.masterserver.domain + "/GameClient", elementClanMembersUpdated);
			}

			callBack(true);
		});
	});
}

exports.syncMasterBanner = function (clan_name, callBack) {
	global.db.warface.profiles.findOne({ clan_name: clan_name, clan_role: 1 }, { projection: { "banner_badge": 1, "banner_mark": 1, "banner_stripe": 1 } }, function (errProfile, resultProfile) {

		if (errProfile) {
			console.log("[Clan][syncMasterBanner]:ClanName '" + clan_name + "', failed to get master profile, db error");
			callBack(false);
			return;
		}

		if (!resultProfile) {
			console.log("[Clan][syncMasterBanner]:ClanName '" + clan_name + "', failed to get master profile, profile or clan not found");
			callBack(false);
			return;
		}

		global.db.warface.profiles.find({ "clan_name": clan_name }, { "projection": { "username": 1 } }).toArray(function (errAllProfiles, resultAllProfiles) {

			if (errAllProfiles) {
				console.log("[Clan][syncMasterBanner]:ClanName '" + clan_name + "', failed to get clan profiles usernames, db query execute error");
				callBack(false);
				return;
			}

			var elementClanMasterbannerUpdate = new ltxElement("clan_masterbanner_update", { banner_badge: resultProfile.banner_badge, banner_mark: resultProfile.banner_mark, banner_stripe: resultProfile.banner_stripe });

			for (var i = 0; i < resultAllProfiles.length; i++) {
				global.xmppClient.request(resultAllProfiles[i].username + "@" + global.config.masterserver.domain + "/GameClient", elementClanMasterbannerUpdate);
			}

			callBack(true);
		});

	});
}