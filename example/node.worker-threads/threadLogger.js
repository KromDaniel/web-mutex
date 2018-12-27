const { threadId } = require('worker_threads');
const colors = ["\x1b[31m",  "\x1b[32m", "\x1b[33m", "\x1b[34m", "\x1b[35m", "\x1b[36m", "\x1b[37m"]
const log = (...args) => {
    console.log(`${colors[threadId]}[${threadId === 0 ? 'main' : 'w' + threadId}]\x1b[0m`, ...args);
}

module.exports = log;