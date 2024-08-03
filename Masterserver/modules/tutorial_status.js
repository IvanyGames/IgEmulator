var ltxElement = require('ltx').Element
var scriptProfile = require('../scripts/profile.js')
var scriptTools = require('../scripts/tools.js')

var objectTutorialPassInfo = {
    "678d8734-cc8a-4472-bb87-19bdb40107a8": {
        type: "tutorial_1",
        tutorialId: 0
    },
    "688d8633-1c8a-4d72-bc87-19bdb40117aa": {
        type: "tutorial_2",
        tutorialId: 1
    },
    "678a4754-1d2d-1f72-cc87-19bdb40107a8": {
        type: "tutorial_3",
        tutorialId: 2
    }
}

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("[" + stanza.attrs.from + "][TutorialStatus]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    var id = stanza.children[0].children[0].attrs.id;
    var step = stanza.children[0].children[0].attrs.step;
    var event = stanza.children[0].children[0].attrs.event;

    var elementTutorialStatus = new ltxElement("tutorial_status");

    if (step == "" && event == "2") {

        var passInfo = objectTutorialPassInfo[id];

        if (passInfo && profileObject.tutorials_passed.indexOf(passInfo.tutorialId) == -1) {
            
            profileObject.tutorials_passed.push(passInfo.tutorialId);

            var classNameToUnlock = global.resources.objectProfileProgressionConfig.class_unlock.tutorial_passed[passInfo.type];
            if (classNameToUnlock) {
                scriptProfile.unlockClass(profileObject, classNameToUnlock);
            }

            var specialRewardName = global.resources.objectProfileProgressionConfig.tutorial_passed[passInfo.type];
            if (specialRewardName) {
                scriptProfile.giveSpecialReward(profileObject, specialRewardName, null);
            }

            var profileTutorialUnloked = 1 + (profileObject.experience >= 120 ? 2 : 0) + (profileObject.experience >= 2900 ? 4 : 0);

            elementTutorialStatus.c("profile_progression_update", { profile_id: profileObject._id, mission_unlocked: "none," + profileObject.missions_unlocked.join(",") + ",all", tutorial_unlocked: profileTutorialUnloked, tutorial_passed: scriptTools.getFlagByNumericArray(profileObject.tutorials_passed), class_unlocked: scriptTools.getFlagByNumericArray(profileObject.classes_unlocked) });

        }
    }

    global.xmppClient.response(stanza, elementTutorialStatus);
}