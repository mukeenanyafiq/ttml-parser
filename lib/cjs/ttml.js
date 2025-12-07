"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTML = exports.TTMLWordType = exports.TTMLLineType = void 0;
var xmldom_1 = require("@xmldom/xmldom");
var parser_1 = require("./parser");
var TTMLLineType;
(function (TTMLLineType) {
    /** Normal lyric line, placed as left-to-right `ttm:agent v1` */
    TTMLLineType["LINE"] = "LINE";
    /** Duet lyric line, for another singer, placed as right-to-left `ttm:agent v2` */
    TTMLLineType["DUET"] = "DUET";
})(TTMLLineType || (exports.TTMLLineType = TTMLLineType = {}));
var TTMLWordType;
(function (TTMLWordType) {
    /** Normal word synced line, nothing too special */
    TTMLWordType["WORD"] = "WORD";
    /** Background word synced line, small and placed on the bottom of the lyric line `ttm:role x-bg` */
    TTMLWordType["BACKGROUND"] = "BACKGROUND";
})(TTMLWordType || (exports.TTMLWordType = TTMLWordType = {}));
/**
 * `TTML` (Timed Text Markup Language) is an `XML` based format to
 * create timed text tracks, mostly for subtitled video content
 * and lyrics for music or audio content.
 */
var TTML = /** @class */ (function () {
    function TTML() {
        /** Containing information for TTML verification */
        this.metadata = {};
        /** Duration of the TTML */
        this.dur = 0;
        /** Applied offset time of the TTML */
        this.offset = 0;
        /** Contents of the TTML */
        this.contents = [];
        /** Raw TTML string */
        this.raw = '';
    }
    /**
     * Parse a TTML string into a TTML object
     * @param ttml TTML string input
     */
    TTML.parse = function (ttml) {
        var e_1, _a, e_2, _b, e_3, _c, e_4, _d;
        var _e;
        var dom = new xmldom_1.DOMParser().parseFromString(ttml, 'text/xml');
        var ttmlJson = (0, parser_1.elementToJson)(dom.documentElement);
        // writeFileSync('./domtest.json', JSON.stringify(dom, null, 4))
        var ttmlObj = new this();
        ttmlObj.raw = ttml;
        // Top-level metadata
        ttmlObj.metadata.lang = ttmlJson['_xml:lang'];
        ttmlObj.metadata.timing = ttmlJson['_itunes:timing'];
        var head = ttmlJson.head; // For metadata
        var body = ttmlJson.body; // For contents
        // [head] Check for metadata (agents, localizations, etc.)
        if (head && head.metadata) {
            // Common metadata
            var metadata = head.metadata;
            // Get agents (performers)
            if (metadata['ttm:agent']) {
                var agents = Array.isArray(metadata['ttm:agent']) ? metadata['ttm:agent'] : [metadata['ttm:agent']];
                ttmlObj.metadata.agents = [];
                try {
                    for (var agents_1 = __values(agents), agents_1_1 = agents_1.next(); !agents_1_1.done; agents_1_1 = agents_1.next()) {
                        var agent = agents_1_1.value;
                        var id = agent['_xml:id'];
                        var type = agent['_type'];
                        var name_1 = (_e = agent['_ttm:name']) === null || _e === void 0 ? void 0 : _e.__text;
                        ttmlObj.metadata.agents.push({ id: id, type: type, name: name_1 });
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (agents_1_1 && !agents_1_1.done && (_a = agents_1.return)) _a.call(agents_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            // iTunes specific metadata - leading silence, translations, songwriters, transliterations
            var itunes = metadata.iTunesMetadata;
            if (itunes) {
                // leading silence
                ttmlObj.metadata.leadingSilence = itunes['_leadingSilence'] ? (0, parser_1.parseTime)(itunes['_leadingSilence']) : 0;
                // translations
                if (itunes.translations && itunes.translations.translation) {
                    ttmlObj.metadata.translations = [];
                    var translations = Array.isArray(itunes.translations.translation) ? itunes.translations.translation : [itunes.translations.translation];
                    var _loop_1 = function (translation) {
                        var transObj = {
                            type: translation['_type'],
                            lang: translation['_xml:lang'],
                            content: []
                        };
                        if (translation.text) {
                            translation.text.forEach(function (textItem) {
                                transObj.content.push({
                                    for: textItem['_for'],
                                    text: textItem.__text,
                                });
                            });
                        }
                        ttmlObj.metadata.translations.push(transObj);
                    };
                    try {
                        for (var translations_1 = __values(translations), translations_1_1 = translations_1.next(); !translations_1_1.done; translations_1_1 = translations_1.next()) {
                            var translation = translations_1_1.value;
                            _loop_1(translation);
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (translations_1_1 && !translations_1_1.done && (_b = translations_1.return)) _b.call(translations_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
                // songwriters
                if (itunes.songwriters && itunes.songwriters.songwriter) {
                    ttmlObj.metadata.songwriters = [];
                    var songwriters = Array.isArray(itunes.songwriters.songwriter) ? itunes.songwriters.songwriter : [itunes.songwriters.songwriter];
                    try {
                        for (var songwriters_1 = __values(songwriters), songwriters_1_1 = songwriters_1.next(); !songwriters_1_1.done; songwriters_1_1 = songwriters_1.next()) {
                            var songwriter = songwriters_1_1.value;
                            ttmlObj.metadata.songwriters.push(songwriter.__text);
                        }
                    }
                    catch (e_3_1) { e_3 = { error: e_3_1 }; }
                    finally {
                        try {
                            if (songwriters_1_1 && !songwriters_1_1.done && (_c = songwriters_1.return)) _c.call(songwriters_1);
                        }
                        finally { if (e_3) throw e_3.error; }
                    }
                }
                // transliterations
                if (itunes.transliterations && itunes.transliterations.transliteration) {
                    ttmlObj.metadata.transliterations = [];
                    var transliterations = Array.isArray(itunes.transliterations.transliteration) ? itunes.transliterations.transliteration : [itunes.transliterations.transliteration];
                    var _loop_2 = function (transliteration) {
                        var transObj = {
                            lang: transliteration['_xml:lang'],
                            content: []
                        };
                        if (transliteration.text) {
                            transliteration.text.forEach(function (textItem) {
                                transObj.content.push({
                                    for: textItem['_for'],
                                    text: textItem.__text,
                                });
                            });
                        }
                        ttmlObj.metadata.transliterations.push(transObj);
                    };
                    try {
                        for (var transliterations_1 = __values(transliterations), transliterations_1_1 = transliterations_1.next(); !transliterations_1_1.done; transliterations_1_1 = transliterations_1.next()) {
                            var transliteration = transliterations_1_1.value;
                            _loop_2(transliteration);
                        }
                    }
                    catch (e_4_1) { e_4 = { error: e_4_1 }; }
                    finally {
                        try {
                            if (transliterations_1_1 && !transliterations_1_1.done && (_d = transliterations_1.return)) _d.call(transliterations_1);
                        }
                        finally { if (e_4) throw e_4.error; }
                    }
                }
            }
        }
        // [body] Parse contents
        if (body) {
            // get duration
            ttmlObj.dur = body['_dur'] ? (0, parser_1.parseTime)(body['_dur']) : 0;
            // get lyrics
            if (body.div) {
                var div_1 = dom.getElementsByTagName('div');
                // content
                body.div.forEach(function (lyric, index) {
                    var lyricObj = {
                        songPart: lyric['_itunes:songPart'],
                        begin: (0, parser_1.parseTime)(lyric['_begin']) || 0,
                        end: (0, parser_1.parseTime)(lyric['_end']) || 0,
                        lines: [],
                    };
                    lyricObj.dur = lyricObj.end - lyricObj.begin;
                    // content lines
                    if (lyric.p) {
                        var serializer_1 = new xmldom_1.XMLSerializer();
                        var pArray = Array.isArray(lyric.p) ? lyric.p : [lyric.p];
                        var pDom_1 = div_1[index].getElementsByTagName('p');
                        pArray.forEach(function (line, lineIndex) {
                            var lineObj = {
                                key: line['_itunes:key'],
                                agent: line['_ttm:agent'],
                                begin: (0, parser_1.parseTime)(line['_begin']) || 0,
                                end: (0, parser_1.parseTime)(line['_end']) || 0,
                            };
                            lineObj.dur = lyricObj.end - lyricObj.begin;
                            lineObj.content = line.span ? [] : (line.__text || '').trim();
                            lineObj.joinedContent = lineObj.content;
                            // content lines words
                            if (Array.isArray(lineObj.content)) {
                                var origLine_1 = serializer_1.serializeToString(pDom_1[lineIndex]).split(/<[^>]*>/g);
                                if (origLine_1.length > 1) {
                                    origLine_1.splice(0, 2);
                                    for (var i = 0; i < origLine_1.length; i++) {
                                        if (i > 0 && origLine_1[i].trim() == '') {
                                            var text = origLine_1[i];
                                            origLine_1[i - 1] += text;
                                            origLine_1.splice(i, 1);
                                        }
                                    }
                                }
                                lineObj.joinedContent = origLine_1.join('');
                                var spanArray = Array.isArray(line.span) ? line.span : [line.span];
                                spanArray.forEach(function (word, wordIndex) {
                                    // content lines background words (god damn)
                                    if (word['_ttm:role'] == 'x-bg' && word.span) {
                                        var bgSpanArray = Array.isArray(word.span) ? word.span : [word.span];
                                        bgSpanArray.forEach(function (bgWord, bgIndex) {
                                            var bgWordObj = {
                                                type: TTMLWordType.BACKGROUND,
                                                text: origLine_1[wordIndex + bgIndex + 1],
                                                begin: (0, parser_1.parseTime)(bgWord['_begin']) || 0,
                                                end: (0, parser_1.parseTime)(bgWord['_end']) || 0,
                                            };
                                            bgWordObj.dur = bgWordObj.end - bgWordObj.begin;
                                            lineObj.content.push(bgWordObj);
                                        });
                                    }
                                    else {
                                        var wordObj = {
                                            type: TTMLWordType.WORD,
                                            text: origLine_1[wordIndex],
                                            begin: (0, parser_1.parseTime)(word['_begin']) || 0,
                                            end: (0, parser_1.parseTime)(word['_end']) || 0,
                                        };
                                        wordObj.dur = wordObj.end - wordObj.begin;
                                        lineObj.content.push(wordObj);
                                    }
                                });
                            }
                            lyricObj.lines.push(lineObj);
                        });
                    }
                    ttmlObj.contents.push(lyricObj);
                });
            }
        }
        return ttmlObj;
    };
    /**
     * (iTunes) Find a line by its specified key
     * @param key iTunes key string
     */
    TTML.prototype.getLineByKey = function (key) {
        var e_5, _a, e_6, _b;
        try {
            for (var _c = __values(this.contents), _d = _c.next(); !_d.done; _d = _c.next()) {
                var content = _d.value;
                try {
                    for (var _e = (e_6 = void 0, __values(content.lines)), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var line = _f.value;
                        if (line.key == key) {
                            return line;
                        }
                    }
                }
                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_6) throw e_6.error; }
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return null;
    };
    /**
     * Gets all lines performed by the agent
     * @param agentId Identifier of the performing agent
     */
    TTML.prototype.getLinesByAgent = function (agentId) {
        var e_7, _a, e_8, _b;
        var contents = [];
        try {
            for (var _c = __values(this.contents), _d = _c.next(); !_d.done; _d = _c.next()) {
                var content = _d.value;
                try {
                    for (var _e = (e_8 = void 0, __values(content.lines)), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var line = _f.value;
                        if (line.agent == agentId) {
                            contents.push(line);
                        }
                    }
                }
                catch (e_8_1) { e_8 = { error: e_8_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_8) throw e_8.error; }
                }
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_7) throw e_7.error; }
        }
        return contents;
    };
    /**
     * Gets all lines within a specified time range
     * @param begin Beginning time in seconds
     * @param end Ending time in seconds
     */
    TTML.prototype.getLinesByTimeRange = function (begin, end) {
        var e_9, _a, e_10, _b;
        var contents = [];
        try {
            for (var _c = __values(this.contents), _d = _c.next(); !_d.done; _d = _c.next()) {
                var content = _d.value;
                try {
                    for (var _e = (e_10 = void 0, __values(content.lines)), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var line = _f.value;
                        if (line.begin >= begin && line.end <= end) {
                            contents.push(line);
                        }
                    }
                }
                catch (e_10_1) { e_10 = { error: e_10_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_10) throw e_10.error; }
                }
            }
        }
        catch (e_9_1) { e_9 = { error: e_9_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_9) throw e_9.error; }
        }
        return contents;
    };
    /**
     * (iTunes) Gets the transliteration for a lyric line
     * @param lang Localization of the transliteration
     * @param key iTunes key string
     */
    TTML.prototype.getLineTransliteration = function (lang, key) {
        var e_11, _a, e_12, _b;
        if (!this.metadata.transliterations) {
            return null;
        }
        try {
            for (var _c = __values(this.metadata.transliterations), _d = _c.next(); !_d.done; _d = _c.next()) {
                var transliteration = _d.value;
                if (transliteration.lang != lang) {
                    continue;
                }
                try {
                    for (var _e = (e_12 = void 0, __values(transliteration.content)), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var keys = _f.value;
                        if (keys.for == key) {
                            return keys.text;
                        }
                    }
                }
                catch (e_12_1) { e_12 = { error: e_12_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_12) throw e_12.error; }
                }
            }
        }
        catch (e_11_1) { e_11 = { error: e_11_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_11) throw e_11.error; }
        }
        return null;
    };
    /**
     * (iTunes) Gets all contents belonging to a specific song part
     * @param part Song part name
     */
    TTML.prototype.getContentsBySongPart = function (part) {
        var e_13, _a;
        var contents = [];
        try {
            for (var _b = __values(this.contents), _c = _b.next(); !_c.done; _c = _b.next()) {
                var content = _c.value;
                if (content.songPart == part) {
                    contents.push(content);
                }
            }
        }
        catch (e_13_1) { e_13 = { error: e_13_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_13) throw e_13.error; }
        }
        return contents;
    };
    /**
     * Gets all contents within a specified time range
     * @param begin Beginning time in seconds
     * @param end Ending time in seconds
     */
    TTML.prototype.getContentsByTimeRange = function (begin, end) {
        var e_14, _a;
        var contents = [];
        try {
            for (var _b = __values(this.contents), _c = _b.next(); !_c.done; _c = _b.next()) {
                var content = _c.value;
                if (content.begin >= begin && content.end <= end) {
                    contents.push(content);
                }
            }
        }
        catch (e_14_1) { e_14 = { error: e_14_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_14) throw e_14.error; }
        }
        return contents;
    };
    /**
     * Apply offset time to each timestamp
     * @param timeOffset Number of seconds
     */
    TTML.prototype.setOffset = function (timeOffset) {
        this.offset += timeOffset;
        this.contents.forEach(function (content) {
            content.begin += timeOffset;
            content.end += timeOffset;
            content.lines.forEach(function (line) {
                line.begin += timeOffset;
                line.end += timeOffset;
                if (Array.isArray(line.content)) {
                    line.content.forEach(function (word) {
                        word.begin += timeOffset;
                        word.end += timeOffset;
                    });
                }
            });
        });
    };
    /**
     * Convert TTML object into an LRC string
     * - Some metadata will be lost
     * - Only taking the line of every content - content begin and end time will be ignored
     * - All lyric line with different agent will be treated as a normal line
     * - Background word will be merged at the end of the line
     * @param enhanced (default: `false`) Whether to return enhanced LRC with word-level timestamps
     */
    TTML.prototype.toLRC = function (enhanced) {
        if (enhanced === void 0) { enhanced = false; }
        var lrcBuilt = '';
        this.contents.forEach(function (content) {
            content.lines.forEach(function (line) {
                lrcBuilt += "[".concat((0, parser_1.formatTime)(line.begin), "] ");
                if (enhanced) {
                    if (Array.isArray(line.content)) {
                        var lineStr_1 = '';
                        var wordEnd_1 = 0;
                        line.content.forEach(function (word) {
                            if (word.type != TTMLWordType.WORD) {
                                return;
                            }
                            lineStr_1 += "<".concat((0, parser_1.formatTime)(word.begin), "> ").concat(word.text, " ");
                            wordEnd_1 = word.end;
                        });
                        // Append background words at the end
                        line.content.forEach(function (word) {
                            if (word.type != TTMLWordType.BACKGROUND) {
                                return;
                            }
                            lineStr_1 += "<".concat((0, parser_1.formatTime)(word.begin), "> ").concat(word.text, " ");
                            wordEnd_1 = word.end;
                        });
                        lrcBuilt += "".concat(lineStr_1);
                        lrcBuilt += "<".concat((0, parser_1.formatTime)(wordEnd_1), "> ");
                        lrcBuilt += "\n";
                    }
                    else {
                        lrcBuilt += "".concat(line.content, "\n");
                    }
                }
                else {
                    lrcBuilt += "".concat(line.joinedContent, "\n");
                }
            });
        });
        lrcBuilt += "[".concat((0, parser_1.formatTime)(this.contents[this.contents.length - 1].end), "] ");
        return lrcBuilt;
    };
    return TTML;
}());
exports.TTML = TTML;
//# sourceMappingURL=ttml.js.map