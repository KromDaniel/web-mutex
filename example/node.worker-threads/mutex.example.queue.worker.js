/**
 * DO NOT RUN THIS FILE DIRECTLY
 * THIS IS PART OF THE mutex.example.js
 * 
 * This file should not run as main thread
 */
const { parentPort, threadId, MessagePort, workerData } = require('worker_threads');
const { writeSync, readSync, openSync, closeSync, unlinkSync } = require('fs');

const { NotifiedValue, Mutex, SyncedValue } = require('../../');
const {
    OPEN_FILE_ONCE_MUTEX_IDX,
    OPEN_FILE_ONCE_SYNCED_FLAG_IDX,
    QUEUE_FILE_DESCRIPTOR_IDX,
    QUEUE_MUTEX_ID,
    QUEUE_BYTE_SIZE_IDX,
    ROW_LENGTH
} = require("./mutex.example.consts");
const log = require('./threadLogger');

/**
 * @type {Mutex}
 */
let openFileOnceMutex;

/**
 * @type {SyncedValue}
 */
let openFileOnceFlag;

/**
 * @type {SyncedValue}
 */
let queueFileDescriptor;

/**
 * @type {Mutex}
 */
let queueMutex;

/**
 * @type {SyncedValue}
 */
let queueByteSize;

/**
 * @param {Int32Array} sharedMemory
 * 
 * @description init both consumer
 * and product
 */
function initAllWorkers(sharedMemory){
    openFileOnceMutex = new Mutex(new NotifiedValue(sharedMemory, OPEN_FILE_ONCE_MUTEX_IDX));
    openFileOnceFlag = new SyncedValue(sharedMemory, OPEN_FILE_ONCE_SYNCED_FLAG_IDX);
    queueFileDescriptor = new SyncedValue(sharedMemory, QUEUE_FILE_DESCRIPTOR_IDX);
    queueMutex = new Mutex(new NotifiedValue(sharedMemory, QUEUE_MUTEX_ID));
    queueByteSize = new SyncedValue(sharedMemory, QUEUE_BYTE_SIZE_IDX);
    Mutex.once(openFileOnceMutex, openFileOnceFlag, (done) => {
        queueFileDescriptor.store(openSync('./queue.txt', 'w+'));
        done();
    });
}
/**
 * 
 * @param {SharedArrayBuffer} shm 
 * @param {MessagePort} port 
 */
function init(shm, port) {
    initAllWorkers(new Int32Array(shm));
    if(workerData === 'producer') {
        port.on('message', produce);
    }

    if(workerData === 'consumer') {
        
    }
}

/**
 * 
 * @param {string} str 
 */
function padEnd(str) {
    return str.padEnd(ROW_LENGTH - 1, '#') + '\n';
}

function writeAt(offset, str) {
    writeSync(queueFileDescriptor.load(), str, offset);
    queueByteSize.increment(str.length);
}

function pushForward(fromOffset) {
    const tempFile = openSync(`./${threadId}.tmp`, "w+");
    const currentSize = queueByteSize.load();
    let totalByte = 0;
    const currentBuff = Buffer.alloc(500);
    for (let i = fromOffset; i < currentSize; i += currentBuff.byteLength) {
        const r = readSync(queueFileDescriptor.load(), currentBuff, 0, currentBuff.byteLength, i);
        writeSync(tempFile, currentBuff, 0, r, totalByte);
        totalByte += r;
        if (r < currentBuff.byteLength) {
            break;
        }
    }
    writeSync(queueFileDescriptor.load(), padEnd(''), fromOffset);

    // copy the rest
    let position = 0;
    while (true) {
        const r = readSync(tempFile, currentBuff, 0, currentBuff.byteLength, position);
        writeSync(queueFileDescriptor.load(), currentBuff, 0, r, fromOffset + ROW_LENGTH + position);
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
        const currentSize = queueByteSize.load();
        const taskStr = `${priority},${task}`;
        if (currentSize === 0) {
            writeAt(0, padEnd(taskStr));
            return;
        }
        const buff = Buffer.alloc(ROW_LENGTH);
        for (let i = 0; i < currentSize; i += ROW_LENGTH) {
            const read = readSync(queueFileDescriptor.load(), buff, 0, ROW_LENGTH, i);
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