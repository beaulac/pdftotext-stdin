'use strict';
const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');

const extractor = require('..');

function runSuite(testFile) {
    console.log(`Running ${testFile}`);

    async function test(testFile) {
        const rs = fs.createReadStream(path.resolve(__dirname, testFile));

        return await extractor.extractTextFromPdfStream(rs);
    }

    const result = test(testFile)
    // .then(console.log)
        .then(() => console.log(`${testFile} test OK`))
        .catch((err) => console.error('FAILED', err));


    async function testLayout(testFile) {
        const rs = fs.createReadStream(path.resolve(__dirname, testFile));

        return await extractor.extractTextFromPdfStream(rs, { layout: 'bbox-layout' });
    }

    const layoutResult = testLayout(testFile)
    // .then(console.log)
        .then(() => console.log(`${testFile} testLayout OK`))
        .catch((err) => console.error('FAILED', err));

    return Promise.join(
        result,
        layoutResult
    );
}

Promise.map(
    [
        'large-pdf-test.pdf',
        'pdf-test.pdf'
    ],
    runSuite
);
