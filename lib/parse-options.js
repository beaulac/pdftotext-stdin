'use strict';
// Inspired by/partly lifted from https://github.com/nisaacson/pdf-text-extract

const propArgMap = {
    firstPage: 'f', // First and last page to convert
    lastPage: 'l',
    resolution: 'r', // Resolution, in dpi. (null is pdftotext default = 72)
    encoding: 'enc', // Output text encoding (UCS-2, ASCII7, Latin1, UTF-8, ZapfDingbats or Symbol)
    eol: 'eol', // Output end of line convention (unix, dos or mac)
    ownerPassword: 'opw', // Owner and User password (for encrypted files)
    userPassword: 'upw',
    omitPageBreaks: 'nopgbrk', // (boolean) Don't insert page break characters between pages.
    quiet: 'q' // (boolean) Don't print any messages or errors.
};

function _parseArgs(options) {
    const _optToArg = k => {
        const key = propArgMap[k]
            , value = options[k];
        switch (typeof value) {
        case 'number':
        case 'string':
            return [`-${key}`, value];
        case 'boolean':
            return value ? [`-${key}`] : [];
        }
    };
    return Object.keys(propArgMap).reduce(
        (acc, k) => (k in options) ? [...acc, ..._optToArg(k)] : acc,
        []
    );
}

function _parseLayout(layout = 'layout') {
    // Omitted 'fixed n' layout for now.
    switch (layout) {
    case 'layout':
    case 'raw':
    case 'htmlmeta':
    case 'bbox':
    case 'bbox-layout':
        return `-${layout}`;
    default:
        throw Error(`Invalid layout ${layout}`);
    }
}

// If defined, should be an object { x:x, y:y, w:w, h:h }
function _parseCrop(crop = {}) {
    return ['x', 'y', 'W', 'H'].reduce(
        (acc, k) => {
            const cropKey = k.toLowerCase();
            return (cropKey in crop)
                ? [...acc, `-${k}`, crop[cropKey]]
                : acc;
        },
        []
    );
}

/**
 * @param {object} options
 * @return {string[]}
 */
function parseOptions(options = {}) {
    return [
        ..._parseArgs(options),
        ..._parseCrop(options.crop),
        _parseLayout(options.layout),
        '-' // Read from stdin
    ];
}

module.exports = { parseOptions };
