/*

'use strict'

var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var LtxParser = require('ltx/lib/parsers/ltx')
var Element = require('ltx').Element

function StreamParser(options) {
	EventEmitter.call(this)
	var self = this

	this.parser = new LtxParser()

	this.parsedStanzaSise = 0;
	this.stateIgnoreHeader = false;
	this.isFirstPacket = true;

	this.parser.on('startElement', function (name, attrs) {

		if (!self.element && (name === 'stream:stream')) {
			self.parsedStanzaSise = 0;
			self.emit('streamStart', attrs)
		} else {
			if (!self.element) {
				self.element = new Element(name, attrs)
			} else {
				self.element = self.element.cnode(new Element(name, attrs))
			}
		}
	})

	this.parser.on('endElement', function (name) {

		if (!self.element && (name === 'stream:stream')) {
			//self.end()
			self.emit('streamEnd')
		} else if (self.element && (name === self.element.name)) {
			if (self.element.parent) {
				self.element = self.element.parent
			} else {
				self.parsedStanzaSise = 0;
				self.emit('stanza', self.element) // FIXME deprecate
				delete self.element
			}
		} else {
			self.emit('error', 1)
		}
	})

	this.parser.on('text', function (str) {
		if (self.element) self.element.t(str)
	})
}

inherits(StreamParser, EventEmitter)
*/
/*
StreamParser.prototype.write = function (data) {
	
	if (this.isFirstPacket && data[0] != 60 && data[0] != 173) {
		this.emit('error', 1);
		return;
	}

	this.isFirstPacket = false;

	try {
		this.parser.write(data.toString('utf8'));
	} catch (err) {
		this.emit('error', 1);
	}
}
*/

/*
StreamParser.prototype.write = function (data) {

	if (this.isFirstPacket && data[0] != 60 && data[0] != 173) {
		this.emit('error', 1);
		return;
	}

	this.isFirstPacket = false;

	data = data.toString('utf8')

	for (var i = 0; i < data.length; i++) {

		//Игнорирование xml заголовка
		if (i + 4 < data.length && data[i] == "<" && data[i + 1] == "?" && data[i + 2] == "x" && data[i + 3] == "m" && data[i + 4] == "l") {
			//console.log("[Parser]:XmlHeader Begin");
			i = i + 4;
			this.stateIgnoreHeader = true;
		}

		if (this.stateIgnoreHeader == true) {
			if (i + 1 < data.length && data[i] == "?" && data[i + 1] == ">") {
				//console.log("[Parser]:XmlHeader End");
				i = i + 1;
				this.stateIgnoreHeader = false;
			}
			continue;
		}

		//console.log("[Parser]:Stanza size:"+this.parsedStanzaSise);
		if (this.parsedStanzaSise + 1 > 65536) {
			this.emit('error', 2)
			break;
		}
		try {
			this.parser.write(data[i])
		} catch (err) {
			this.emit('error', 1);
		}
		this.parsedStanzaSise++;
	}


}
*/

/*
StreamParser.prototype.end = function (data) {
  if (data) {
	this.write(data)
  }
  // Get GC'ed 
  delete this.parser
  this.emit('end')
}
*/

//module.exports = StreamParser

//Main

'use strict'

var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var LtxParser = require('ltx/lib/parsers/ltx')
var Element = require('ltx').Element

function StreamParser(options) {
	EventEmitter.call(this)
	var self = this

	this.parser = new LtxParser()

	this.parsedStanzaSise = 0;
	this.stateIgnoreHeader = false;
	this.isFirstPacket = true;

	this.parser.on('startElement', function (name, attrs) {

		if (!self.element && (name === 'stream:stream')) {
			self.parsedStanzaSise = 0;
			self.emit('streamStart', attrs)
		} else {
			if (!self.element) {
				self.element = new Element(name, attrs)
			} else {
				self.element = self.element.cnode(new Element(name, attrs))
			}
		}
	})

	this.parser.on('endElement', function (name) {

		if (!self.element && (name === 'stream:stream')) {
			//self.end()
			self.emit('streamEnd')
		} else if (self.element && (name === self.element.name)) {
			if (self.element.parent) {
				self.element = self.element.parent
			} else {
				self.parsedStanzaSise = 0;
				self.emit('stanza', self.element) // FIXME deprecate
				delete self.element
			}
		} else {
			self.emit('error', 1)
		}
	})

	this.parser.on('text', function (str) {
		if (self.element) self.element.t(str)
	})
}

inherits(StreamParser, EventEmitter)


StreamParser.prototype.write = function (data) {
	
	if (this.isFirstPacket && data[0] != 60 && data[0] != 173) {
		this.emit('error', 1);
		return;
	}	
	
	this.isFirstPacket = false;
	
	try {
		this.parser.write(data.toString('utf8'));
	} catch (err) {
		this.emit('error', 1);
	}
}

/*
StreamParser.prototype.write = function (data) {

	if (this.isFirstPacket && data[0] != 60 && data[0] != 173) {
		this.emit('error', 1);
		return;
	}

	data = data.toString('utf8')

	for (var i = 0; i < data.length; i++) {

		//Игнорирование xml заголовка
		if (i + 4 < data.length && data[i] == "<" && data[i + 1] == "?" && data[i + 2] == "x" && data[i + 3] == "m" && data[i + 4] == "l") {
			//console.log("[Parser]:XmlHeader Begin");
			i = i + 4;
			this.stateIgnoreHeader = true;
		}

		if (this.stateIgnoreHeader == true) {
			if (i + 1 < data.length && data[i] == "?" && data[i + 1] == ">") {
				//console.log("[Parser]:XmlHeader End");
				i = i + 1;
				this.stateIgnoreHeader = false;
			}
			continue;
		}

		//console.log("[Parser]:Stanza size:"+this.parsedStanzaSise);
		if (this.parsedStanzaSise + 1 > 65536) {
			this.emit('error', 2)
			break;
		}
		try {
			this.parser.write(data[i])
		} catch (err) {
			this.emit('error', 1);
		}
		this.parsedStanzaSise++;
	}


}
*/

/*
StreamParser.prototype.end = function (data) {
  if (data) {
	this.write(data)
  }
  // Get GC'ed 
  delete this.parser
  this.emit('end')
}
*/

module.exports = StreamParser
