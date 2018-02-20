'use strict';
const _debug = require('debug')('pdftotext-stdin');
const Promise = require('bluebird');
const spawn = require('child_process').spawn;
const { parseOptions } = require('./parse-options');
const namedPipes = require('./named-pipes');
const pipe = require('pump');


const pdf2TxtCmd = 'pdftotext';

function execPdfToText(pdfStream, args) {
    return new Promise(
        (resolve, reject) => {
            _debug('Spawning ', pdf2TxtCmd, args.join(' '));
            const pdf2TxtProc = spawn(pdf2TxtCmd, args);

            let errStr = '';
            pdf2TxtProc.stderr.setEncoding('utf8');
            pdf2TxtProc.stderr.on('data', d => console.error(d));
            pdf2TxtProc.on('close', code => {
                _debug(pdf2TxtCmd, 'exited with code', code);
                if (code === 0) {
                    return resolve();
                } else {
                    return reject(errStr);
                }
            });

            pipe(pdfStream, pdf2TxtProc.stdin, err => {
                if (err) {
                    _debug('PIPE ERR!', err);
                    reject(err);
                }
            });
        }
    );
}

function _runExtraction(pdfStream,
                        {
                            pipePath,
                            outputStream = namedPipes.createDisposableFifoReadStream(pipePath)
                        },
                        pdf2TxtArgs) {
    return Promise.using(
        outputStream,
        pipeRs => {
            const streamPromise = new Promise(
                (resolve, reject) => {
                    let output = '';
                    pipeRs.on('data', data => {
                        _debug('FIFO Got Data');
                        // Called only once every time? todo verify this
                        return resolve(output += data);
                    });
                    pipeRs.once('close', () => {
                        _debug('FIFO Closed');
                        return resolve(output);
                    });
                    pipeRs.once('error', (err) => {
                        _debug('FIFO Read Error');
                        return reject(err);
                    });
                }
            );

            return Promise.join(
                streamPromise,
                execPdfToText(pdfStream, pdf2TxtArgs),
                x => x
            );
        }
    );
}

function extractTextFromPdfStream(pdfStream, options = {}) {
    const {
        outputPath = namedPipes.mkfifoAsync(),
        outputStream
    } = options;

    const pdf2TxtArgs = parseOptions(options);

    return Promise.using(
        outputPath,
        (pipePath) => _runExtraction(pdfStream, { pipePath, outputStream }, [...pdf2TxtArgs, pipePath])
    );
}

module.exports = { extractTextFromPdfStream };
