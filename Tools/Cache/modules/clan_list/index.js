exports.module = function (callback) {
	var resultData = [];

	var allClansList = [];

	console.log("[CacheClanList]:Getting clans from database...");
	global.db.warface.clans.find({}, { projection: { "name": 1 } }).toArray(function (errClansList, resultClansList) {

		if (errClansList) {
			console.log("[CacheClanList]:Failed to execute db query get clans");
			throw "";
		}

		if(!resultClansList){
			console.log("[CacheClanList]:Failed to get db query get clans");
			throw "";			
		}

		var i = 0;

		function foreachClansListNext() {
			i++;
			foreachClansList();
		}

		function foreachClansList() {

			if (i < resultClansList.length) {
				var clanName = resultClansList[i].name;
				//console.log("[CacheClanList]:Getting members from database for clan '" + clanName + "' ...");
				global.db.warface.profiles.find({ clan_name: clanName }, { projection: { "nick": 1, "clan_points": 1, "clan_role": 1 } }).toArray(function (errMembers, resultMembers) {

					if (errMembers) {
						console.log("[CacheClanList]:Failed to execute db query get members");
						throw "";
					}

					if(!resultMembers){
						console.log("[CacheClanList]:Failed to get db query get members");
						throw "";						
					}

					//console.log("[CacheClanList]:Caching members...");
					var clanCacheObject = { name: clanName, master: "NoMaster", clan_points: 0, members: resultMembers.length };

					for (var m = 0; m < resultMembers.length; m++) {
						var memberInfo = resultMembers[m];

						clanCacheObject.clan_points += memberInfo.clan_points;

						if (memberInfo.clan_role == 1) {
							clanCacheObject.master = memberInfo.nick;
						}
					}

					allClansList.push(clanCacheObject);
					foreachClansListNext();
				});
			} else {
				console.log("[CacheClanList]:Sorting by clanPoints ...");
				sortByPoints(allClansList);

				console.log("[CacheClanList]:Update clan positions ...");
				for (var r = 0; r < allClansList.length; r++) {
					allClansList[r].position = r + 1;

					if (r < 10) {
						resultData.push(allClansList[r]);
					}
				}

				var c = 0;

				function froeachSaveClanNext() {
					c++;
					froeachSaveClan();
				}


				function froeachSaveClan() {
					if (c < allClansList.length) {
						var clanInfo = allClansList[c];
						//console.log("[CacheClanList]:Update clan position for clan '"+clanInfo.name+"' ...");
						global.db.warface.clans.findOneAndUpdate({ name: clanInfo.name }, { $set: { leaderboard_position: clanInfo.position } }, { projection: { "_id": 1 } }, function (errUpdate, resultUpdate) {
							
							if (errUpdate) {
								console.log("[CacheClanList]:Failed to execute db query update clan position for clan '"+clanInfo.name+"'");
								throw "";
							}
							
							if(!resultUpdate){
								console.log("[CacheClanList]:Failed to get db query update clan position for clan '"+clanInfo.name+"'");
								throw "";								
							}
							
							froeachSaveClanNext();
						});
					} else {
						console.log("[CacheClanList]:End");
						callback(resultData);
					}
				}
				froeachSaveClan();
			}
		}
		foreachClansList();

	});

}

function sortByPoints(arr) {
	arr.sort((a, b) => a.clan_points > b.clan_points ? -1 : 1);
}