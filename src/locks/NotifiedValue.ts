import SyncedValue from './SyncedValue';

class NotifiedValue extends SyncedValue<Int32Array> {

    public notify(count?: number): number {
        // https://github.com/Microsoft/TypeScript/pull/29115
        return (Atomics as any).notify(this.resource, this.cellIndex, count);
    }

    public wait(value: number, timeout?: number) {
        return Atomics.wait(this.resource, this.cellIndex, value, timeout);
    }

    public waitEqual(value: number) {
        // tslint:disable-next-line:no-empty
        while ('ok' !== this.wait(value)) { }
    }

    public waitEqualZero() {
        this.waitEqual(0);
    }
}

export default NotifiedValue;
