'use strict';
const extractor = require('./lib/extract-text');
const namedPipes = require('./lib/named-pipes');

module.exports = {
    extractTextFromPdfStream: extractor.extractTextFromPdfStream,
    pipes: namedPipes
};
