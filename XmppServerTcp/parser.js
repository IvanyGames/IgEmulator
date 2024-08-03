var Element = require('./element.js');

module.exports = function () {
    
    var parserState = 0;
    var parserTextData = "";
    var parserElementName = "";
    var parserElementAttributes = {};
    var parserElementType = 0;
    var parserElementAttributeName = "";
    var parserElementAttributeValue = "";

    this.onStreamStart;
    this.onStanza;
    this.onError;
    this.onStreamEnd;

	this.onStartElement = function (name, attrs) {

		//console.log("parser.onStartElement " + name);
		//console.log(attrs);

		if (!this.element && (name === 'stream:stream')) {
			this.onStreamStart(name, attrs);
		} else {
			if (!this.element) {
				this.element = new Element(name, attrs)
			} else {
				this.element = this.element.cnode(new Element(name, attrs))
			}
		}
	}

	this.onEndElement = function (name, attrs) {

		//console.log("parser.onEndElement " + name);
		//console.log(attrs);

		if (!this.element && (name === 'stream:stream')) {
			this.onStreamEnd();
		} else if (this.element && (name === this.element.name)) {
			if (this.element.parent) {
				this.element = this.element.parent
			} else {
				this.onStanza(this.element) // FIXME deprecate
				delete this.element
			}
		} else {
			this.onError(1);
		}
	}

	this.onText = function (text) {

		//console.log("parser.onText " + text);

		if (this.element) this.element.t(text)
	}

    this.write = function (data) {

        data = data.toString();

        for (var i = 0; i < data.length; i++) {

            var parserChar = data[i];

            if (parserState == 0) {

                if (parserChar == "<") {

                    if (parserTextData) {
                        this.onText(parserTextData);
                        parserTextData = "";
                    }

                    parserState = 1;
                    continue;
                }

                parserTextData += parserChar;

            } else if (parserState == 1) {

                if (parserChar == " " || parserChar == "\t") {
                    parserState = 2;
                    continue;
                }

                if (parserChar == "/") {

                    if (parserElementName == "") {
                        parserElementType = 1;
                    } else {
                        parserElementType = 2;
                    }

                    continue;
                }

                if (parserChar == ">") {

                    if (parserElementType == 0) {
                        this.onStartElement(parserElementName, parserElementAttributes);
                    } else if (parserElementType == 1) {
                        this.onEndElement(parserElementName, parserElementAttributes);
                    } else if (parserElementType == 2) {
                        this.onStartElement(parserElementName, parserElementAttributes);
                        this.onEndElement(parserElementName, parserElementAttributes);
                    }

                    parserElementType = 0;
                    parserElementName = "";
                    parserElementAttributes = {};
                    parserState = 0;
                    continue;

                }

                if (parserChar == "?") {
                    parserState = 5;
                    continue;
                }

                parserElementName += parserChar;

            } else if (parserState == 2) {

                if (parserChar == "=") {
                    parserState = 3;
                    continue;
                }

                parserElementAttributeName += parserChar;

            } else if (parserState == 3) {

                if (parserChar == "'" || parserChar == '"') {
                    parserState = 4;
                    continue;
                }

            } else if (parserState == 4) {

                if (parserChar == "'" || parserChar == '"') {
                    parserElementAttributes[parserElementAttributeName] = parserElementAttributeValue;
                    parserElementAttributeName = "";
                    parserElementAttributeValue = "";
                    parserState = 1;
                    continue;
                }

                parserElementAttributeValue += parserChar;

            } else if (parserState == 5) {

                if (parserChar == ">") {
                    parserState = 0;
                    continue;
                }

            }
        }
    }
}