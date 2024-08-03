const ltxElement = require('ltx').Element;
const zlib = require('zlib');

var id = 1;

exports.init = function (xmpp_client) {
	xmpp_client.CompressedSend = function (data) {
		var query = data.children[0].children[0];
		if (query.name != "data") {
			var query_xml = String(query);
			var query_size = Buffer.byteLength(query_xml, 'utf8');
			//console.log("[Compression]:Query size:"+query_size);
			if (query_size > 1000) {
				//query.attrs = {};
				query.attrs.query_name = query.name;
				query.attrs.compressedData = zlib.deflateSync(query_xml).toString('base64');
				query.attrs.originalSize = query_size;
				query.name = "data";
				query.children = [];
			}
		}
		xmpp_client.send(String(data));
	}

	xmpp_client.responseError = function (stanza, error) {
		var elemntIq = new ltxElement("iq", { from: global.config.masterserver.username + "@" + global.config.masterserver.domain + "/" + global.startupParams.resource, to: stanza.attrs.from, "xml:lang": "en", id: stanza.attrs.id, type: "result" });
		elemntIq.c("query", { xmlns: "urn:cryonline:k01" }).c(stanza.children[0].children[0].name, stanza.children[0].children[0].attrs);
		//elemntIq.c('query', {xmlns: 'urn:cryonline:k01'}).children.push(stanza.children[0].children[0]);
		elemntIq.c("error", error).c("internal-server-error", { xmlns: "urn:ietf:params:xml:ns:xmpp-stanzas" }).up().c("text", { xmlns: "urn:ietf:params:xml:ns:xmpp-stanzas", "xml:lang": "en" }).t("Custom query error");
		xmpp_client.send(String(elemntIq));
		//xmpp_client.CompressedSend(elemntIq);
		//console.log("[ResponseErr]:"+elemntIq+"\n");	
	}

	xmpp_client.response = function (stanza, response) {
		//console.timeEnd("[QueryProfiler]["+stanza.children[0].children[0].name+"]["+stanza.attrs.id+"]");
		var elemntIq = new ltxElement("iq", { from: global.config.masterserver.username + "@" + global.config.masterserver.domain + "/" + global.startupParams.resource, to: stanza.attrs.from, "xml:lang": "en", id: stanza.attrs.id, type: "result" });
		var elemntQuery = elemntIq.c("query", { xmlns: "urn:cryonline:k01" });
		elemntQuery.children.push(response);
		xmpp_client.CompressedSend(elemntIq);
		//console.log("[Response]:"+p_to_send+"\n");
	}

	xmpp_client.request = function (jid, request, newid) {
		var elemntIq = new ltxElement("iq", { from: global.config.masterserver.username + "@" + global.config.masterserver.domain + "/" + global.startupParams.resource, to: jid, "xml:lang": "en", id: newid, type: "get" });
		var elemntQuery = elemntIq.c("query", { xmlns: "urn:cryonline:k01" });
		elemntQuery.children.push(request);
		xmpp_client.CompressedSend(elemntIq);
		if (!newid) {
			id++;
		}
		//console.log("[RequestTo]:"+p_to_send+"\n");
		return elemntIq.attrs.id;
	}
}