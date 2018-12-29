"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SyncedValue = /** @class */ (function () {
    function SyncedValue(resource, cellIndex) {
        this.resource = resource;
        this.cellIndex = cellIndex;
    }
    SyncedValue.prototype.increment = function (val) {
        return Atomics.add(this.resource, this.cellIndex, val);
    };
    SyncedValue.prototype.incrementOne = function () {
        return this.increment(1);
    };
    SyncedValue.prototype.decrement = function (val) {
        return Atomics.sub(this.resource, this.cellIndex, val);
    };
    SyncedValue.prototype.decrementOne = function () {
        return this.decrement(1);
    };
    SyncedValue.prototype.load = function () {
        return Atomics.load(this.resource, this.cellIndex);
    };
    SyncedValue.prototype.store = function (value) {
        return Atomics.store(this.resource, this.cellIndex, value);
    };
    return SyncedValue;
}());
exports.default = SyncedValue;
