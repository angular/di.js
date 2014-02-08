import {getProvideAnnotation, getInjectAnnotation, Inject} from './annotations';

// TODO(vojta): move to profiler/debug module
var globalCounter = 0;
function getUniqueId() {
  return ++globalCounter;
}

function isUpperCase(char) {
  return char.toUpperCase() === char;
}

function isClass(clsOrFunction) {
  if (clsOrFunction.name) {
    return isUpperCase(clsOrFunction.name.charAt(0));
  }

  return Object.keys(clsOrFunction.prototype).length > 0;
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

  if (token.name) {
    return token.name;
  }

  return token.toString();
}


class Injector {
  constructor(modules = [], parentInjector = null, providers = new Map()) {
    this.cache = new Map();
    this.providers = providers;
    this.parent = parentInjector;
    this.id = getUniqueId();

    for (var module of modules) {
      // A single provider.
      if (isFunction(module)) {
        this._loadProvider(module);
        continue;
      }

      // A module (map of providers).
      Object.keys(module).forEach((key) => {
        this._loadProvider(module[key], key);
      });
    }
  }

  _collectProvidersWithAnnotation(annotationClass, collectedProviders) {
    this.providers.forEach((provider, token) => {
      // TODO(vojta): move to annotations
      if (provider.provider.annotations) {
        for (var annotation of provider.provider.annotations) {
          if (annotation instanceof annotationClass && !collectedProviders.has(token)) {
            collectedProviders.set(token, provider);
          }
        }
      }
    });

    if (this.parent) {
      this.parent._collectProvidersWithAnnotation(annotationClass, collectedProviders);
    }
  }

  _loadProvider(provider, key) {
    if (!isFunction(provider)) {
      return;
    }

    var token = getProvideAnnotation(provider) || key || provider;

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
          if (isFunction(paramAnnotation) && !params[idx]) {
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

  _hasProviderFor(token) {
    if (this.providers.has(token)) {
      return true;
    }

    if (this.parent) {
      return this.parent._hasProviderFor(token);
    }

    return false;
  }

  get(token, resolving = []) {
    var defaultProvider = null;

    if (isFunction(token)) {
      defaultProvider = token;
    }

    if (this.cache.has(token)) {
      return this.cache.get(token);
    }

    var provider = this.providers.get(token);
    var resolvingMsg = '';

    if (!provider && defaultProvider && !this._hasProviderFor(token)) {
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
          resolvingMsg = ` (${resolving.map(toString).join(' -> ')})`;
        }

        throw new Error(`No provider for ${toString(token)}!${resolvingMsg}`);
      }

      return this.parent.get(token, resolving);
    }

    if (resolving.indexOf(token) !== -1) {
      if (resolving.length) {
        resolving.push(token);
        resolvingMsg = ` (${resolving.map(toString).join(' -> ')})`;
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

    try {
      var instance = provider.provider.apply(context, args);
    } catch (e) {
      resolvingMsg = ` (${resolving.map(toString).join(' -> ')})`;
      var originalMsg = 'ORIGINAL ERROR: ' + e.message;
      e.message = `Error during instantiation of ${toString(token)}!${resolvingMsg}\n${originalMsg}`
      throw e;
    }

    if (provider.isClass && !isFunction(instance) && !isObject(instance)) {
      instance = context;
    }

    this.cache.set(token, instance);
    resolving.pop();

    return instance;
  }

  invoke(fn, context) {

  }

  createChild(modules = [], forceNewInstancesOf = []) {
    var forcedProviders = new Map();

    for (var annotation of forceNewInstancesOf) {
      this._collectProvidersWithAnnotation(annotation, forcedProviders);
    }

    return new Injector(modules, this, forcedProviders);
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
