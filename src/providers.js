import {SuperConstructor, readAnnotations} from './annotations';
import {isClass, isFunction, isObject, toString} from './util';


// Provider is responsible for creating instances.
//
// responsibilities:
// - create instances
//
// communication:
// - exposes `create()` which creates an instance of something
// - exposes `params` (information about which arguments it requires to be passed into `create()`)
//
// Injector reads `provider.params` first, create these dependencies (however it wants),
// then calls `provider.create(args)`, passing in these arguments.


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


// ClassProvider knows how to instantiate classes.
//
// If a class inherits (has parent constructors), this provider normalizes all the dependencies
// into a single flat array first, so that the injector does not need to worry about inheritance.
//
// - all the state is immutable (constructed)
//
// TODO(vojta): super constructor - should be only allowed during the constructor call?
// TODO(vojta): support async arguments for super constructor?
class ClassProvider {
  // TODO(vojta): should only need a class, remove `annotations`
  constructor(provider, annotations) {
    // TODO(vojta): can we hide this.provider? (only used for hasAnnotation(provider.provider))
    this.provider = provider;
    this.isPromise = annotations.provide.isPromise;

    this.params = [];
    this.superConstructorPositions = [];

    this._flattenParams(provider, annotations);
    this.superConstructorPositions.unshift([provider, 0, this.params.length - 1]);
  }

  // Normalize params for all the constructors (in the case of inheritance),
  // into a single flat array of DependencyDesriptors.
  // So that the injector does not have to worry about inheritance.
  //
  // This function mutates `this.params` and `this.superConstructorPositions`,
  // but it is only called during the constructor.
  // TODO(vojta): remove the annotations argument?
  _flattenParams(provider, annotations) {
    var token;
    var superConstructor;
    var superConstructorFrame;

    for (var param of annotations.params) {
      if (param.token === SuperConstructor) {
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
        this.params.push(param);
      }
    }
  }

  // Basically the reverse process to `this._flattenParams`:
  // We get arguments for all the constructors as a single flat array.
  // This method generates pre-bound "superConstructor" wrapper with correctly passing arguments.
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

  // It is called by injector to create an instance.
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


// FactoryProvider knows how to create instance from a factory function.
// - all the state is immutable
class FactoryProvider {
  // TODO(vojta): should only accept factory function, not `annotations`
  constructor(provider, annotations) {
    this.provider = provider;
    this.isPromise = annotations.provide.isPromise;
    this.params = annotations.params;

    for (var param of this.params) {
      if (param.token === SuperConstructor) {
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
