'use strict';
const fs = require('fs');
const path = require('path');

const extractor = require('..');

const rs = fs.createReadStream(path.resolve(__dirname, 'pdf-test.pdf'));

extractor.extractTextFromPdfStream(rs)
         .then(console.log)
         .catch(console.error);
