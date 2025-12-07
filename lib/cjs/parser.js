"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTime = parseTime;
exports.formatTime = formatTime;
exports.elementToJson = elementToJson;
function padZero(value) {
    var s = typeof value === 'number' ? String(value) : value;
    if (s.includes('.')) {
        var _a = __read(s.split('.'), 2), intPart = _a[0], fracPart = _a[1];
        var intPadded = intPart.length < 2 ? '0' + intPart : intPart;
        return "".concat(intPadded, ".").concat(fracPart);
    }
    return s.length < 2 ? '0' + s : s;
}
/**
 * Parse a time string to seconds
 * @param time time string in format "mm:ss.xx" or "hh:mm:ss.xx"
 * @returns time in seconds, otherwise failed, itself
 */
function parseTime(time) {
    if (typeof JSON.stringify(time) !== 'string') {
        return time;
    }
    var parts = time.split(':').map(parseFloat);
    if (parts.length == 1) {
        return parts[0];
    }
    else if (parts.length == 2) {
        return parts[0] * 60 + parts[1];
    }
    else if (parts.length == 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
}
/**
 * Format seconds to time string "mm:ss.xxx"
 * @param seconds Float seconds
 * @returns `mm:ss.xxx` based formatted time string
 */
function formatTime(seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = (seconds % 60).toFixed(3);
    return "".concat(padZero(mins), ":").concat(padZero(secs));
}
/**
 * Turns a DOM Node Element into a JSON object
 * @param element
 */
function elementToJson(element) {
    var obj = {};
    // Handle element attributes
    if (element.attributes && element.attributes.length > 0) {
        for (var i = 0; i < element.attributes.length; i++) {
            var attr = element.attributes[i];
            var name_1 = "_" + attr.name;
            obj[name_1] = attr.value;
        }
    }
    // Handle child nodes
    for (var i = 0; i < element.childNodes.length; i++) {
        var child = element.childNodes[i];
        if (child.nodeType == 1) {
            // Element node
            var childElement = child;
            var name_2 = childElement.nodeName;
            var childObj = elementToJson(childElement);
            if (obj[name_2]) {
                // Already exists → convert to array
                if (!Array.isArray(obj[name_2])) {
                    obj[name_2] = [obj[name_2]];
                }
                obj[name_2].push(childObj);
            }
            else {
                obj[name_2] = childObj;
            }
        }
        else if (child.nodeType == 3) {
            // Text node
            var text = (child.nodeValue || "").trim();
            if (text)
                obj["__text"] = text;
        }
    }
    return obj;
}
//# sourceMappingURL=parser.js.map