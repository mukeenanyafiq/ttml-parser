function padZero(value: number | string): string {
    const s = typeof value === 'number' ? String(value) : value;
    if (s.includes('.')) {
        const [intPart, fracPart] = s.split('.');
        const intPadded = intPart.length < 2 ? '0' + intPart : intPart;
        return `${intPadded}.${fracPart}`;
    }
    return s.length < 2 ? '0' + s : s;
}

/**
 * Parse a time string to seconds
 * @param time time string in format "mm:ss.xx" or "hh:mm:ss.xx"
 * @returns time in seconds, otherwise failed, itself
 */
export function parseTime(time: string): number | any {
    if (typeof JSON.stringify(time) !== 'string') { return time; }
    const parts = time.split(':').map(parseFloat);
    if (parts.length == 1) { return parts[0]; }
    else if (parts.length == 2) { return parts[0] * 60 + parts[1]; }
    else if (parts.length == 3) { return parts[0] * 3600 + parts[1] * 60 + parts[2]; }
    return 0;
}

/**
 * Format seconds to time string "mm:ss.xxx"
 * @param seconds Float seconds
 * @returns `mm:ss.xxx` based formatted time string
 */
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${padZero(mins)}:${padZero(secs)}`;
}

/**
 * Turns a DOM Node Element into a JSON object
 * @param element
 */
export function elementToJson(element: Element): Record<string, any> {
    const obj: Record<string, any> = {};

    // Handle element attributes
    if (element.attributes && element.attributes.length > 0) {
        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            const name = "_" + attr.name;
            obj[name] = attr.value;
        }
    }

    // Handle child nodes
    for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes[i];

        if (child.nodeType == 1) {
            // Element node
            const childElement = child as Element;
            const name = childElement.nodeName;

            const childObj = elementToJson(childElement);

            if (obj[name]) {
                // Already exists → convert to array
                if (!Array.isArray(obj[name])) {
                    obj[name] = [obj[name]];
                }
                obj[name].push(childObj);
            } else {
                obj[name] = childObj;
            }
        } else if (child.nodeType == 3) {
            // Text node
            const text = (child.nodeValue || "").trim();
            if (text) obj["__text"] = text;
        }
    }

    return obj;
}