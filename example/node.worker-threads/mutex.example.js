/**
 * RUN WITH node --experimental-worker mutex.example.js
 * OR npm run example:mutex
 * 
 * The main thread is busy thread and it needs to schedule tasks for a queue.
 * the queue needs to be persistent, and the main thread doesn't want to 
 * use mutex since it can block the event loop.
 * 
 * The main thread creates 2 workers
 * the first should write the task to the file at the relevant position (by priority)
 * the second should clean the queue, where the LAST row is the highest priority task.
 * 10 is the highest priority, 0 is the lowest 
 * 
 * To make stuff simple, 
 * each task will take between 1 ms to 100 ms (random)
 * and a consumer worker can only handle 1 task at a time
 * 
 * Each row will look like:
 * 0-10 some string#######\n
 * where the row length is 40 fixed, padded with ### at the end
 * 
 * 
 */
const { Worker, MessageChannel } = require('worker_threads');
const { SHARED_MEMORY_LEN } = require('./mutex.example.consts');


// create shared memory
const sharedMemoryNeeded = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * SHARED_MEMORY_LEN);

const consumer = new Worker("./mutex.example.queue.worker.js", {
    workerData: 'consumer',
});

const producer =  new Worker("./mutex.example.queue.worker.js", {
    workerData: 'producer',
});


const { port1, port2 } = new MessageChannel();
consumer.postMessage({
    shm: sharedMemoryNeeded,
    port: port2,
}, [port2]);

(function enqueueJob(){
    port1.postMessage({
        task: `${new Date().toISOString()}`,
        priority: Math.floor(Math.random() * 11),
    });

    setTimeout(enqueueJob, Math.random() * 3000)
})();
