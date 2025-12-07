export declare enum TTMLLineType {
    /** Normal lyric line, placed as left-to-right `ttm:agent v1` */
    LINE = "LINE",
    /** Duet lyric line, for another singer, placed as right-to-left `ttm:agent v2` */
    DUET = "DUET"
}
export declare enum TTMLWordType {
    /** Normal word synced line, nothing too special */
    WORD = "WORD",
    /** Background word synced line, small and placed on the bottom of the lyric line `ttm:role x-bg` */
    BACKGROUND = "BACKGROUND"
}
export interface TTMLMetadataAgent {
    type: string;
    id: string;
    name?: string;
}
export interface TTMLMetadataTransContent {
    /** Location to place the transliteration/translation */
    for: string;
    /** The content */
    text: string;
}
export interface TTMLMetadataTrans {
    lang?: string;
    content?: TTMLMetadataTransContent[];
}
export interface TTMLMetadataTranslation extends TTMLMetadataTrans {
    type?: string;
}
export interface TTMLMetadata {
    /** TTML original localization */
    lang?: string;
    /** Agents that performed a specific part of the content */
    agents?: TTMLMetadataAgent[];
    /** (iTunes specified) TTML Lyric timing: `None` | `Line` | `Word` */
    timing?: string;
    /** (iTunes specified) Leading silence duration of the intro */
    leadingSilence?: number;
    /** (iTunes specified) Songwriters of the track */
    songwriters?: string[];
    /** (iTunes specified) Translations - Other language and way of singing the music */
    translations?: TTMLMetadataTranslation[];
    /** (iTunes specified) Transliterations - How you would sing or say a word of the original TTML localization in a mouthful way */
    transliterations?: TTMLMetadataTrans[];
}
export interface TTMLTimestamp {
    /** A timestamp beginning of the part */
    begin: number;
    /** A timestamp duration of the part pre-calculated */
    dur: number;
    /** A timestamp ending of the part */
    end: number;
}
export interface TTMLContentWord extends TTMLTimestamp {
    /** Line word type */
    type: TTMLWordType;
    /** The word */
    text: string;
}
export interface TTMLContentLine extends TTMLTimestamp {
    /** Agent performing the line */
    agent?: string;
    /** The content for the current line, could be normal text or array of timed text */
    content: TTMLContentWord[] | string;
    /** A stringified version of `content` element, whether it's a normal text or an array of timed text */
    joinedContent?: string;
    /** (iTunes specified) Identifier for the current lyric line useful for translations and transliterations */
    key?: string;
}
export interface TTMLContent extends TTMLTimestamp {
    /** Lines included in this section */
    lines: TTMLContentLine[];
    /** (iTunes specified) Lyric song part */
    songPart?: string;
}
/**
 * `TTML` (Timed Text Markup Language) is an `XML` based format to
 * create timed text tracks, mostly for subtitled video content
 * and lyrics for music or audio content.
 */
export declare class TTML {
    /** Containing information for TTML verification */
    metadata: TTMLMetadata;
    /** Duration of the TTML */
    dur: number;
    /** Applied offset time of the TTML */
    offset: number;
    /** Contents of the TTML */
    contents: TTMLContent[];
    /** Raw TTML string */
    raw: string;
    /**
     * Parse a TTML string into a TTML object
     * @param ttml TTML string input
     */
    static parse(ttml: string): TTML;
    /**
     * (iTunes) Find a line by its specified key
     * @param key iTunes key string
     */
    getLineByKey(key: string): TTMLContentLine | null;
    /**
     * Gets all lines performed by the agent
     * @param agentId Identifier of the performing agent
     */
    getLinesByAgent(agentId: string): TTMLContentLine[];
    /**
     * Gets all lines within a specified time range
     * @param begin Beginning time in seconds
     * @param end Ending time in seconds
     */
    getLinesByTimeRange(begin: number, end: number): TTMLContentLine[];
    /**
     * (iTunes) Gets the transliteration for a lyric line
     * @param lang Localization of the transliteration
     * @param key iTunes key string
     */
    getLineTransliteration(lang: string, key: string): string | null;
    /**
     * (iTunes) Gets all contents belonging to a specific song part
     * @param part Song part name
     */
    getContentsBySongPart(part: string): TTMLContent[];
    /**
     * Gets all contents within a specified time range
     * @param begin Beginning time in seconds
     * @param end Ending time in seconds
     */
    getContentsByTimeRange(begin: number, end: number): TTMLContent[];
    /**
     * Apply offset time to each timestamp
     * @param timeOffset Number of seconds
     */
    setOffset(timeOffset: number): void;
    /**
     * Convert TTML object into an LRC string
     * - Some metadata will be lost
     * - Only taking the line of every content - content begin and end time will be ignored
     * - All lyric line with different agent will be treated as a normal line
     * - Background word will be merged at the end of the line
     * @param enhanced (default: `false`) Whether to return enhanced LRC with word-level timestamps
     */
    toLRC(enhanced?: boolean): string;
}
