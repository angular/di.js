// A bunch of helper functions.

function isUpperCase(char) {
  return char.toUpperCase() === char;
}

function isFunction(value) {
  return typeof value === 'function';
}


function isObject(value) {
  return typeof value === 'object';
}


function tokenToString(token) {
  if (typeof token === 'string') {
    return token;
  }

  if (token === undefined || token === null) {
    return '' + token;
  }

  if (token.name) {
    return token.name;
  }

  return token.toString();
}

function ownKeys(O) {
  var keys = Object.getOwnPropertyNames(O);
  if (Object.getOwnPropertySymbols) return keys.concat(Object.getOwnPropertySymbols(O));
  return keys;
}


export {
  isUpperCase,
  isFunction,
  isObject,
  toString,
  ownKeys
};
