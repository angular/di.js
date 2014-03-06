import {Injector} from './injector';
import {Inject, annotate, readAnnotations} from './annotations';
import {isUpperCase, isClass} from './util';

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

      for (var providerWrapper of currentSpec.$$providers) {
        if (!providerWrapper.as) {
          // load as a regular module
          modules.push(providerWrapper.provider);
        } else {
          if (typeof providerWrapper.provider !== 'function') {
            // inlined mock
            providers.set(providerWrapper.as, {
              provider: function() {return providerWrapper.provider},
              isPromise: false,
              params: [],
              paramsPromises: [],
              isClass: false
            });
          } else {
            // a fn/class provider with overriden token
            annotations = readAnnotations(providerWrapper.provider);
            providers.set(providerWrapper.as, {
              provider: providerWrapper.provider,
              isPromise: annotations.isPromise,
              params: annotations.injectTokens,
              paramsPromises: annotations.injectPromises,
              isClass: isClass(providerWrapper.provider)
            });
          }
        }
      };

      currentSpec.$$injector = new Injector(modules, null, providers);
    }

    currentSpec.$$injector.get(behavior);
  };

  return isRunning() ? run() : run;
}

export {
  use, inject
}
