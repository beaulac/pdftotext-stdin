'use strict';
const _debug = require('debug')('pdftotext-stdin');
const Promise = require('bluebird');
const spawn = require('child_process').spawn;
const path = require('path');
const tmpdir = require('os').tmpdir();
const fs = Promise.promisifyAll(require('fs'));
const C = fs.constants;

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
    _debug('Creating FIFO read stream');

    // VERY important to open with O_NONBLOCK else process will hang until something is written to the pipe.
    // Only other options (?) is to use the hacky-close below.
    const pipeRs = fs.createReadStream(pipePath, { encoding: 'utf8', flags: C.O_RDONLY | C.O_NONBLOCK  });

    return Promise.resolve(pipeRs)
                  .disposer(rs => {
                      _debug('Closing FIFO read stream');
                      rs.close();

                      // Hacky close (not used in favor of O_NONBLOCK):
                      // const c = fs.createWriteStream(pipePath, { flags: C.O_WRONLY | C.O_NONBLOCK });
                      // c.write('\0');
                      // c.close();
                      // rs.pause();
                      // rs.close();
                  });
}


module.exports = { mkfifoAsync, createDisposableFifoReadStream };
