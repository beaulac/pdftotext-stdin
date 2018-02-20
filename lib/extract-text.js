'use strict';
const _debug = require('debug')('pdftotext-stdin');
const Promise = require('bluebird');
const spawn = require('child_process').spawn;
const { parseOptions } = require('./parse-options');
const _mkfifoAsync = require('./named-pipe').mkfifoAsync;
const fs = Promise.promisifyAll(require('fs'));

const pipe = require('pump');

function execPdfToText(pdfStream, command, args) {
    return new Promise(
        (resolve, reject) => {
            _debug('Spawning ', command, args.join(' '));
            const pdf2TxtProc = spawn(command, args);

            let errStr = '';
            pdf2TxtProc.stderr.setEncoding('utf8');
            pdf2TxtProc.stderr.on('data', d => console.error(d));

            pipe(pdfStream, pdf2TxtProc.stdin, err => {
                if (err) {
                    _debug('PIPE ERR!', err);
                    reject(err);
                }
            });

            pdf2TxtProc.on('close', code => code === 0 ? resolve() : reject(errStr));
        }
    );
}

function extractTextFromPdfStream(pdfStream, options = {}) {
    const {
        command = 'pdftotext',
        outputPath = _mkfifoAsync()
    } = options;

    const pdf2TxtArgs = parseOptions(options);

    return Promise.using(
        outputPath,
        (pipePath) => {
            // Read from stdin, output to FIFO (pdftotext doesn't want to be a duplex :c)
            pdf2TxtArgs.push('-', pipePath);

            _debug('Creating FIFO read stream');
            const pipeRs = fs.createReadStream(pipePath, 'utf8');
            const streamPromise = new Promise(
                (resolve, reject) => {
                    let output = '';
                    pipeRs.on('data', data => output += data);

                    pipeRs.on('close', () => resolve(output));
                    pipeRs.on('error', (err) => reject(err));
                }
            ).finally(() => pipeRs.close());

            return Promise.join(
                streamPromise,
                execPdfToText(pdfStream, command, pdf2TxtArgs),
                x => x
            );
        }
    );
}

module.exports = { extractTextFromPdfStream };
