This package helps with threads synchronization.<br/>

Node.js - [Worker threads](https://nodejs.org/api/worker_threads.html)<br/>
Browser - [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)

The package uses [Atomics](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics) API behind the scenes and implements different locks.

## Installation

```
npm i web-mutex
```

## Web Mutex
---
### Motivation
Using threads we can achieve better concurrency and parallelism

#### Single thread
28709.764ms
```js
const ARR_SIZE = 2 ** 25;
const singleThreadedArr = Array(ARR_SIZE);

 console.time('SINGLE THREAD');
for (let i = 0; i < ARR_SIZE; i++) {
    const num = i + 2;
    singleThreadedArr[i] = isPrime(num) ? num : -1
}
console.timeEnd('SINGLE THREAD'); //  28709.764ms
```

#### Multi thread
1978.282ms
```js
import { Worker, isMainThread, parentPort, threadId } from 'worker_threads';
import { SyncedValue } from 'web-mutex';

if (isMainThread) {
    // shared array buffer for locks
    const synced = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
    const numbers = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * ARR_SIZE);
    // create the threads
    const workers = Array(4).fill(0).map(() => new Worker(__filename));
    console.time('MULTI THREAD');
    workers.forEach((w) => w.postMessage({ numbers, synced }));
     /**
     * The main thread will wait for all worker threads to finish
     */
    process.on('beforeExit', () => {
        console.timeEnd('MULTI THREAD'); // 1978.282ms
    });
   
} else {
    // this scope represents run of a worker thread
    parentPort.on('message', ({ numbers, synced }) => {
        const syncedValue = new SyncedValue(new Int32Array(synced), 0);
        const arr = new Int32Array(numbers);
        for (let i = syncedValue.incrementOne(); i < arr.length; i = syncedValue.incrementOne()) {
            const num = arr[i] + 2;
            arr.set([isPrime(num) ? num : -1], i);
        }
        parentPort.close();
    });
}
```




