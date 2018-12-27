import NotifiedValue from './NotifiedValue';
import SyncedValue from './SyncedValue';
import TypedArray from './typed-array.interface';

export default class Mutex {

    public static once<T extends TypedArray>(
        mutex: Mutex,
        resource: SyncedValue<T>,
        onceFN: (done: () => void) => void,
    ) {
        if (resource.load() === 1) {
            return;
        }
        mutex.lock();
        // maybe someone already flagged it
        if (resource.load() === 1) {
            mutex.unlock();
            return;
        }
        onceFN(() => {
            resource.store(1);
            mutex.unlock();
        });
    }

    private lockAcquired = false;

    constructor(public syncedNotifier: NotifiedValue) {
        this.lock = this.lock.bind(this);
        this.unlock = this.unlock.bind(this);
        this.asyncLock = this.asyncLock.bind(this);
    }

    public lock() {
        this._throwIfLocked();
        while (true) {
            // lock is already acquired, wait
            if (this.syncedNotifier.load() > 0) {
                this.syncedNotifier.waitEqualZero();
            }
            const countOfAcquiresBeforeMe = this.syncedNotifier.incrementOne();
            // someone was faster than me, try again later
            if (countOfAcquiresBeforeMe >= 1) {
                this.syncedNotifier.decrementOne();
                continue;
            }
            this.lockAcquired = true;
            return;
        }
    }

    public asyncLock(interval: number = 100, cb: () => void) {
        if (cb !== undefined) {
            this._asyncLock(interval, cb);
            return;
        }

        return new Promise<void>((resolve) => {
            this._asyncLock(interval, resolve);
        });
    }

    public unlock() {
        if (!this.lockAcquired) {
            throw new Error('mutex is not acquired, locking nothing');
        }
        this.syncedNotifier.decrementOne();
        this.syncedNotifier.notify(1);
        this.lockAcquired = false;
    }

    public async runPromiseInLock<T>(p: Promise<T>) {
        this.lock();
        try {
            const res = await p;
            return res;
        } finally {
            this.unlock();
        }
    }

    private _throwIfLocked() {
        if (this.lockAcquired) {
            throw new Error('locked already acquired');
            return;
        }
    }

    private _asyncLock(interval: number, cb: () => void) {
        if (this.syncedNotifier.load() > 0) {
            setTimeout(this.asyncLock, interval);
            return;
        }
        const countOfAcquiresBeforeMe = this.syncedNotifier.incrementOne();
        // someone was faster than me, try again later
        if (countOfAcquiresBeforeMe >= 1) {
            this.syncedNotifier.decrementOne();
            setTimeout(this.asyncLock, interval);
            return;
        }
        this.lockAcquired = true;
        cb();
    }
}
