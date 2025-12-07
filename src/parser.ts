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