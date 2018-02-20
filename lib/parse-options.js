'use strict';
// Inspired by/partly lifted from https://github.com/nisaacson/pdf-text-extract

const defaultEncoding = 'UTF-8';
const propArgMap = {
    firstPage: 'f', // First and last page to convert
    lastPage: 'l',
    resolution: 'r', // Resolution, in dpi. (null is pdftotext default = 72)
    encoding: 'enc', // Output text encoding (UCS-2, ASCII7, Latin1, UTF-8, ZapfDingbats or Symbol)
    eol: 'eol', // Output end of line convention (unix, dos or mac)
    ownerPassword: 'opw', // Owner and User password (for encrypted files)
    userPassword: 'upw'
};

function _parseArgs(options) {
    options.encoding = options.encoding || defaultEncoding;
    return Object.keys(propArgMap).reduce(
        (acc, k) => (k in options) ? [...acc, `-${propArgMap[k]}`, options[k]] : acc,
        []
    );
}

function _parseLayout(layout = 'layout') {
    switch (layout) {
    case 'layout':
    case 'raw':
    case 'htmlmeta':
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
