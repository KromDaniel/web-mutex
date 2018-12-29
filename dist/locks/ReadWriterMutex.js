"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ReadWriterMutex = /** @class */ (function () {
    function ReadWriterMutex(readMutex, writeMutex, syncedReadersCount, syncedWritersCount) {
        this.readMutex = readMutex;
        this.writeMutex = writeMutex;
        this.syncedReadersCount = syncedReadersCount;
        this.syncedWritersCount = syncedWritersCount;
    }
    ReadWriterMutex.prototype.readLock = function () {
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
    };
    ReadWriterMutex.prototype.readUnlock = function () {
        // just sub the counter and notify and waiting writers
        this.syncedReadersCount.decrementOne();
        this.syncedReadersCount.notify();
    };
    ReadWriterMutex.prototype.writeLock = function () {
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
    };
    ReadWriterMutex.prototype.writeUnlock = function () {
        this.syncedWritersCount.store(0);
        this.syncedWritersCount.notify();
        this.readMutex.unlock();
        this.writeMutex.unlock();
    };
    return ReadWriterMutex;
}());
exports.default = ReadWriterMutex;
