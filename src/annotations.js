import {isFunction} from './util';

class SuperConstructor {}

// TODO(vojta): tokens, id -> token, Inject/ProvidePromise extends and defines isPromise?
class InjectAnnotation {
  constructor(...params) {
    this.params = params;
  }
}

class InjectPromiseAnnotation {
  constructor(...params) {
    this.params = params;
  }
}

class ProvideAnnotation {
  constructor(id) {
    this.id = id;
  }
}

class ProvidePromiseAnnotation {
  constructor(id) {
    this.id = id;
  }
}

// aliases
var Inject = InjectAnnotation;
var InjectPromise = InjectPromiseAnnotation;
var Provide = ProvideAnnotation;
var ProvidePromise = ProvidePromiseAnnotation;

// Helpers for when annotations are not enabled in Traceur.
function annotate(fn, annotation) {
  fn.annotations = fn.annotations || [];
  fn.annotations.push(annotation);
}


function hasAnnotation(fn, annotationClass) {
  if (!fn.annotations || fn.annotations.length === 0) {
    return false;
  }

  for (var annotation of fn.annotations) {
    if (annotation instanceof annotationClass) {
      return true;
    }
  }

  return false;
}


function readAnnotations(fn) {
  var collectedAnnotations = {
    token: null,
    isPromise: false,
    argTokens: [],
    argPromises: []
  };

  if (fn.annotations && fn.annotations.length) {
    for (var annotation of fn.annotations) {
      if (annotation instanceof InjectAnnotation) {
        collectedAnnotations.argTokens = annotation.params;
      }

      if (annotation instanceof ProvideAnnotation) {
        collectedAnnotations.token = annotation.id;
        collectedAnnotations.isPromise = false;
      }

      if (annotation instanceof ProvidePromiseAnnotation) {
        collectedAnnotations.token = annotation.id;
        collectedAnnotations.isPromise = true;
      }
    }
  }

  // Read annotations for individual parameters.
  if (fn.parameters) {
    fn.parameters.forEach((param, idx) => {
      for (var paramAnnotation of param) {
        // Type annotation.
        if (isFunction(paramAnnotation) && !collectedAnnotations.argTokens[idx]) {
          collectedAnnotations.argTokens[idx] = paramAnnotation;
          collectedAnnotations.argPromises[idx] = false;
        } else if (paramAnnotation instanceof InjectAnnotation) {
          collectedAnnotations.argTokens[idx] = paramAnnotation.params[0];
          collectedAnnotations.argPromises[idx] = false;
        } else if (paramAnnotation instanceof InjectPromiseAnnotation) {
          collectedAnnotations.argTokens[idx] = paramAnnotation.params[0];
          collectedAnnotations.argPromises[idx] = true;
        }
      }
    });
  }

  return collectedAnnotations;
}


export {
  annotate,
  SuperConstructor,
  Inject,
  InjectAnnotation,
  InjectPromise,
  InjectPromiseAnnotation,
  Provide,
  ProvideAnnotation,
  ProvidePromise,
  ProvidePromiseAnnotation,
  hasAnnotation,
  readAnnotations
}
