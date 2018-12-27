import Mutex from './Mutex';
import NotifiedValue from './NotifiedValue';

export default class ReadWriterMutex {

    constructor(
        protected readMutex: Mutex,
        protected writeMutex: Mutex,
        protected syncedReadersCount: NotifiedValue,
        protected syncedWritersCount: NotifiedValue) { }

    public readLock() {
        while (true) {
            // wait for all writers to end
            this.readMutex.lock();
            // double check workers count
            if (this.syncedWritersCount.load() > 0) {
                this.readMutex.unlock();
                this.syncedWritersCount.waitEqualZero();
                continue;
            }
            this.syncedReadersCount.incrementOne();
            this.readMutex.unlock();
            return;
        }
    }

    public readUnlock() {
        // just sub the counter and notify and waiting writers
        this.syncedReadersCount.decrementOne();
        this.syncedReadersCount.notify();
    }

    public writeLock() {
        this.writeMutex.lock();
        this.syncedWritersCount.store(1);
        while (true) {
            // lock both read and lock mutex
            this.readMutex.lock();
            // lock the writer mutex, since only single writer is allowed at the same time
            // here it's guaranteed to not have new readers, wait for older to finish (if any)
            if (this.syncedReadersCount.load() > 0) {
                this.readMutex.unlock();
                this.syncedReadersCount.waitEqualZero();
                continue;
            }
            break;
        }
    }

    public writeUnlock() {
        this.syncedWritersCount.store(0);
        this.syncedWritersCount.notify();
        this.readMutex.unlock();
        this.writeMutex.unlock();
    }
}
