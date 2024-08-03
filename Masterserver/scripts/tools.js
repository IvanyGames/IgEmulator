var ltxElement = require('ltx').Element

exports.getLevelByExp = function (experience) {
	var result = 1;

	for (key in global.resources.tableExpCurve) {
		if (global.resources.tableExpCurve[key] <= experience) {
			result = Number(key);
		} else {
			break;
		}
	}

	return result;
}

exports.getExpByLevel = function (level) {
	var result = 0;

	for (key in global.resources.tableExpCurve) {
		if (Number(key) <= level) {
			result = global.resources.tableExpCurve[key];
		} else {
			break;
		}
	}
	return result;
}

exports.getHexStringFromString = function (string) {
	try {
		return (typeof Buffer.from === "function" ? Buffer.from(string, 'utf-8') : new Buffer(string, 'utf-8')).toString('hex');
	} catch (err) {
		return "";
	}
}

exports.getFlagByNumericArray = function (arrayNumeric) {
	var result = 0;
	for (var i = 0; i < arrayNumeric.length; i++) {
		result += (1 << arrayNumeric[i]);
	}
	return result;
}

exports.getEquipped = function (slotsValue) {

	var equipped = 0;
	v2 = 63;
	v3 = { m_slotForClass: [] };
	v4 = ((slotsValue & 0x40000000) != 0) + 5;
	v3.m_modified = 0;
	if (!(slotsValue & 0x40000000))
		v2 = 31;
	v3.m_slotForClass[0] = slotsValue & v2;
	v5 = slotsValue >> v4 >> v4;
	v3.m_slotForClass[1] = (slotsValue >> v4) & v2;
	v6 = v5 & v2;
	v7 = v5 >> v4;
	v3.m_slotForClass[2] = v6;
	v3.m_slotForClass[3] = v7 & v2;
	v3.m_slotForClass[4] = v2 & (v7 >> v4);

	for (var i = 0; i < v3.m_slotForClass.length; i++) {
		if (v3.m_slotForClass[i] != 0) {
			equipped += 1 << i;
		}
	}
	return equipped;
}

exports.getItemSlotArr = function (slot) {

	v2 = 63;
	v3 = { m_slotForClass: [] };
	v4 = ((slot & 0x40000000) != 0) + 5;
	v3.m_modified = 0;
	if (!(slot & 0x40000000))
		v2 = 31;
	v3.m_slotForClass[0] = slot & v2;
	v5 = slot >> v4 >> v4;
	v3.m_slotForClass[1] = (slot >> v4) & v2;
	v6 = v5 & v2;
	v7 = v5 >> v4;
	v3.m_slotForClass[2] = v6;
	v3.m_slotForClass[3] = v7 & v2;
	v3.m_slotForClass[4] = v2 & (v7 >> v4);

	return v3.m_slotForClass;
}

exports.getItemTypeFromSlotArr = function (slotArr) {

	for (var i = 0; i < slotArr.length; i++) {
		if (slotArr[i] != 0) {
			return slotArr[i];
		}
	}

	return 0;
}

exports.getItemClassFromSlotArr = function (slotArr) {

	for (var i = 0; i < slotArr.length; i++) {
		if (slotArr[i] != 0) {
			return i;
		}
	}

	return 0;
}

exports.getItemEquippedFromSlotArr = function (slotArr) {

	var equipped = 0;

	for (var i = 0; i < slotArr.length; i++) {
		if (slotArr[i] != 0) {
			equipped += 1 << i;
		}
	}

	return equipped;
}

exports.getItemSlotFromSlotArr = function (slotArr) {

	var result = 0;

	for (var i = 0; i < slotArr.length; i++) {
		result += Math.pow((1 << i), 5) * slotArr[i];
	}

	return result;
}