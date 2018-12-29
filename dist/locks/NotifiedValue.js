"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var SyncedValue_1 = __importDefault(require("./SyncedValue"));
var NotifiedValue = /** @class */ (function (_super) {
    __extends(NotifiedValue, _super);
    function NotifiedValue() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NotifiedValue.prototype.notify = function (count) {
        // https://github.com/Microsoft/TypeScript/pull/29115
        return Atomics.notify(this.resource, this.cellIndex, count);
    };
    NotifiedValue.prototype.wait = function (value, timeout) {
        return Atomics.wait(this.resource, this.cellIndex, value, timeout);
    };
    NotifiedValue.prototype.waitEqual = function (value) {
        // tslint:disable-next-line:no-empty
        while ('ok' !== this.wait(value)) { }
    };
    NotifiedValue.prototype.waitEqualZero = function () {
        this.waitEqual(0);
    };
    return NotifiedValue;
}(SyncedValue_1.default));
exports.default = NotifiedValue;
