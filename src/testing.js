import {Injector} from './injector';
import {Inject, annotate, readAnnotations} from './annotations';
import {isFunction} from './util';
import {createProviderFromFnOrClass} from './providers';


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
            providers.set(providerWrapper.as, createProviderFromFnOrClass(function() {
              return providerWrapper.provider;
            }, {provide: {token: null, isPromise: false}, params: []}));
          } else {
            // a fn/class provider with overridden token
            annotations = readAnnotations(providerWrapper.provider);
            providers.set(providerWrapper.as, createProviderFromFnOrClass(providerWrapper.provider, annotations));
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
