import {isFunction} from './util';

class SuperConstructor {}

class InjectAnnotation {
  constructor(...tokens) {
    this.tokens = tokens;
    this.isPromise = false;
  }
}

class InjectPromiseAnnotation extends InjectAnnotation {
  constructor(...tokens) {
    this.tokens = tokens;
    this.isPromise = true;
  }
}

class ProvideAnnotation {
  constructor(token) {
    this.token = token;
    this.isPromise = false;
  }
}

class ProvidePromiseAnnotation extends ProvideAnnotation {
  constructor(token) {
    this.token = token;
    this.isPromise = true;
  }
}

class InjectLazyAnnotation extends InjectAnnotation {
  constructor(...tokens) {
    this.tokens = tokens;
    this.isPromise = false;
    this.isLazy = true;
  }
}

// aliases
var Inject = InjectAnnotation;
var InjectPromise = InjectPromiseAnnotation;
var Provide = ProvideAnnotation;
var ProvidePromise = ProvidePromiseAnnotation;
var InjectLazy = InjectLazyAnnotation;

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
    // A token, what is provided by given function.
    // Parsed from @Provide or @ProvidePromise
    provideToken: null,
    // Boolean.
    // Does the provider provide the value as a promise?
    isPromise: false,
    // List of tokens.
    // What dependencies does this provide require?
    injectTokens: [],
    // List of booleans.
    // Is given dependency required as a promise?
    injectPromises: [],
    // List of booleans.
    // Is given dependency required lazily?
    injectLazily: []
  };

  if (fn.annotations && fn.annotations.length) {
    for (var annotation of fn.annotations) {
      if (annotation instanceof InjectAnnotation) {
        collectedAnnotations.injectTokens = annotation.tokens;
        // TODO(vojta): set injectPromises
        // TODO(vojta): set injectLazily
      }

      if (annotation instanceof ProvideAnnotation) {
        collectedAnnotations.provideToken = annotation.token;
        collectedAnnotations.isPromise = annotation.isPromise;
      }
    }
  }

  // Read annotations for individual parameters.
  if (fn.parameters) {
    fn.parameters.forEach((param, idx) => {
      for (var paramAnnotation of param) {
        // Type annotation.
        if (isFunction(paramAnnotation) && !collectedAnnotations.injectTokens[idx]) {
          collectedAnnotations.injectTokens[idx] = paramAnnotation;
          collectedAnnotations.injectPromises[idx] = false;
          collectedAnnotations.injectLazily[idx] = false;
        } else if (paramAnnotation instanceof InjectAnnotation) {
          collectedAnnotations.injectTokens[idx] = paramAnnotation.tokens[0];
          collectedAnnotations.injectPromises[idx] = paramAnnotation.isPromise;
          collectedAnnotations.injectLazily[idx] = paramAnnotation.isLazy;
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
  InjectLazy,
  InjectLazyAnnotation,
  Provide,
  ProvideAnnotation,
  ProvidePromise,
  ProvidePromiseAnnotation,
  hasAnnotation,
  readAnnotations
};
