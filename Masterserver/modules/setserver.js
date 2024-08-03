var ltxElement = require('ltx').Element
var scriptGameroom = require('../scripts/gameroom.js');

var allowedRegionIds = ["moscow", "petersburg", "krasnodar", "novosibirsk", "ekaterinburg", "vladivostok", "khabarovsk"];

exports.module = function (stanza) {

    var username = stanza.attrs.from.split("@")[0];

    if (username != "dedicated") {
        return;
    }

    var server = stanza.children[0].children[0].attrs.server;
    var host = stanza.children[0].children[0].attrs.host;
    var port = stanza.children[0].children[0].attrs.port;
    var node = stanza.children[0].children[0].attrs.node;
    var mission_key = stanza.children[0].children[0].attrs.mission_key;
    var status = stanza.children[0].children[0].attrs.status;
    var version = stanza.children[0].children[0].attrs.version;
    var mode = stanza.children[0].children[0].attrs.mode;
    var session_id = stanza.children[0].children[0].attrs.session_id;
    var cpu_usage = stanza.children[0].children[0].attrs.cpu_usage;
    var memory_usage = stanza.children[0].children[0].attrs.memory_usage;
    var load_average = stanza.children[0].children[0].attrs.load_average;
    var region_id = stanza.children[0].children[0].attrs.region_id;
    var master_server_resource = stanza.children[0].children[0].attrs.master_server_resource;
    var build_type = stanza.children[0].children[0].attrs.build_type;

    if (global.config.dedicated_hosts[host]) {
        host = global.config.dedicated_hosts[host];
    } else {
        console.log("[" + stanza.attrs.from + "][Setserver]:Host '" + host + "' is unknown");
    }

    if (allowedRegionIds.indexOf(region_id) == -1) {
        region_id = "petersburg";
    }

    global.dedicatedServersObject[stanza.attrs.from] = { server: server, host: host, port: port, node: node, mission_key: mission_key, status: status, version: version, mode: mode, session_id: session_id, cpu_usage: cpu_usage, memory_usage: memory_usage, load_average: load_average, region_id: region_id, master_server_resource: master_server_resource, build_type: build_type };

    global.xmppClient.response(stanza, new ltxElement('setserver', { master_node: node }));

    var roomObject = global.gamerooms[global.gamerooms.findIndex(function (x) { return x.dedicatedServerJid == stanza.attrs.from })];

    if (!roomObject) {
        return;
    }

    if (status == "1") {
        //roomObject.session.status = 1;
        //roomObject.session.revision++;
    } else if (status == "2") {
        //roomObject.session.status = 2;
        //roomObject.session.revision++;
    } else if (status == "3") {
        roomObject.session.status = 3;
        roomObject.session.revision++;
    } else if (status == "4") {
        scriptGameroom.endSession(roomObject);
    }
}