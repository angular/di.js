import {Injector} from './injector';
import {Inject, annotate, readAnnotations} from './annotations';
import {isUpperCase, isClass, isFunction, isObject} from './util';

var currentSpec = null;
beforeEach(function() {
  currentSpec = this;
  currentSpec.$$providers = [];
});

afterEach(function() {
  currentSpec.$$providers = null;
  currentSpec.$$injector = null;
  currentSpec = null;
});

function isRunning() {
  return !!currentSpec;
}

function use(mock) {
  if (currentSpec && currentSpec.$$injector) {
    throw new Error('Cannot call use() after inject() has already been called.');
  }

  var providerWrapper = {
    provider: mock
  };

  var fn = function() {
    currentSpec.$$providers.push(providerWrapper);
  };

  fn.as = function(token) {
    if (currentSpec && currentSpec.$$injector) {
      throw new Error('Cannot call as() after inject() has already been called.');
    }

    providerWrapper.as = token;
    if (isRunning()) {
      return undefined;
    }

    return fn;
  };

  if (isRunning()) {
    fn();
  }

  return fn;
}

function inject(...params) {
  var behavior = params.pop();

  annotate(behavior, new Inject(...params));

  var run = function() {
    if (!currentSpec.$$injector) {
      var providers = new Map();
      var modules = [];
      var annotations;

      currentSpec.$$providers.forEach(function(providerWrapper) {
        if (!providerWrapper.as) {
          // load as a regular module
          modules.push(providerWrapper.provider);
        } else {
          if (!isFunction(providerWrapper.provider)) {
            // inlined mock
            // TODO(vojta): use FactoryProvider
            providers.set(providerWrapper.as, {
              /*jshint loopfunc:true */
              provider: function() {return providerWrapper.provider;},
              /*jshint loopfunc:false */
              isPromise: false,
              params: [],
              paramsPromises: [],
              isClass: false,
              /*jshint loopfunc:true */
              create: function() {return providerWrapper.provider;}
              /*jshint loopfunc:false */
            });
          } else {
            // a fn/class provider with overriden token
            // TODO(vojta): use Class/FactoryProvider
            annotations = readAnnotations(providerWrapper.provider);
            providers.set(providerWrapper.as, {
              provider: providerWrapper.provider,
              isPromise: annotations.isPromise,
              params: annotations.injectTokens,
              paramsPromises: annotations.injectPromises,
              isClass: isClass(providerWrapper.provider),
              create: function(args) {
                if (isClass(providerWrapper.provider)) {
                  var context = Object.create(providerWrapper.provider.prototype);
                  var returnedValue = providerWrapper.provider.apply(context, args);

                  if (!isFunction(returnedValue) && !isObject(returnedValue)) {
                    return context;
                  }

                  return returnedValue;
                } else {
                  return providerWrapper.provider.apply(undefined, args);
                }
              }
            });
          }
        }
      });

      currentSpec.$$injector = new Injector(modules, null, providers);
    }

    currentSpec.$$injector.get(behavior);
  };

  return isRunning() ? run() : run;
}

export {
  use, inject
};
