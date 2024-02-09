const noop = () => {};
const last = (arr = []) => arr[arr.length - 1];
const typeOf = (arg) => (Array.isArray(arg) ? 'array' : typeof arg);
const findNext = (arr = []) => (arr.length === 5 ? arr[2] : last(arr)) || noop;
const findResponse = (arr = []) => arr[arr.length - 2];
const findError = (arr = []) => arr.find((arg) => arg instanceof Error);
module.exports = { noop, last, typeOf, findNext, findResponse, findError };
