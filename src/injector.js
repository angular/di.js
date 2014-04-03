import {SuperConstructor, readAnnotations, hasAnnotation, ProvideAnnotation, TransientScope} from './annotations';
import {isUpperCase, isClass, isFunction, isObject, toString} from './util';
import {getUniqueId} from './profiler';


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


// TODO(vojta): super constructor - should be only allowed during the constructor call?
// TODO(vojta): support async arguments for super constructor?
class ClassProvider {
  constructor(provider, annotations) {
    // TODO(vojta): can we hide this.provider? (only used for hasAnnotation(provider.provider))
    this.provider = provider;
    this.isPromise = annotations.isPromise;

    // TODO(vojta): make params list of objects (isPromise, isLazy, token) -> same as provide definition
    this.params = [];
    this.paramsPromises = [];
    this.paramsLazily = [];

    this.superConstructorPositions = [];

    this._flattenParams(provider, annotations);
    this.superConstructorPositions.unshift([provider, 0, this.params.length - 1]);
  }

  _flattenParams(provider, annotations) {
    var token;
    var superConstructor;
    var superConstructorFrame;

    for (var i = 0; i < annotations.injectTokens.length; i++) {
      token = annotations.injectTokens[i];

      if (token === SuperConstructor) {
        superConstructor = Object.getPrototypeOf(provider);

        if (superConstructor === EmptyFunction) {
          // TODO(vojta): fix this, we are not resolving yet, when should we throw?
          // Probably as early as possible.
          var resolving = [];
          var resolvingMsg = constructResolvingMessage(resolving);
          throw new Error(`Only classes with a parent can ask for SuperConstructor!${resolvingMsg}`);
        }

        superConstructorFrame = [superConstructor, this.params.length];
        this.superConstructorPositions.push(superConstructorFrame);
        this._flattenParams(superConstructor, readAnnotations(superConstructor));
        superConstructorFrame.push(this.params.length - 1);
      } else {
        this.params.push(token);
        this.paramsLazily.push(annotations.injectLazily[i]);
        this.paramsPromises.push(annotations.injectPromises[i]);
      }
    }
  }

  _createConstructor(currentSuperConstructorFrameIdx, context, allArguments) {
    var superConstructorFrame = this.superConstructorPositions[currentSuperConstructorFrameIdx];
    var nextSuperConstructorFrame = this.superConstructorPositions[currentSuperConstructorFrameIdx + 1];
    var denormalizedArgs;

    if (nextSuperConstructorFrame) {
      denormalizedArgs = allArguments.slice(superConstructorFrame[1], nextSuperConstructorFrame[1])
                             .concat([this._createConstructor(currentSuperConstructorFrameIdx + 1, context, allArguments)])
                             .concat(allArguments.slice(nextSuperConstructorFrame[2] + 1, superConstructorFrame[2] + 1));
    } else {
      denormalizedArgs = allArguments.slice(superConstructorFrame[1], superConstructorFrame[2] + 1);
    }

    return function InjectedAndBoundSuperConstructor() {
      // TODO(vojta): throw if arguments given
      return superConstructorFrame[0].apply(context, denormalizedArgs);
    }
  }

  // TODO(vojta): refactor resolving, token (it's just for the error message)
  create(args, resolving, token) {
    var context = Object.create(this.provider.prototype);
    var constructor = this._createConstructor(0, context, args);
    var returnedValue;

    try {
      returnedValue = constructor();
    } catch (e) {
      var resolvingMsg = constructResolvingMessage(resolving);
      var originalMsg = 'ORIGINAL ERROR: ' + e.message;
      e.message = `Error during instantiation of ${toString(token)}!${resolvingMsg}\n${originalMsg}`;
      throw e;
    }

    if (!isFunction(returnedValue) && !isObject(returnedValue)) {
      return context;
    }

    return returnedValue;
  }
}


class FactoryProvider {
  constructor(provider, annotations) {
    this.provider = provider;
    this.isPromise = annotations.isPromise;

    // TODO(vojta): make this an array of objects
    this.params = annotations.injectTokens;
    this.paramsPromises = annotations.injectPromises;
    this.paramsLazily = annotations.injectLazily;

    for (var token of annotations.injectTokens) {
      if (token === SuperConstructor) {
        throw new Error('Only classes with a parent can ask for SuperConstructor!');
      }
    }
  }

  create(args, resolving, token) {
    // TODO(vojta): should we move the try/catch to injector
    try {
      return this.provider.apply(undefined, args);
    } catch (e) {
      var resolvingMsg = constructResolvingMessage(resolving);
      var originalMsg = 'ORIGINAL ERROR: ' + e.message;
      e.message = `Error during instantiation of ${toString(token)}!${resolvingMsg}\n${originalMsg}`;
      throw e;
    }
  }
}


function createProviderFromFnOrClass(fnOrClass, annotations) {
  if (isClass(fnOrClass)) {
    return new ClassProvider(fnOrClass, annotations);
  }

  return new FactoryProvider(fnOrClass, annotations);
}


class Injector {

  constructor(modules = [], parentInjector = null, providers = new Map()) {
    this.cache = new Map();
    this.providers = providers;
    this.parent = parentInjector;
    this.id = getUniqueId();

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

    // TODO(vojta): should we expose provider.token?
    var annotations = readAnnotations(provider);
    var token = annotations.provideToken || key || provider;
    var provider = createProviderFromFnOrClass(provider, annotations);

    this.providers.set(token, provider);
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


  get(token, resolving = [], wantPromise = false, wantLazy = false) {
    var defaultProvider;
    var resolvingMsg = '';
    var instance;
    var injector = this;

    if (isFunction(token)) {
      defaultProvider = token;
    }

    // Special case, return Injector.
    if (token === Injector) {
      if (wantPromise) {
        return Promise.resolve(this);
      }

      return this;
    }

    // TODO(vojta): optimize - no child injector for locals?
    if (wantLazy) {
      return function() {
        var lazyInjector = injector;

        if (arguments.length) {
          var locals = [];
          var args = arguments;

          for (var i = 0; i < args.length; i += 2) {
            locals.push((function(ii) {
              var fn = function() {
                return args[ii + 1];
              };
              fn.annotations = [new ProvideAnnotation(args[ii])]
              return fn;
            })(i));
          }

          lazyInjector = injector.createChild(locals);
        }

        return lazyInjector.get(token, resolving, wantPromise, false);
      };
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
          return Promise.resolve(instance);
        }
      }

      return instance;
    }

    var provider = this.providers.get(token);

    // No provider defined (overriden), use the default provider.
    if (!provider && defaultProvider && !this._hasProviderFor(token)) {
      provider = createProviderFromFnOrClass(defaultProvider, readAnnotations(defaultProvider));
      this.providers.set(token, provider);
    }

    if (!provider) {
      if (!this.parent) {
        resolvingMsg = constructResolvingMessage(resolving, token);
        throw new Error(`No provider for ${toString(token)}!${resolvingMsg}`);
      }

      return this.parent.get(token, resolving, wantPromise, wantLazy);
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
    var delayingInstantiation = wantPromise && provider.params.some((token, i) => !provider.paramsPromises[i]);
    var args = provider.params.map((token, idx) => {

      if (delayingInstantiation) {
        return this.get(token, resolving, true, provider.paramsLazily[idx]);
      }

      return this.get(token, resolving, provider.paramsPromises[idx], provider.paramsLazily[idx]);
    });

    // Delaying the instantiation - return a promise.
    if (delayingInstantiation) {
      var delayedResolving = resolving.slice();

      resolving.pop();

      // Once all dependencies (promises) are resolved, instantiate.
      return Promise.all(args).then(function(args) {
        var instance = provider.create(args, resolving, token);

        injector.cache.set(token, instance);

        // TODO(vojta): if a provider returns a promise (but is not declared as @ProvidePromise),
        // here the value will get unwrapped (because it is returned from a promise callback) and
        // the actual value will be injected. This is probably not desired behavior. Maybe we could
        // get rid off the @ProvidePromise and just check the returned value, whether it is
        // a promise or not.
        return instance;

      });
    }

    instance = provider.create(args, resolving, token);

    if (!hasAnnotation(provider.provider, TransientScope)) {
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
