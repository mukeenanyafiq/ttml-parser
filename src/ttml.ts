import * as xmljs from 'xml-js';
import * as fs from 'fs';
import { parseTime } from './parser';
import { Dom } from 'dom-parser';

export enum TTMLLineType {
    /** Normal lyric line, placed as left-to-right `ttm:agent v1` */
    LINE = 'LINE',
    /** Duet lyric line, for another singer, placed as right-to-left `ttm:agent v2` */
    DUET = 'DUET',
}

export enum TTMLWordType {
    /** Normal word synced line, nothing too special */
    WORD = 'WORD',
    /** Background word synced line, small and placed on the bottom of the lyric line `ttm:role x-bg` */
    BACKGROUND = 'BACKGROUND',
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

export interface TTMLMetadataTranslation extends TTMLMetadataTrans { type?: string; }

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
    translations?: TTMLMetadataTranslation;
    /** (iTunes specified) Transliterations - How you would sing or say a word of the original TTML localization in a mouthful way */
    transliterations?: TTMLMetadataTrans;
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
export class TTML {
    /** Containing information for TTML verification */
    metadata: TTMLMetadata = {};
    /** Duration of the TTML */
    dur: number = 0;
    /** Contents of the TTML */
    contents: TTMLContent[] = [];
    /** Raw TTML string */
    raw: string = '';

    /**
     * Parse a TTML string into a TTML object
     * @param ttml TTML string input
     */
    static parse(ttml: string): TTML {
        let ttmlJson: any = xmljs.xml2js(ttml, { compact: true });
        if (!ttmlJson.tt) { throw new Error('Invalid TTML format: Missing <tt> root element.'); }
        ttmlJson = ttmlJson.tt;

        let ttmlObj = new this();
        ttmlObj.raw = ttml;
        
        // Top-level metadata
        if (ttmlJson._attributes) {
            ttmlObj.metadata.lang = ttmlJson._attributes['xml:lang'];
            ttmlObj.metadata.timing = ttmlJson._attributes['itunes:timing'];
        }

        const head = ttmlJson.head; // For metadata
        const body = ttmlJson.body; // For contents
        
        // [head] Check for metadata (agents, localizations, etc.)
        if (head && head.metadata) {
            // Common metadata
            const metadata = head.metadata;

            // Get agents (performers)
            if (metadata['ttm:agent']) {
                const agents = Array.isArray(metadata['ttm:agent']) ? metadata['ttm:agent'] : [metadata['ttm:agent']];
                ttmlObj.metadata.agents = [] as TTMLMetadataAgent[];
                for (const agent of agents) {
                    const id = agent._attributes?.['xml:id'];
                    const type = agent._attributes?.type;
                    const name = agent['ttm:name']?._text;
                    ttmlObj.metadata.agents.push({ id, type, name });
                }
            }

            // iTunes specific metadata - leading silence, translations, songwriters, transliterations
            const itunes = metadata.iTunesMetadata;
            if (itunes) {
                // leading silence
                ttmlObj.metadata.leadingSilence = itunes._attributes?.leadingSilence ? parseTime(itunes._attributes.leadingSilence) : 0;

                // translations
                if (itunes.translations && itunes.translations.translation) {
                    ttmlObj.metadata.translations = {} as TTMLMetadataTranslation;
                    const translations = Array.isArray(itunes.translations.translation) ? itunes.translations.translation : [itunes.translations.translation];
                    for (const translation of translations) {
                        const type = translation._attributes?.type;
                        const lang = translation._attributes?.lang;
                        const content = [];

                    }
                }

                // songwriters
                if (itunes.songwriters && itunes.songwriters.songwriter) {
                    ttmlObj.metadata.songwriters = [] as string[];
                    const songwriters = Array.isArray(itunes.songwriters.songwriter) ? itunes.songwriters.songwriter : [itunes.songwriters.songwriter];
                    for (const songwriter of songwriters) {
                        ttmlObj.metadata.songwriters.push(songwriter._text);
                    }
                }

                // transliterations
                if (itunes.transliterations && itunes.transliterations.transliteration) {
                    ttmlObj.metadata.transliterations = {} as TTMLMetadataTrans;
                    const transliterations = Array.isArray(itunes.transliterations.transliteration) ? itunes.transliterations.transliteration : [itunes.transliterations.transliteration];
                    for (const transliteration of transliterations) {
                        ttmlObj.metadata.transliterations.lang = transliteration._attributes?.['xml:lang'];
                        if (transliteration.text) {
                            ttmlObj.metadata.transliterations.content = [] as TTMLMetadataTransContent[];
                            transliteration.text.forEach((textItem: any) => {
                                ttmlObj.metadata.transliterations.content.push({
                                    for: textItem._attributes?.for,
                                    text: textItem._text,
                                })
                            })
                        }
                    }
                }
            }
        }

        // [body] Parse contents
        if (body) {
            // get duration
            ttmlObj.dur = body._attributes?.dur ? parseTime(body._attributes.dur) : 0;

            // get lyrics
            if (body.div) {
                const dom = new Dom(ttml).getElementsByTagName('div')

                // content
                body.div.forEach((lyric: any, index: number) => {
                    const lyricObj = {
                        songPart: lyric._attributes?.['itunes:songPart'],
                        begin: parseTime(lyric._attributes?.begin) || 0,
                        end: parseTime(lyric._attributes?.end) || 0,
                        lines: [],
                    } as TTMLContent;
                    lyricObj.dur = lyricObj.end - lyricObj.begin;

                    // content lines
                    if (lyric.p) {
                        const pArray = Array.isArray(lyric.p) ? lyric.p : [lyric.p];
                        const pDom = dom[index].getElementsByTagName('p');
                        
                        pArray.forEach((line: any, lineIndex: number) => {
                            const lineObj = {
                                key: line._attributes?.['itunes:key'],
                                agent: line._attributes?.['ttm:agent'],
                                begin: parseTime(line._attributes?.begin) || 0,
                                end: parseTime(line._attributes?.end) || 0,
                            } as TTMLContentLine;
                            lineObj.dur = lyricObj.end - lyricObj.begin;
                            lineObj.content = line.span ? [] as TTMLContentWord[] : (line._text || '').trim();
                            lineObj.joinedContent = lineObj.content as string;

                            // content lines words
                            if (Array.isArray(lineObj.content)) {
                                let origLine = pDom[lineIndex].innerHTML.split(/<[^>]*>/g)
                                if (origLine.length > 1) {
                                    origLine.shift();
                                    for (let i = 0; i < origLine.length; i++) {
                                        if (i > 0 && origLine[i].trim() == '') {
                                            const text = origLine[i]
                                            origLine[i-1] += text;
                                            origLine.splice(i, 1);
                                        }
                                    }
                                }

                                lineObj.joinedContent = origLine.join('');

                                const spanArray = Array.isArray(line.span) ? line.span : [line.span];
                                spanArray.forEach((word: any, wordIndex: number) => {
                                    // content lines background words (god damn)
                                    if (word._attributes['ttm:role'] == 'x-bg' && word.span) {
                                        const bgSpanArray = Array.isArray(word.span) ? word.span : [word.span];
                                        bgSpanArray.forEach((bgWord: any, bgIndex: number) => {
                                            const bgWordObj = {
                                                type: TTMLWordType.BACKGROUND,
                                                text: origLine[wordIndex + bgIndex + 1],
                                                begin: parseTime(bgWord._attributes?.begin) || 0,
                                                end: parseTime(bgWord._attributes?.end) || 0,
                                            } as TTMLContentWord;
                                            bgWordObj.dur = bgWordObj.end - bgWordObj.begin;

                                            (lineObj.content as TTMLContentWord[]).push(bgWordObj);
                                        })
                                    } else {
                                        const wordObj = {
                                            type: TTMLWordType.WORD,
                                            text: origLine[wordIndex],
                                            begin: parseTime(word._attributes?.begin) || 0,
                                            end: parseTime(word._attributes?.end) || 0,
                                        } as TTMLContentWord;
                                        wordObj.dur = wordObj.end - wordObj.begin;

                                        (lineObj.content as TTMLContentWord[]).push(wordObj);
                                    }
                                });
                            }

                            lyricObj.lines.push(lineObj)
                        });
                    }

                    ttmlObj.contents.push(lyricObj);
                });
            }
        }

        console.log(ttmlObj.getLineByITunesKey('L4'))
        return ttmlObj;
    }

    /**
     * Find a line by its specified iTunes key
     * @param key iTunes key string
     */
    getLineByITunesKey(key: string): TTMLContentLine | null {
        for (const content of this.contents) {
            for (const line of content.lines) {
                if (line.key == key) { return line; }
            }
        }
        return null;
    }

    /**
     * Get all lines performed by the agent
     * @param agentId Identifier of the performing agent
     */
    getLinesByAgent(agentId: string): TTMLContentLine[] {
        const contents = [] as TTMLContentLine[];
        for (const content of this.contents) {
            for (const line of content.lines) {
                if (line.agent == agentId) { contents.push(line); }
            }
        }
        return contents;
    }

    /**
     * Get all contents belonging to a specified iTunes song part
     * @param part Song part name
     */
    getContentsBySongPart(part: string): TTMLContent[] {
        const contents = [] as TTMLContent[];
        for (const content of this.contents) {
            if (content.songPart == part) { contents.push(content); }
        }
        return contents;
    }

    /**
     * Apply offset time to each timestamp 
     * @param timeOffset Number of seconds
     */
    offset(timeOffset: number) {

    }

    /**
     * Convert TTML object into an LRC string
     * - Some metadata will be lost
     * - All lyric line with different agent will be treated as a normal line
     * - Background word will be merged at the end of the line
     * @param enhanced (default: `false`) Whether to output enhanced LRC with word-level timestamps
     */
    toLRC(enhanced = false): string {
        let lrcBuilt = '';
        return lrcBuilt;
    }
}