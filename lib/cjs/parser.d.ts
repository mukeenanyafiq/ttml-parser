/**
 * Parse a time string to seconds
 * @param time time string in format "mm:ss.xx" or "hh:mm:ss.xx"
 * @returns time in seconds, otherwise failed, itself
 */
export declare function parseTime(time: string): number | any;
/**
 * Format seconds to time string "mm:ss.xxx"
 * @param seconds Float seconds
 * @returns `mm:ss.xxx` based formatted time string
 */
export declare function formatTime(seconds: number): string;
/**
 * Turns a DOM Node Element into a JSON object
 * @param element
 */
export declare function elementToJson(element: Element): Record<string, any>;
