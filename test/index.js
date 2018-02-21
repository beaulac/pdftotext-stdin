'use strict';
const fs = require('fs');
const path = require('path');

const extractor = require('..');

async function test() {
    const rs = fs.createReadStream(path.resolve(__dirname, 'pdf-test.pdf'));

    return await extractor.extractTextFromPdfStream(rs);
}

test()
    // .then(console.log)
    .then(() => console.log('test OK'))
    .catch((err) => console.error('FAILED', err));


async function testLayout() {
    const rs = fs.createReadStream(path.resolve(__dirname, 'pdf-test.pdf'));

    return await extractor.extractTextFromPdfStream(rs, { layout: 'bbox-layout' });
}

testLayout()
    // .then(console.log)
    .then(() => console.log('testLayout OK'))
    .catch((err) => console.error('FAILED', err));
