const fs = require("fs");
const ltx = require("ltx");

global.cacheJson = {};
global.cacheJsonQuickAccess = {};

exports.load = function () {
    //console.log("[CacheJson]:Loading...");
    loadItems();
    //console.log("[CacheJson]:Success");
}

function loadItems(){
    
    console.log("[CacheJson]:Loading Items");

    var cacheData = JSON.parse(fs.readFileSync("./cache_json/items.json"));

    global.cacheJson.items = cacheData;

    global.cacheJsonQuickAccess.items = { name: {} };
    global.cacheJsonQuickAccess.shopSpecialItems = { name: {} };
    for (var i = 0; cacheData.data.length > i; i++) {
        global.cacheJsonQuickAccess.items.name[cacheData.data[i].name] = cacheData.data[i];
        if (cacheData.data[i].isShopItem == true) {
            global.cacheJsonQuickAccess.shopSpecialItems.name[cacheData.data[i].name] = cacheData.data[i];
        }
    }    
}