import {SuperConstructor, readAnnotations} from './annotations';
import {isClass, isFunction, isObject, toString} from './util';


// TODO(vojta): duplicate from injector.js, remove
function constructResolvingMessage(resolving, token = null) {
  if (token) {
    resolving.push(token);
  }

  if (resolving.length > 1) {
    return ` (${resolving.map(toString).join(' -> ')})`;
  }

  return '';
}


var EmptyFunction = Object.getPrototypeOf(Function);


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


export function createProviderFromFnOrClass(fnOrClass, annotations) {
  if (isClass(fnOrClass)) {
    return new ClassProvider(fnOrClass, annotations);
  }

  return new FactoryProvider(fnOrClass, annotations);
}
