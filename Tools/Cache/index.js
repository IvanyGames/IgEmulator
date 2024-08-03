var mongoClient = require("mongodb").MongoClient;

//Load startupParams
global.startupParams = {};
for (argKey in process.argv) {
	var argData = process.argv[argKey].split("=")
	if (argData.length == 2) {
		global.startupParams[argData[0]] = argData[1];
	}
}


function loadDb() {
	global.db = {};
	console.log("[MongoDb]:Connecting...");
	mongoClient.connect("mongodb://127.0.0.1:27017/", { useNewUrlParser: true, useUnifiedTopology: true }, function (err, dbClient) {
		if (dbClient != null) {
			console.log("[MongoDb]:Connected");
			global.db.warface = {};
			global.db.warface.cache = dbClient.db("warface").collection("cache_" + global.startupParams.locale + "_" + global.startupParams.version);
			global.db.warface.clans = dbClient.db("warface").collection("clans");
			global.db.warface.profiles = dbClient.db("warface").collection("profiles");
			global.db.warface.performance = dbClient.db("warface").collection("performance");
			onDbLoaded();
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