/**
 * RUN WITH node --experimental-worker basic.example.js
 * OR npm run example:basic
 * 
 * This program initializes with the size of ARR_SIZE, where index 0 represents the number 2
 * and let worker threads calculate for each cell of the array
 * if the index +2 is prime, store the prime number else store -1
 * 
 * example array with size of 5 will eventually be
 * INDEX  0   1   2   3   4
 * ARRAY  [2, 3, -1 , 5, -1] // 4 and 6 are not primes
 * NUMBER  2  3   4   5   6 
 * 
 * The final output for this program
 * SINGLE THREAD: 29094.859ms
 * thread number 4 done
 * thread number 3 done
 * thread number 2 done
 * thread number 1 done
 * MULTI THREAD: 2058.209ms
 */
const { Worker, isMainThread, parentPort, threadId } = require('worker_threads');
const { SyncedValue } = require('web-mutex');


const ARR_SIZE = 2 ** 25;
/**
 *
 * @param {number} v 
 */
function isPrime(v) {
    if (v < 2) return false;
    const max = Math.sqrt(v);
    for (let i = 2; i <= max; i++) {
        if (v % i === 0) return false;
    }
    return true;
}
if (isMainThread) {
    /**
     * See how much it takes single threaded
     * on this computer it took avg of 26500MS for 2**25 numbers
     */
    const singleThreadedArr = Array(ARR_SIZE);
    function doInSingleThreaded() {
        console.time('SINGLE THREAD');
        for (let i = 0; i < ARR_SIZE; i++) {
            const num = i + 2;
            singleThreadedArr[i] = isPrime(num) ? num : -1
        }
        console.timeEnd('SINGLE THREAD');
    }
    doInSingleThreaded();
    /**
     * Now let's go with 4 threads and see how much time it'll take
     * 
     * we create 2 shared array buffer,
     * the first one is in size of 1 for the SyncedValue
     * Synced value is Atomic value, that will represent the current index
     * the current thread should take care.
     * increment() on SyncedValue returns the OLD value before increment
     * 
     * the second array store the prime | -1 numbers
     */
    // shared array buffer for locks
    const synced = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
    const numbers = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * ARR_SIZE);
    // create the threads
    const workers = Array(4).fill(0).map(() => new Worker(__filename));
    workers.forEach((w) => w.postMessage({ numbers, synced }));
    console.time('MULTI THREAD');
     /**
     * The main thread will wait for all worker threads to finish
     */
    process.on('beforeExit', () => {
        console.timeEnd('MULTI THREAD');
        // compare the result with the single threaded worker
        // to make sure I didn't cheat :)
        const multiThreadedArr = new Int32Array(numbers);
        for (let i = 0; i < singleThreadedArr; i++) {
            if (multiThreadedArr[i] !== singleThreadedArr[i]) {
                console.error(i, ":", multiThreadedArr[i], "!==", singleThreadedArr[i]);
                process.exit(1);
            }
        }
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
        console.log("thread number", threadId, "done");
        parentPort.close();
    });
}