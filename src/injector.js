import {getProvideAnnotation, getInjectAnnotation, Inject, SuperConstructor, getInjectTokens} from './annotations';
import {isUpperCase, isClass, isFunction, isObject, toString} from './util';
import {getUniqueId} from './profiler';


var EmptyFunction = Function.__proto__;

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
      params: getInjectTokens(provider),
      isClass: isClass(provider)
    });
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
        params: getInjectTokens(defaultProvider),
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

    var context = undefined;

    if (provider.isClass) {
      context = Object.create(provider.provider.prototype);
    }

    var injector = this;
    var args = provider.params.map((token) => {
      // TODO(vojta): should be only allowed during the constructor?
      if (token === SuperConstructor) {
        var superConstructor = provider.provider.__proto__;

        if (superConstructor === EmptyFunction) {
          resolvingMsg = ` (${resolving.map(toString).join(' -> ')})`;
          throw new Error(`Only classes with a parent can ask for SuperConstructor!${resolvingMsg}`);
        }

        return function() {
          if (arguments.length > 0) {
            resolvingMsg = ` (${resolving.map(toString).join(' -> ')})`;
            throw new Error(`SuperConstructor does not accept any arguments!${resolvingMsg}`);
          }

          var superArgs = getInjectTokens(superConstructor).map((token) => {
            return injector.get(token, resolving);
          });

          superConstructor.apply(context, superArgs);
        }
      }
      return this.get(token, resolving);
    });


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
