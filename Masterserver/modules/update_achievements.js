var ltxElement = require('ltx').Element
var scriptProfile = require('../scripts/profile.js');

exports.module = function (stanza) {

    var username = stanza.attrs.from.split("@")[0];

    if (username != "dedicated") {
        return;
    }

    var elemetsAchievement = stanza.children[0].children[0].getChildren("achievement");

    var i = 0;
    function foreachElementsAchievement() {
        if (i < elemetsAchievement.length) {
            var elemetAchievement = elemetsAchievement[i];

            var profileObject = global.users._id[elemetAchievement.attrs.profile_id];

            if (!profileObject) {
                console.log("[" + stanza.attrs.from + "][UpdateAchievements]:Profile '" + elemetAchievement.attrs.profile_id + "' not found or not online");
                i++;
                foreachElementsAchievement();
                return;
            }

            var achievementCommands = [];

            var elementsChunk = elemetAchievement.getChildren("chunk");
            for (var c = 0; c < elementsChunk.length; c++) {
                var elementChunk = elementsChunk[c];

                var achievementAchievementId = Number(elementChunk.attrs.achievement_id);
                var achievementProgress = Number(elementChunk.attrs.progress);
                var achievementCompletionTime = Number(elementChunk.attrs.completion_time);

                achievementCommands.push({ command: "set", id: achievementAchievementId, amount: achievementProgress, time: achievementCompletionTime });
            }

            scriptProfile.updateAchievementsAmmount(profileObject, achievementCommands, function () {
                i++;
                foreachElementsAchievement();
                return;
            });

        } else {
            global.xmppClient.response(stanza, new ltxElement("update_achievements"));
        }
    }
    foreachElementsAchievement();
}