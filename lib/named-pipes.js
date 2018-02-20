'use strict';
const _debug = require('debug')('pdftotext-stdin');
const Promise = require('bluebird');
const spawn = require('child_process').spawn;
const path = require('path');
const tmpdir = require('os').tmpdir();
const fs = Promise.promisifyAll(require('fs'));
const C = fs.constants;
const { Socket } = require('net');

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

function createDisposableFifoReadStream(pipePath) {
    _debug('Creating FIFO read socket');
    // VERY important to open with O_NONBLOCK else process will hang until something is written to the pipe.
    return fs.openAsync(pipePath, C.O_RDONLY | C.O_NONBLOCK)
             .then(pipeFd => new Socket({
                                            fd: pipeFd,
                                            encoding: 'utf8',
                                            readable: true,
                                            writable: false
                                        }))
             .disposer(pipeSock => {
                 _debug('Closing FIFO read socket');
                 pipeSock.destroy();
             });
}


module.exports = { mkfifoAsync, createDisposableFifoReadStream };
