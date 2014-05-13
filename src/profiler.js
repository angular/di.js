import {toString} from './util';


var IS_DEBUG = false;
var _global = null;

if (typeof process === 'object' && process.env) {
  // Node.js
  IS_DEBUG = !!process.env['DEBUG'];
  _global = global;
} else if (typeof location === 'object' && location.search) {
  // Browser
  IS_DEBUG = /di_debug/.test(location.search);
  _global = window;
}


var globalCounter = 0;
function getUniqueId() {
  return ++globalCounter;
}


function serializeToken(token, tokens) {
  if (!tokens.has(token)) {
    tokens.set(token, getUniqueId().toString());
  }

  return tokens.get(token);
}

function serializeProvider(provider, key, tokens) {
  return {
    id: serializeToken(key, tokens),
    name: toString(key),
    isPromise: provider.isPromise,
    dependencies: provider.params.map(function(param) {
      return {
        token: serializeToken(param.token, tokens),
        isPromise: param.isPromise,
        isLazy: param.isLazy
      };
    })
  };
}


function serializeInjector(injector, tokens, Injector) {
  var serializedInjector = {
    id: serializeToken(injector, tokens),
    parent_id: injector._parent ? serializeToken(injector._parent, tokens) : null,
    providers: {}
  };

  var injectorClassId = serializeToken(Injector, tokens);
  serializedInjector.providers[injectorClassId] = {
    id: injectorClassId,
    name: toString(Injector),
    isPromise: false,
    dependencies: []
  };

  injector._providers.forEach(function(provider, key) {
    var serializedProvider = serializeProvider(provider, key, tokens);
    serializedInjector.providers[serializedProvider.id] = serializedProvider;
  });

  return serializedInjector;
}


export function profileInjector(injector, Injector) {
  if (!IS_DEBUG) {
    return;
  }

  if (!_global.__di_dump__) {
    _global.__di_dump__ = {
      injectors: [],
      tokens: new Map()
    };
  }

  _global.__di_dump__.injectors.push(serializeInjector(injector, _global.__di_dump__.tokens, Injector));
}
