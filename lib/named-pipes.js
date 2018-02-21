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

    return new Promise(
        (resolve, reject) => {
            const mkfifoProcess = spawn('mkfifo', [pipePath]);

            mkfifoProcess.once('exit', code => {
                if (code === 0) {
                    _debug(`FIFO created: ${pipePath}`);
                    resolve(pipePath);
                } else {
                    reject(Error(`mkfifo failed with code: ${code}`));
                }
            });
        }
    );
}

function makeTmpFifo() {
    return mkfifoAsync().disposer(
        fifoPath => fs.unlinkAsync(fifoPath)
                      .tap(() => _debug(`rm ${fifoPath}`))
    );
}

function createFifoSocket(pipePath) {
    // VERY important to open with O_NONBLOCK else process will hang until something is written to the pipe.
    return fs.openAsync(pipePath, C.O_RDONLY | C.O_NONBLOCK)
             .then(pipeFd => {
                 const fifoReadSocket = new Socket({
                                                       fd: pipeFd,
                                                       encoding: 'utf8',
                                                       readable: true,
                                                       writable: true
                                                   });

                 fifoReadSocket.once('close', () => {
                     _debug('FIFO Read Socket Closed', pipeFd);
                 });

                 return fifoReadSocket;
             });
}

function createDisposableFifoReadStream(pipePath) {
    _debug(`Creating FIFO read socket ${pipePath}`);
    return createFifoSocket(pipePath).disposer(pipeSock => {
        _debug('Closing FIFO read socket');
        pipeSock.destroy();
    });
}


module.exports = { mkfifoAsync, makeTmpFifo, createFifoSocket, createDisposableFifoReadStream };
