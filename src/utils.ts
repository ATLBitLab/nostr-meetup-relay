const hexAsBuffer = (hex: string) => Buffer.from(hex, 'hex');
const isHex = (n: string) => !!n && !(n.length % 2) && /^[0-9A-F]*$/i.test(n);
const isNumber = (n: any) => typeof n === 'number';
const stringify = (n: any) => JSON.stringify(n, null, 2);
const { isArray } = Array;
const { parse } = JSON;

export { hexAsBuffer, isHex, isNumber, stringify, isArray, parse }