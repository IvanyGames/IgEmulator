var mongoClient = require("mongodb").MongoClient;

//Load startupParams
global.startupParams = {};
for (argKey in process.argv) {
	var argData = process.argv[argKey].split("=")
	if (argData.length == 2) {
		global.startupParams[argData[0]] = argData[1];
	}
}

var mongodbUrl = "mongodb://127.0.0.1:27017/";

if (global.startupParams.mongodb) {
	mongodbUrl = global.startupParams.mongodb;
}

function loadDb() {

	global.db = {};
	console.log("[MongoDb]:Connecting");

	var mongoConnectionAttrs = { useNewUrlParser: true, useUnifiedTopology: true };

	if (require("mongodb/lib/connection_string.js").OPTIONS.reconnectTries) {
		mongoConnectionAttrs.reconnectTries = Number.MAX_VALUE;
	}

	mongoClient.connect(mongodbUrl, mongoConnectionAttrs, function (err, dbClient) {

		if (dbClient != null) {

			global.db.warface = {};
			global.db.warface.profiles = dbClient.db("warface").collection("profiles_" + global.startupParams.locale + "_" + global.startupParams.version);
			global.db.warface.cache = dbClient.db("warface").collection("cache_" + global.startupParams.locale + "_" + global.startupParams.version);
			global.db.warface.clans = dbClient.db("warface").collection("clans_" + global.startupParams.locale + "_" + global.startupParams.version);
			global.db.warface.hwban = dbClient.db("warface").collection("hwban");

			console.log("[MongoDb]:Initializing 'profiles'");

			global.db.warface.profiles.createIndexes([{ key: { _id: 1 }, name: "_id_" }, { key: { username: 1 }, name: "_username_", unique: true }, { key: { nick: 1 }, name: "_nick_", unique: true }, { key: { clan_name: 1 }, name: "_clan_name_" }], function (errCreateProfilesIndexes) {

				if (errCreateProfilesIndexes) {
					console.log(errCreateProfilesIndexes);
					throw "";
				}

				console.log("[MongoDb]:Initializing 'clans'");

				global.db.warface.clans.createIndexes([{ key: { _id: 1 }, name: "_id_" }, { key: { name: 1 }, name: "_name_", unique: true }], function (errCreateClansIndexes) {

					if (errCreateClansIndexes) {
						console.log(errCreateClansIndexes);
						throw "";
					}

					console.log("[MongoDb]:Initializing 'cache'");

					global.db.warface.cache.createIndexes([{ key: { _id: 1 }, name: "_id_" }], function (errCreateCacheIndexes) {

						if (errCreateCacheIndexes) {
							console.log(errCreateCacheIndexes);
							throw "";
						}

						console.log("[MongoDb]:Initializing 'hwban'");

						global.db.warface.hwban.createIndexes([{ key: { _id: 1 }, name: "_id_" }], function (errCreateHwbanIndexes) {

							if (errCreateHwbanIndexes) {
								console.log(errCreateHwbanIndexes);
								throw "";
							}

							onDbLoaded();
						});

					});

				});
			});
		} else {
			console.log("[MongoDb]:Connect error -> " + err.message);
			setTimeout(function () {
				loadDb();
			}, 1000);
		}
	});
}
loadDb();

function onDbLoaded() {

	var moduleName = global.startupParams.modules;
	console.log("[Cache][" + moduleName + "]:Caching...");

	require("./" + moduleName + ".js").module(function (data) {
		console.log("[Cache][" + moduleName + "]:Updating in database...");
		global.db.warface.cache.updateOne({ _id: moduleName }, { "$set": { _id: moduleName, hash: Math.round(new Date().getTime() / 1000), data: data } }, { upsert: true }, function (dbErr, dbUpdate) {
			if (!dbErr) {
				console.log("[Cache][" + moduleName + "]:Updated in database");
				process.exit(0);
			} else {
				console.log("[Cache][" + moduleName + "]:Database update failed");
				process.exit(0);
			}
		});
	});
}