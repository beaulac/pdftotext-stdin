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
            pdf2TxtProc.stderr.on('data', e => _debug('pdftotext [stderr]', e));
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

function _promiseRead(rs) {
    let onData, onErr;

    return new Promise(
        (resolve, reject) => {
            // Called only once every time? todo verify this
            rs.once('data', onData = data => {
                _debug('FIFO Got Data');
                return resolve(data);
            });

            rs.once('error', onErr = (err) => {
                _debug('FIFO Read Error');
                return reject(err);
            });
        }
    ).finally(() => {
        rs.removeListener('data', onData);
        rs.removeListener('error', onErr);
    });
}

function _runExtraction(pdfStream,
                        {
                            pipePath,
                            outputStream = namedPipes.createDisposableFifoReadStream(pipePath)
                        },
                        pdf2TxtArgs) {
    return Promise.using(
        outputStream,
        pipeRs => Promise.join(
            _promiseRead(pipeRs),
            execPdfToText(pdfStream, pdf2TxtArgs),
            x => x
        )
    );
}

function extractTextFromPdfStream(pdfStream, options = {}) {
    const {
        outputPath = namedPipes.makeTmpFifo(),
        outputStream
    } = options;

    const pdf2TxtArgs = parseOptions(options);

    return Promise.using(
        outputPath,
        (pipePath) => _runExtraction(pdfStream, { pipePath, outputStream }, [...pdf2TxtArgs, pipePath])
    );
}

module.exports = { extractTextFromPdfStream };
