import {getProvideAnnotation, getInjectAnnotation, Inject} from './annotations';

// TODO(vojta): move to profiler/debug module
var globalCounter = 0;
function getUniqueId() {
  return ++globalCounter;
}

// TODO(vojta): this is super lame, figure out something better.
function isClass(clsOrFunction) {
  return Object.keys(clsOrFunction.prototype).length > 0;
}


class Injector {
  constructor(modules = [], parentInjector = null) {
    this.providers = new Map();
    this.cache = new Map();
    this.parent = parentInjector;
    this.id = getUniqueId();

    for (var module of modules) {
      // A single provider.
      if (typeof module === 'function') {
        this._loadProvider(module);
        continue;
      }

      // A module (map of providers).
      Object.keys(module).forEach((key) => {
        this._loadProvider(module[key], key);
      });
    }
  }

  _loadProvider(provider, key) {
    if (typeof provider !== 'function') {
      return;
    }

    var token = getProvideAnnotation(provider) || key;

    this.providers.set(token, {
      provider: provider,
      params: this._getInjectTokens(provider),
      isClass: isClass(provider)
    });
  }

  // TODO(vojta): move this to annotations.
  _getInjectTokens(provider) {
    // Read the @Inject annotation on the class / function.
    var params = getInjectAnnotation(provider) || [];

    // Read the annotations on individual parameters.
    if (provider.parameters) {
      provider.parameters.forEach((param, idx) => {
        for (var paramAnnotation of param) {
          if (typeof paramAnnotation === 'function' && !params[idx]) {
            params[idx] = paramAnnotation;
          } else if (paramAnnotation instanceof Inject) {
            params[idx] = paramAnnotation.params[0];
            continue;
          }
        }
      });
    }

    return params;
  }

  get(token, resolving = []) {
    var defaultProvider = null;

    if (typeof token === 'function') {
      defaultProvider = token;
    }

    if (this.cache.has(token)) {
      return this.cache.get(token);
    }

    var provider = this.providers.get(token);
    var resolvingMsg = '';

    if (!provider && defaultProvider) {
      provider = {
        provider: defaultProvider,
        params: this._getInjectTokens(defaultProvider),
        isClass: isClass(defaultProvider)
      };
    }

    if (!provider) {
      if (!this.parent) {
        if (resolving.length) {
          resolving.push(token);
          resolvingMsg = ` (${resolving.join(' -> ')})`;
        }

        throw new Error(`No provider for ${token}!${resolvingMsg}`);
      }

      return this.parent.get(token, resolving);
    }

    if (resolving.indexOf(token) !== -1) {
      if (resolving.length) {
        resolving.push(token);
        resolvingMsg = ` (${resolving.join(' -> ')})`;
      }
      throw new Error(`Cannot instantiate cyclic dependency!${resolvingMsg}`);
    }

    resolving.push(token);

    var args = provider.params.map((token) => {
      return this.get(token, resolving);
    });
    var context = undefined;

    if (provider.isClass) {
      context = Object.create(provider.provider.prototype);
    }

    var instance = provider.provider.apply(context, args) || context;

    this.cache.set(token, instance);
    resolving.pop();

    return instance;
  }

  invoke(fn, context) {

  }

  createChild(modules = []) {
    return new Injector(modules, this);
  }


  dump() {
    var dump = {
      id: this.id,
      parent_id: this.parent ? this.parent.id : null,
      providers: {}
    };

    Object.keys(this.providers).forEach((token) => {
      dump.providers[token] = {
        name: token,
        dependencies: this.providers[token].params
      };
    });

    return dump;
  }
}


export {Injector};
