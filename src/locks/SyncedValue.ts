import TypedArray from './typed-array.interface';

export default class SyncedValue<T extends TypedArray> {
    constructor(
        protected resource: T,
        protected cellIndex: number,
    ) {}

    public increment(val: number) {
        return Atomics.add(this.resource, this.cellIndex, val);
    }

    public incrementOne() {
        return this.increment(1);
    }

    public decrement(val: number) {
        return Atomics.sub(this.resource, this.cellIndex, val);
    }

    public decrementOne() {
        return this.decrement(1);
    }

    public load() {
        return Atomics.load(this.resource, this.cellIndex);
    }

    public store(value: number) {
        return Atomics.store(this.resource, this.cellIndex, value);
    }
}
