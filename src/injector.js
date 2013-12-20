import {getProvideAnnotation, getInjectAnnotation} from './annotations';


// TODO(vojta): this is super lame, figure out something better.
function isClass(clsOrFunction) {
  return Object.keys(clsOrFunction.prototype).length > 0;
}

class Injector {
  constructor(modules) {
    this.providers = Object.create(null);

    modules.forEach((m) => {
      Object.keys(m).forEach((key) => {
        var provider = m[key];
        var providedAs = getProvideAnnotation(provider, key);

        // if (providedAs) {
          this.providers[providedAs || key] = {
            provider: provider,
            params: getInjectAnnotation(provider) || [],
            isClass: isClass(provider)
          };
        // }
      });
    });
  }

  get(token) {
    var provider = this.providers[token];
    var args = provider.params.map((token) => {
      return this.get(token);
    });
    var context = undefined;

    if (provider.isClass) {
      context = Object.create(provider.provider.prototype);
    }

    return provider.provider.apply(context, args) || context;
  }

  invoke(fn, context) {

  }

  dump() {
    var links = [];

    Object.keys(this.providers).forEach((token) => {
      var provider = this.providers[token];
      provider.params.forEach((dependency) =>{
        links.push({
          source: token,
          target: dependency
        });
      });
    });

    console.log(JSON.stringify(links, null, 2))
  }
}


export {Injector};
