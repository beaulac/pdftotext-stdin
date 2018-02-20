'use strict';
const _debug = require('debug')('pdftotext-stdin');
const Promise = require('bluebird');
const spawn = require('child_process').spawn;
const path = require('path');
const tmpdir = require('os').tmpdir();
const fs = Promise.promisifyAll(require('fs'));

const makeTmpPipePath = () => path.resolve(tmpdir, `${Date.now()}${Math.random().toString(36).slice(2)}`);

function mkfifoAsync() {
    const pipePath = makeTmpPipePath();

    const mkfifoPromise = new Promise(
        (resolve, reject) => {
            const mkfifoProcess = spawn('mkfifo', [pipePath]);
            mkfifoProcess.on('exit', function (code) {
                if (code === 0) {
                    _debug(`FIFO created: ${pipePath}`);
                    resolve(pipePath);
                } else {
                    reject(Error(`mkfifo failed with code: ${code}`));
                }
            });
        }
    );

    return mkfifoPromise.disposer(
        fifoPath => fs.unlinkAsync(fifoPath)
                      .tap(() => _debug(`rm ${fifoPath}`))
    );
}

module.exports = { mkfifoAsync };
