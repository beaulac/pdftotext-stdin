'use strict';
const fs = require('fs');
const path = require('path');

const extractor = require('..');

async function test() {
    const rs = fs.createReadStream(path.resolve(__dirname, 'pdf-test.pdf'));

    return await extractor.extractTextFromPdfStream(rs);
}

test().then(console.log).catch((err) => console.error('FAILED', err));
