import {
  annotate,
  readAnnotations,
  hasAnnotation,
  Provide as ProvideAnnotation,
  TransientScope as TransientScopeAnnotation
} from './annotations';
import {isFunction, toString} from './util';
import {profileInjector} from './profiler';
import {createProviderFromFnOrClass} from './providers';


function constructResolvingMessage(resolving, token) {
  // If a token is passed in, add it into the resolving array.
  // We need to check arguments.length because it can be null/undefined.
  if (arguments.length > 1) {
    resolving.push(token);
  }

  if (resolving.length > 1) {
    return ` (${resolving.map(toString).join(' -> ')})`;
  }

  return '';
}


// Injector encapsulate a life scope.
// There is exactly one instance for given token in given injector.
//
// All the state is immutable, the only state changes is the cache. There is however no way to produce different instance under given token. In that sense it is immutable.
//
// Injector is responsible for:
// - resolving tokens into
//   - provider
//   - value (cache/calling provider)
// - dealing with isPromise
// - dealing with isLazy
// - loading different "providers" and modules
class Injector {

  constructor(modules = [], parentInjector = null, providers = new Map()) {
    this.cache = new Map();
    this.providers = providers;
    this.parent = parentInjector;

    this._loadModules(modules);

    profileInjector(this, Injector);
  }


  // Collect all registered providers that has given annotation.
  // Inclugind providers defined in parent injectors.
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


  // Load modules/function/classes.
  // This mutates `this.providers`, but it is only called during the constructor.
  _loadModules(modules) {
    for (var module of modules) {
      // A single provider (class or function).
      if (isFunction(module)) {
        this._loadFnOrClass(module);
        continue;
      }

      throw new Error('Invalid module!');
    }
  }


  // Load a function or class.
  // This mutates `this.providers`, but it is only called during the constructor.
  _loadFnOrClass(fnOrClass) {
    // TODO(vojta): should we expose provider.token?
    var annotations = readAnnotations(fnOrClass);
    var token = annotations.provide.token || fnOrClass;
    var provider = createProviderFromFnOrClass(fnOrClass, annotations);

    this.providers.set(token, provider);
  }


  // Returns true if there is any provider registered for given token.
  // Inclugind parent injectors.
  _hasProviderFor(token) {
    if (this.providers.has(token)) {
      return true;
    }

    if (this.parent) {
      return this.parent._hasProviderFor(token);
    }

    return false;
  }


  // Return an instance for given token.
  get(token, resolving = [], wantPromise = false, wantLazy = false, originalInjector = this) {
    var resolvingMsg = '';
    var provider;
    var instance;
    var injector = this;

    if (token === null || token === undefined) {
      resolvingMsg = constructResolvingMessage(resolving, token);
      throw new Error(`Invalid token "${token}" requested!${resolvingMsg}`);
    }

    // Special case, return itself.
    if (token === Injector) {
      if (wantPromise) {
        return Promise.resolve(this);
      }

      return this;
    }

    // TODO(vojta): optimize - no child injector for locals?
    if (wantLazy) {
      return function createLazyInstance() {
        var lazyInjector = injector;

        if (arguments.length) {
          var locals = [];
          var args = arguments;

          for (var i = 0; i < args.length; i += 2) {
            locals.push((function(ii) {
              var fn = function createLocalInstance() {
                return args[ii + 1];
              };

              annotate(fn, new ProvideAnnotation(args[ii]));

              return fn;
            })(i));
          }

          lazyInjector = injector.createChild(locals);
        }

        return lazyInjector.get(token, resolving, wantPromise, false, lazyInjector);
      };
    }

    // Check if there is a cached instance already.
    if (this.cache.has(token)) {
      instance = this.cache.get(token);
      provider = this.providers.get(token);

      if (provider.isPromise && !wantPromise) {
        resolvingMsg = constructResolvingMessage(resolving, token);
        throw new Error(`Cannot instantiate ${toString(token)} synchronously. It is provided as a promise!${resolvingMsg}`);
      }

      if (!provider.isPromise && wantPromise) {
        return Promise.resolve(instance);
      }

      return instance;
    }

    provider = this.providers.get(token);

    // No provider defined (overriden), use the default provider (token).
    if (!provider && isFunction(token) && !this._hasProviderFor(token)) {
      provider = createProviderFromFnOrClass(token, readAnnotations(token));
      this.providers.set(token, provider);
    }

    if (!provider) {
      if (!this.parent) {
        resolvingMsg = constructResolvingMessage(resolving, token);
        throw new Error(`No provider for ${toString(token)}!${resolvingMsg}`);
      }

      return this.parent.get(token, resolving, wantPromise, wantLazy, originalInjector);
    }

    if (resolving.indexOf(token) !== -1) {
      resolvingMsg = constructResolvingMessage(resolving, token);
      throw new Error(`Cannot instantiate cyclic dependency!${resolvingMsg}`);
    }

    resolving.push(token);

    // TODO(vojta): handle these cases:
    // 1/
    // - requested as promise (delayed)
    // - requested again as promise (before the previous gets resolved) -> cache the promise
    // 2/
    // - requested as promise (delayed)
    // - requested again sync (before the previous gets resolved)
    // -> error, but let it go inside to throw where exactly is the async provider
    var delayingInstantiation = wantPromise && provider.params.some((param) => !param.isPromise);
    var args = provider.params.map((param) => {

      if (delayingInstantiation) {
        return originalInjector.get(param.token, resolving, true, param.isLazy, originalInjector);
      }

      return originalInjector.get(param.token, resolving, param.isPromise, param.isLazy, originalInjector);
    });

    // Delaying the instantiation - return a promise.
    if (delayingInstantiation) {
      var delayedResolving = resolving.slice(); // clone

      resolving.pop();

      // Once all dependencies (promises) are resolved, instantiate.
      return Promise.all(args).then(function(args) {
        try {
          instance = provider.create(args);
        } catch (e) {
          resolvingMsg = constructResolvingMessage(delayedResolving);
          var originalMsg = 'ORIGINAL ERROR: ' + e.message;
          e.message = `Error during instantiation of ${toString(token)}!${resolvingMsg}\n${originalMsg}`;
          throw e;
        }

        if (!hasAnnotation(provider.provider, TransientScopeAnnotation)) {
          injector.cache.set(token, instance);
        }

        // TODO(vojta): if a provider returns a promise (but is not declared as @ProvidePromise),
        // here the value will get unwrapped (because it is returned from a promise callback) and
        // the actual value will be injected. This is probably not desired behavior. Maybe we could
        // get rid off the @ProvidePromise and just check the returned value, whether it is
        // a promise or not.
        return instance;
      });
    }

    try {
      instance = provider.create(args);
    } catch (e) {
      resolvingMsg = constructResolvingMessage(resolving);
      var originalMsg = 'ORIGINAL ERROR: ' + e.message;
      e.message = `Error during instantiation of ${toString(token)}!${resolvingMsg}\n${originalMsg}`;
      throw e;
    }

    if (!hasAnnotation(provider.provider, TransientScopeAnnotation)) {
      this.cache.set(token, instance);
    }

    if (!wantPromise && provider.isPromise) {
      resolvingMsg = constructResolvingMessage(resolving);

      throw new Error(`Cannot instantiate ${toString(token)} synchronously. It is provided as a promise!${resolvingMsg}`);
    }

    if (wantPromise && !provider.isPromise) {
      instance = Promise.resolve(instance);
    }

    resolving.pop();

    return instance;
  }


  getPromise(token) {
    return this.get(token, [], true);
  }


  // Create a child injector, which encapsulate shorter life scope.
  // It is possible to add additional providers and also force new instances of existing providers.
  createChild(modules = [], forceNewInstancesOf = []) {
    var forcedProviders = new Map();

    for (var annotation of forceNewInstancesOf) {
      this._collectProvidersWithAnnotation(annotation, forcedProviders);
    }

    return new Injector(modules, this, forcedProviders);
  }
}


export {Injector};
