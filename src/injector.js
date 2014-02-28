import {getProvideAnnotation, getInjectAnnotation, Inject, SuperConstructor, getInjectTokens, readAnnotations} from './annotations';
import {isUpperCase, isClass, isFunction, isObject, toString} from './util';
import {getUniqueId} from './profiler';

// NOTE(vojta): should we rather use custom lightweight promise-like wrapper?
module Q from 'q';

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

    var annotations = readAnnotations(provider);
    var token = annotations.token || key || provider;

    this.providers.set(token, {
      provider: provider,
      isPromise: annotations.isPromise,
      params: annotations.argTokens,
      paramsPromises: annotations.argPromises,
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

  get(token, resolving = [], wantPromise = false) {
    var defaultProvider = null;
    var resolvingMsg = '';

    if (isFunction(token)) {
      defaultProvider = token;
    }

    if (token === Injector) {
      if (wantPromise) {
        return Q(this);
      }

      return this;
    }


    if (this.cache.has(token)) {
      var instance = this.cache.get(token);

      if (this.providers.get(token).isPromise) {
        if (!wantPromise) {
          if (resolving.length > 1) {
            resolving.push(token);
            resolvingMsg = ` (${resolving.map(toString).join(' -> ')})`;
          }

          throw new Error(`Cannot instantiate ${toString(token)} synchronously. It is provided as a promise!${resolvingMsg}`);
        }
      } else {
        if (wantPromise) {
          return Q(instance);
        }
      }
      return instance;
    }

    var provider = this.providers.get(token);

    if (!provider && defaultProvider && !this._hasProviderFor(token)) {
      var defaultProviderAnnotations = readAnnotations(defaultProvider);
      provider = {
        provider: defaultProvider,
        isPromise: defaultProviderAnnotations.isPromise,
        params: defaultProviderAnnotations.argTokens,
        paramsPromises: defaultProviderAnnotations.argPromises,
        isClass: isClass(defaultProvider)
      };

      this.providers.set(token, provider);
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

    // TODO(vojta): handle these cases:
    // 1/
    // - requested as promise (delayed)
    // - requested again as promise (before the previous gets resolved) -> cache the promise
    // 2/
    // - requested as promise (delayed)
    // - requested again sync (before the previous gets resolved)
    // -> error, but let it go inside to throw where exactly is the async provider
    var injector = this;
    var delayingInstantiation = wantPromise && provider.params.some((token, i) => !provider.paramsPromises[i]);

    var args = provider.params.map((token, idx) => {
      // TODO(vojta): should be only allowed during the constructor?
      // TODO(vojta): support async arguments for super constructor?
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
            return injector.get(token, resolving, false);
          });

          superConstructor.apply(context, superArgs);
        }
      }

      if (delayingInstantiation) {
        return this.get(token, resolving, true);
      }

      return this.get(token, resolving, provider.paramsPromises[idx]);
    });

    if (delayingInstantiation) {
      var delayedResolving = resolving.slice();

      resolving.pop();

      return Q.all(args).then(function(args) {
        // TODO(vojta): do not repeat yourself ;-)
        try {
          var instance = provider.provider.apply(context, args);
        } catch (e) {
          resolvingMsg = ` (${delayedResolving.map(toString).join(' -> ')})`;
          var originalMsg = 'ORIGINAL ERROR: ' + e.message;
          e.message = `Error during instantiation of ${toString(token)}!${resolvingMsg}\n${originalMsg}`
          throw e;
        }

        if (provider.isClass && !isFunction(instance) && !isObject(instance)) {
          instance = context;
        }

        injector.cache.set(token, instance);

        // TODO(vojta): if a provider returns a promise (but is not declared as @ProvidePromise),
        // here the value will get unwrapped (because it is returned from a promise callback) and
        // the actual value will be injected. This is probably not desired behavior. Maybe we could
        // get rid off the @ProvidePromise and just check the returned value, whether it is
        // a promise or not.
        return instance;

      });
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

    if (!wantPromise && provider.isPromise) {
      if (resolving.length > 1) {
        resolvingMsg = ` (${resolving.map(toString).join(' -> ')})`;
      }

      throw new Error(`Cannot instantiate ${toString(token)} synchronously. It is provided as a promise!${resolvingMsg}`);
    }

    if (wantPromise && !provider.isPromise) {
      instance = Q(instance);
    }

    resolving.pop();

    return instance;
  }

  getPromise(token) {
    return this.get(token, [], true);
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
