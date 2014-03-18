import {SuperConstructor, readAnnotations, hasAnnotation} from './annotations';
import {isUpperCase, isClass, isFunction, isObject, toString} from './util';
import {getUniqueId} from './profiler';

// NOTE(vojta): should we rather use custom lightweight promise-like wrapper?
import {resolve} from 'q';
import {Diary} from 'Diary/diary';
import {ConsoleReporter} from 'Diary/reporters/console';

Diary.reporter(new ConsoleReporter({
  console: console
}));

var logger = new Diary('di');
var EmptyFunction = Object.getPrototypeOf(Function);


function constructResolvingMessage(resolving, token = null) {
  if (token) {
    resolving.push(token);
  }

  if (resolving.length > 1) {
    return ` (${resolving.map(toString).join(' -> ')})`;
  }

  return '';
}


// TODO(vojta): extract all the super constructor logic into a class provider
// - add instantiate() method (value only returns, factory invokes, class apply on context)
// - class provider will flatten all the deps (from parent constructors) first
// - injector does not care about the concept of super constructor
// - all deps (including all parent constructor's) are resolved before instantiate()
class Provider {
  constructor(provider, annotations) {
    this.provider = provider;
    this.isClass = isClass(provider);
    this.isPromise = annotations.isPromise;
    this.params = annotations.injectTokens;
    this.paramsPromises = annotations.injectPromises;
  }
}


class Injector {

  constructor(modules = [], parentInjector = null, providers = new Map()) {
    this.cache = new Map();
    this.providers = providers;
    this.parent = parentInjector;
    this.id = getUniqueId();

    logger.info(`injector ${this.id} created`);
    this._loadModules(modules);
  }


  _collectProvidersWithAnnotation(annotationClass, collectedProviders) {
    this.providers.forEach((provider, token) => {
      if (!collectedProviders.has(token) && hasAnnotation(provider.provider, annotationClass)) {
        collectedProviders.set(token, provider);
      }
    });

    if (this.parent) {
      this.parent._collectProvidersWithAnnotation(annotationClass, collectedProviders);
    }
  }


  _loadModules(modules) {
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


  _loadProvider(provider, key) {
    if (!isFunction(provider)) {
      return;
    }

    var annotations = readAnnotations(provider);
    var token = annotations.provideToken || key || provider;

    this.providers.set(token, new Provider(provider, annotations));
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
    var defaultProvider;
    var resolvingMsg = '';
    var instance;

    function instantiate(args, context, provider, resolving, token) {
      var returnedValue;

      try {
        returnedValue = provider.provider.apply(context, args);
      } catch (e) {
        resolvingMsg = constructResolvingMessage(resolving);
        var originalMsg = 'ORIGINAL ERROR: ' + e.message;
        e.message = `Error during instantiation of ${toString(token)}!${resolvingMsg}\n${originalMsg}`;
        throw e;
      }

      if (provider.isClass && !isFunction(returnedValue) && !isObject(returnedValue)) {
        return context;
      }

      return returnedValue;
    }

    if (isFunction(token)) {
      defaultProvider = token;
    }

    // Special case, return Injector.
    if (token === Injector) {
      if (wantPromise) {
        return resolve(this);
      }

      return this;
    }

    // Check if there is a cached instance already.
    if (this.cache.has(token)) {
      instance = this.cache.get(token);

      if (this.providers.get(token).isPromise) {
        if (!wantPromise) {
          resolvingMsg = constructResolvingMessage(resolving, token);
          throw new Error(`Cannot instantiate ${toString(token)} synchronously. It is provided as a promise!${resolvingMsg}`);
        }
      } else {
        if (wantPromise) {
          return resolve(instance);
        }
      }

      return instance;
    }

    var provider = this.providers.get(token);

    // No provider defined (overriden), use the default provider.
    if (!provider && defaultProvider && !this._hasProviderFor(token)) {
      provider = new Provider(defaultProvider, readAnnotations(defaultProvider));
      this.providers.set(token, provider);
    }

    if (!provider) {
      if (!this.parent) {
        resolvingMsg = constructResolvingMessage(resolving, token);
        throw new Error(`No provider for ${toString(token)}!${resolvingMsg}`);
      }

      return this.parent.get(token, resolving);
    }

    if (resolving.indexOf(token) !== -1) {
      resolvingMsg = constructResolvingMessage(resolving, token);
      throw new Error(`Cannot instantiate cyclic dependency!${resolvingMsg}`);
    }

    resolving.push(token);

    var context;

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
        var superConstructor = Object.getPrototypeOf(provider.provider);

        if (superConstructor === EmptyFunction) {
          resolvingMsg = constructResolvingMessage(resolving);
          throw new Error(`Only classes with a parent can ask for SuperConstructor!${resolvingMsg}`);
        }

        return function() {
          if (arguments.length > 0) {
            resolvingMsg = constructResolvingMessage(resolving);
            throw new Error(`SuperConstructor does not accept any arguments!${resolvingMsg}`);
          }

          var superArgs = readAnnotations(superConstructor).injectTokens.map((token) => {
            return injector.get(token, resolving, false);
          });

          superConstructor.apply(context, superArgs);
        };
      }

      if (delayingInstantiation) {
        return this.get(token, resolving, true);
      }

      return this.get(token, resolving, provider.paramsPromises[idx]);
    });

    // Delaying the instantiation - return a promise.
    if (delayingInstantiation) {
      var delayedResolving = resolving.slice();

      resolving.pop();

      // Once all dependencies (promises) are resolved, instantiate.
      return resolve.all(args).then(function(args) {
        var instance = instantiate(args, context, provider, resolving, token);

        injector.cache.set(token, instance);

        // TODO(vojta): if a provider returns a promise (but is not declared as @ProvidePromise),
        // here the value will get unwrapped (because it is returned from a promise callback) and
        // the actual value will be injected. This is probably not desired behavior. Maybe we could
        // get rid off the @ProvidePromise and just check the returned value, whether it is
        // a promise or not.
        return instance;

      });
    }

    instance = instantiate(args, context, provider, resolving, token);

    logger.info(`${token} was created`);
    this.cache.set(token, instance);

    if (!wantPromise && provider.isPromise) {
      resolvingMsg = constructResolvingMessage(resolving);

      throw new Error(`Cannot instantiate ${toString(token)} synchronously. It is provided as a promise!${resolvingMsg}`);
    }

    if (wantPromise && !provider.isPromise) {
      instance = resolve(instance);
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
    var serialized = {
      id: this.id,
      parent_id: this.parent ? this.parent.id : null,
      providers: {}
    };

    Object.keys(this.providers).forEach((token) => {
      serialized.providers[token] = {
        name: token,
        dependencies: this.providers[token].params
      };
    });

    return serialized;
  }
}


export {Injector};
