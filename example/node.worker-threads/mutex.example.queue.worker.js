/**
 * DO NOT RUN THIS FILE DIRECTLY
 * THIS IS PART OF THE mutex.example.js
 * 
 * This file should not run as main thread
 */
const { parentPort, threadId, MessagePort } = require('worker_threads');
const { NotifiedValue, Mutex, SyncedValue } = require('web-mutex');
const { writeSync, readSync, openSync, closeSync, unlinkSync } = require('fs');
const myFd = openSync('./queue.txt', 'w+');

const log = require('./threadLogger');
/**
 * @type {number}
 */
let fileDescriptor;
/**
 * @type {SyncedValue}
 */
let currentQueueByteSize;
/**
 * @type {Mutex}
 */
let queueMutex;


/**
 * 
 * @param {SharedArrayBuffer} shm 
 * @param {MessagePort} port 
 */
function init(shm, port) {
    const shmArr = new Int32Array(shm);
    fileDescriptor = myFd;
    queueMutex = new Mutex(new NotifiedValue(shmArr, 1));
    currentQueueByteSize = new SyncedValue(shmArr, 2);
    port.on('message', produce);
}

/**
 * 
 * @param {string} str 
 */
function padEnd(str) {
    return str.padEnd(ROW_LENGTH - 1, '#') + '\n';
}

function writeAt(offset, str) {
    writeSync(fileDescriptor, str, offset);
    currentQueueByteSize.increment(str.length);
}

function pushForward(fromOffset) {
    const tempFile = openSync(`./${threadId}.tmp`, "w+");
    const currentSize = currentQueueByteSize.load();
    let totalByte = 0;
    const currentBuff = Buffer.alloc(500);
    for (let i = fromOffset; i < currentSize; i += currentBuff.byteLength) {
        const r = readSync(fileDescriptor, currentBuff, 0, currentBuff.byteLength, i);
        writeSync(tempFile, currentBuff, 0, r, totalByte);
        totalByte += r;
        if (r < currentBuff.byteLength) {
            break;
        }
    }
    writeSync(fileDescriptor, padEnd(''), fromOffset);

    // copy the rest
    let position = 0;
    while (true) {
        const r = readSync(tempFile, currentBuff, 0, currentBuff.byteLength, position);
        writeSync(fileDescriptor, currentBuff, 0, r, fromOffset + ROW_LENGTH + position);
        position += r;
        if (r < currentBuff.byteLength) {
            break;
        }
    }
    closeSync(tempFile);
    unlinkSync(`./${threadId}.tmp`);
}
/**
 * 
 * @param {object} msg
 * @param {number} msg.priority
 * @param {string} msg.task 
 */
function produce({ priority, task }) {
    log(`Got produce, will lock! with priority=${priority}`);
    queueMutex.lock();
    try {
        const currentSize = currentQueueByteSize.load();
        const taskStr = `${priority},${task}`;
        if (currentSize === 0) {
            writeAt(0, padEnd(taskStr));
            return;
        }
        const buff = Buffer.alloc(ROW_LENGTH);
        for (let i = 0; i < currentSize; i += ROW_LENGTH) {
            const read = readSync(fileDescriptor, buff, 0, ROW_LENGTH, i);
            if (read === 0) {
                log('Will produce at position 0');
                writeAt(currentSize, padEnd(taskStr));
                return;
            }
            const asStr = buff.toString('utf8', 0, read);
            const currentRowPriority = Number(asStr.match(/^(\d+)/)[1]);
            // same priority, or we meet the first higher priorty than this task
            // insert current task BEFORE so older task will be executed first
            if (currentRowPriority === priority || currentRowPriority > priority) {
                log(`will produce at position ${i / ROW_LENGTH}`);
                pushForward(i);
                writeAt(i, padEnd(taskStr));
                return;
            }
        }
        log(`Will product at the end of the queue`);
        writeAt(currentSize, padEnd(taskStr));
    } finally {
        queueMutex.unlock();
        log('Did unlock');
    }

}
parentPort.on("message", ({ shm, port }) => init(shm, port));