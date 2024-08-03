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


var itemsNamesIgnoreList = [
    "mission_access_token_01",
    "mission_access_token_02",
    "mission_access_token_03"
]

var resultData = [];
var items_paths = getFiles("./gamedata/items");
var cur_item_id = 1;
for (cur_item in items_paths) {
    var item_path = items_paths[cur_item].split("/");
    var item_file_name = item_path[item_path.length - 1].split(".");
    if (item_file_name[1] == "xml") {
        console.log("[CreateCacheItems]:Caching item " + items_paths[cur_item]);
        var cur_data = ltx.parse(fs.readFileSync(items_paths[cur_item]));

        //Игнорировние некторых предметов
        if (itemsNamesIgnoreList.indexOf(cur_data.attrs.name) != -1) {
            console.log("[CreateCacheItems]:Item '" + cur_data.attrs.name + "' is ignored by list");
            continue;
        }

        if (cur_data.getChild("UI_stats") != null) {

            var paramMaxBuyAmount = 0;
            var paramRepairCost = 0;
            var elementMmoStats = cur_data.getChild("mmo_stats");
            if (elementMmoStats != null) {

                var elementParamMaxBuyAmount = elementMmoStats.getChildByAttr("name", "max_buy_amount");
                if (elementParamMaxBuyAmount != null) {
                    paramMaxBuyAmount = Number(elementParamMaxBuyAmount.attrs.value);
                }

                var elementParamRepairCost = elementMmoStats.getChildByAttr("name", "repair_cost");
                if (elementParamRepairCost != null) {
                    paramRepairCost = Number(elementParamRepairCost.attrs.value);
                }

            }
            var itemBaseObject = { id: cur_item_id, name: cur_data.attrs.name, locked: 0, max_buy_amount: paramMaxBuyAmount, repair_cost: paramRepairCost };

            var pathSplited = items_paths[cur_item].split("/");
            if (pathSplited[pathSplited.length - 2].toLowerCase() == "shopitems" || pathSplited[pathSplited.length - 2].toLowerCase() == "keyitems") {
                itemBaseObject.isShopItem = true;
                itemBaseObject.itemType = cur_data.attrs.type;
                if (itemBaseObject.itemType == "random_box") {
                    itemBaseObject.randomInfo = getRandomBoxInfo(cur_data);
                }
                if (itemBaseObject.itemType == "bundle") {
                    itemBaseObject.bundleInfo = getBundleInfo(cur_data);
                }
                if (itemBaseObject.itemType == "booster") {
                    itemBaseObject.boosterInfo = getBoosterInfo(cur_data);
                }
                if (itemBaseObject.itemType == "meta_game") {
                    itemBaseObject.metagameInfo = getMetaGameInfo(cur_data);
                }
            }

            resultData.push(itemBaseObject);
            cur_item_id++;
        }
    }
}
fs.writeFileSync("./cache_json/items.json", JSON.stringify({ hash: Math.round(new Date().getTime() / 1000), data: resultData }), "utf8");

function getBundleInfo(bundleItem) {
    var bundleItemsArr = [];

    var elementsItem = bundleItem.getChild("bundle").getChildren("item");
    for (var i = 0; i < elementsItem.length; i++) {
        var itemInfo = elementsItem[i].attrs;

        var itemName = itemInfo.name;
        if (itemName == null) {
            console.log("[CreateCacheItems]:Bundle 0 is not have attribute 'name' in group:" + g + " item:" + i);
            throw "";
        }

        var itemQuantity = Number(itemInfo.amount);
        if (Number.isNaN(itemQuantity) == true) {
            itemQuantity = 0;
        }

        var itemExpirationTime = itemInfo.expiration;
        if (itemExpirationTime != null && itemExpirationTime != "" && itemExpirationTime != "0") {
            var timeUnit = itemExpirationTime[itemExpirationTime.length - 1];
            var timeCount = itemExpirationTime.slice(0, -1);
            switch (timeUnit) {
                case "d":
                    itemExpirationTime = timeCount + " day";
                    break;
                case "h":
                    itemExpirationTime = timeCount + " hour";
                    break;
                case "m":
                    itemExpirationTime = timeCount + " month";
                    break;
                default:
                    console.log("[CreateCacheItems]:Bundle '" + itemName + "' group:" + g + " item:" + i + " timeUnit: '" + timeUnit + "' is unknown!");
                    throw "";
            }

        } else {
            itemExpirationTime = "";
        }

        var durabilityPoints = 0;
        if (itemQuantity == 0 && itemExpirationTime == "" && itemName.indexOf("_fbs_") == -1) {
            durabilityPoints = 36000;
        }

        bundleItemsArr.push({ name: itemName, quantity: itemQuantity, expirationTime: itemExpirationTime, durabilityPoints: durabilityPoints });
    }

    return bundleItemsArr;
}

function getRandomBoxInfo(randomItem) {
    var randomboxGroupsInfo = [];
    var elementGroups = randomItem.getChild("random_box").getChildren("group");

    for (var g = 0; g < elementGroups.length; g++) {
        var groupInfo = { items: [], totalWeight: 0 };

        var elementItems = elementGroups[g].getChildren("item");
        for (var i = 0; i < elementItems.length; i++) {
            var itemInfo = elementItems[i].attrs;

            var itemName = itemInfo.name;
            if (itemName == null) {
                console.log("[CreateCacheItems]:Randombox '" + "Name" + "' is not have attribute 'name' in group:" + g + " item:" + i);
                throw "";
            }

            var itemWeight = Number(itemInfo.weight);
            if (Number.isNaN(itemWeight) == true) {
                console.log("[CreateCacheItems]:Randombox '" + "Name" + "' is not have attribute 'weight' in group:" + g + " item:" + i);
                throw "";
            }

            var itemQuantity = Number(itemInfo.amount);
            if (Number.isNaN(itemQuantity) == true) {
                itemQuantity = 0;
            }

            var itemExpirationTime = itemInfo.expiration;
            if (itemExpirationTime != null && itemExpirationTime != "" && itemExpirationTime != "0") {
                var timeUnit = itemExpirationTime[itemExpirationTime.length - 1];
                var timeCount = itemExpirationTime.slice(0, -1);
                switch (timeUnit) {
                    case "d":
                        itemExpirationTime = timeCount + " day";
                        break;
                    case "h":
                        itemExpirationTime = timeCount + " hour";
                        break;
                    case "m":
                        itemExpirationTime = timeCount + " month";
                        break;
                    default:
                        console.log("[CreateCacheItems]:Randombox '" + "Name" + "' group:" + g + " item:" + i + " timeUnit: '" + timeUnit + "' is unknown!");
                        throw "";
                }

            } else {
                itemExpirationTime = "";
            }

            var durabilityPoints = 0;
            if (itemQuantity == 0 && itemExpirationTime == "" && itemName.indexOf("_fbs_") == -1) {
                durabilityPoints = 36000;
            }

            groupInfo.items.push({ name: itemInfo.name, weight: itemWeight, quantity: itemQuantity, expirationTime: itemExpirationTime, durabilityPoints: durabilityPoints });

            groupInfo.totalWeight = groupInfo.totalWeight + itemWeight;
        }
        randomboxGroupsInfo.push(groupInfo);
    }
    return randomboxGroupsInfo;
}

function getBoosterInfo(boosterItem) {

    var boosterInfoObject = { vpBoost: 0, gmBoost: 0, xpBoost: 0, zbBoost: 0 };

    var elementGameParams = boosterItem.getChild("GameParams");
    if (elementGameParams) {

        var elementVpBoost = elementGameParams.getChildByAttr("name", "vpBoost")
        if (elementVpBoost) {
            boosterInfoObject.vpBoost = Number(elementVpBoost.attrs.value);
        }

        var elementGmBoost = elementGameParams.getChildByAttr("name", "gmBoost")
        if (elementGmBoost) {
            boosterInfoObject.gmBoost = Number(elementGmBoost.attrs.value);
        }

        var elementXpBoost = elementGameParams.getChildByAttr("name", "xpBoost")
        if (elementXpBoost) {
            boosterInfoObject.xpBoost = Number(elementXpBoost.attrs.value);
        }

        var elementZbBoost = elementGameParams.getChildByAttr("name", "zbBoost")
        if (elementZbBoost) {
            boosterInfoObject.zbBoost = Number(elementZbBoost.attrs.value);
        }
    }

    return boosterInfoObject;
}

function getMetaGameInfo(metagameItem) {

    var metagameInfoArr = [];

    var elementMetagameStats = metagameItem.getChild("metagame_stats");
    if (!elementMetagameStats) {
        console.log("[CreateCacheItems]:MetaGame " + metagameItem.attrs.name + " failed to get child metagame_stats");
        throw "";
    }

    var elementsOnActivate = elementMetagameStats.getChildren("on_activate");
    if (!elementsOnActivate.length) {
        console.log("[Warning][CreateCacheItems]:MetaGame " + metagameItem.attrs.name + " not found childs on_activate in metagame_stats");
    }

    for (var i = 0; i < elementsOnActivate.length; i++) {

        var metagameInfoObject = {};

        var elementOnActivate = elementsOnActivate[i];

        var attrUnlockAchievement = Number(elementOnActivate.attrs.unlock_achievement);
        var attrAction = elementOnActivate.attrs.action;

        if (!Number.isNaN(attrUnlockAchievement)) {
            metagameInfoObject.unlock_achievement = attrUnlockAchievement;
        }

        if (attrAction) {
            metagameInfoObject.action = attrAction;
        }

        metagameInfoArr.push(metagameInfoObject);
    }

    return metagameInfoArr;
}