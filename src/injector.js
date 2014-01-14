import {getProvideAnnotation, getInjectAnnotation} from './annotations';

// TODO(vojta): move to profiler/debug module
var globalCounter = 0;
function getUniqueId() {
  return ++globalCounter;
}

// TODO(vojta): this is super lame, figure out something better.
function isClass(clsOrFunction) {
  return Object.keys(clsOrFunction.prototype).length > 0;
}

// I know, this is lame...
function hash(fn) {
  return fn && fn.toString();
}


class Injector {
  constructor(modules, parentInjector = null) {
    // TODO(vojta): use Map once available
    this.providers = Object.create(null);
    this.cache = Object.create(null);
    this.parent = parentInjector;
    this.id = getUniqueId();

    for (var module of modules) {
      Object.keys(module).forEach((key) => {
        var provider = module[key];
        var providedAs = hash(getProvideAnnotation(provider)) || key;
        var params = getInjectAnnotation(provider) || [];
        // console.log('registering provider for', providedAs || key, params);
        // if (providedAs) {
          this.providers[providedAs] = {
            provider: provider,
            params: params,
            isClass: isClass(provider)
          };
        // }
      });
    }
  }

  get(token, resolving = []) {
    var defaultProvider = null;

    if (typeof token === 'function') {
      defaultProvider = token;
      token = hash(token);
    }

    if (Object.hasOwnProperty.call(this.cache, token)) {
      return this.cache[token];
    }

    var provider = this.providers[token];
    var resolvingMsg = '';

    if (!provider && defaultProvider) {
      provider = {
        provider: defaultProvider,
        params: getInjectAnnotation(defaultProvider) || [],
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

    this.cache[token] = provider.provider.apply(context, args) || context;

    resolving.pop();

    return this.cache[token];
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
