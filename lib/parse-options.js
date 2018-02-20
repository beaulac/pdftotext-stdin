'use strict';
// Inspired by/partly lifted from https://github.com/nisaacson/pdf-text-extract

function _parseLayout(layout = 'layout') {
    switch (layout) {
    case 'layout':
    case 'raw':
    case 'htmlmeta':
        return `-${layout}`;
    default:
        throw Error('Invalid layout ' + layout);
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

function parseOptions(options = {}) {
    options.splitPages = (options.splitPages !== false);

// Build args based on options
    const args = [];

// First and last page to convert
    if ('firstPage' in options) {
        args.push('-f', options.firstPage);
    }
    if ('lastPage' in options) {
        args.push('-l', options.lastPage);
    }

// Resolution, in dpi. (null is pdftotext default = 72)
    if (options.resolution) {
        args.push('-r');
        args.push(options.resolution);
    }

    args.push(..._parseCrop(options.crop));

    args.push(_parseLayout(options.layout));

// Output text encoding (UCS-2, ASCII7, Latin1, UTF-8, ZapfDingbats or Symbol)
    args.push('-enc', options.encoding || 'UTF-8');

// Output end of line convention (unix, dos or mac)
    if (options.eol) {
        args.push('-eol', options.eol);
    }

// Owner and User password (for encrypted files)
    if ('ownerPassword' in options) {
        args.push('-opw', options.ownerPassword);
    }
    if ('userPassword' in options) {
        args.push('-upw', options.userPassword);
    }

    return args;
}

module.exports = { parseOptions };