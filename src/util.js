// A bunch of helper functions.


function isUpperCase(char) {
  return char.toUpperCase() === char;
}


function isClass(clsOrFunction) {
  if (Object.keys(clsOrFunction.prototype).length > 0){
    return true;
  }else if (clsOrFunction.name) {
    return isUpperCase(clsOrFunction.name.charAt(0));
  }
  return false;
}


function isFunction(value) {
  return typeof value === 'function';
}


function isObject(value) {
  return typeof value === 'object';
}


function toString(token) {
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


export {
  isUpperCase,
  isClass,
  isFunction,
  isObject,
  toString
};
