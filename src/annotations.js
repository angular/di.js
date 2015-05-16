import {isFunction} from './util';

// This module contains:
// - built-in annotation classes
// - helpers to read/write annotations


// ANNOTATIONS

// A built-in token.
// Used to ask for pre-injected parent constructor.
// A class constructor can ask for this.
class SuperConstructor {}

// A built-in scope.
// Never cache.
class TransientScope {}

class Inject {
  constructor(...tokens) {
    this.tokens = tokens;
    this.isPromise = false;
    this.isLazy = false;
  }
}

class InjectPromise extends Inject {
  constructor(...tokens) {
    super();
    this.tokens = tokens;
    this.isPromise = true;
    this.isLazy = false;
  }
}

class InjectLazy extends Inject {
  constructor(...tokens) {
    super();
    this.tokens = tokens;
    this.isPromise = false;
    this.isLazy = true;
  }
}

class Provide {
  constructor(token) {
    this.token = token;
    this.isPromise = false;
  }
}

class ProvidePromise extends Provide {
  constructor(token) {
    super();
    this.token = token;
    this.isPromise = true;
  }
}

class ClassProvider {}
class FactoryProvider {}


// HELPERS

// Append annotation on a function or class.
// This can be helpful when not using ES6+.
function annotate(fn, annotation) {
  fn.annotations = fn.annotations || [];
  fn.annotations.push(annotation);
}


// Read annotations on a function or class and return whether given annotation is present.
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


// Read annotations on a function or class and collect "interesting" metadata:
function readAnnotations(fn) {
  var collectedAnnotations = {
    // Description of the provided value.
    provide: {
      token: null,
      isPromise: false
    },

    // List of parameter descriptions.
    // A parameter description is an object with properties:
    // - token (anything)
    // - isPromise (boolean)
    // - isLazy (boolean)
    params: []
  };

  if (fn.annotations && fn.annotations.length) {
    for (var annotation of fn.annotations) {
      if (annotation instanceof Inject) {
        annotation.tokens.forEach((token) => {
          collectedAnnotations.params.push({
            token: token,
            isPromise: annotation.isPromise,
            isLazy: annotation.isLazy
          });
        });
      }

      if (annotation instanceof Provide) {
        collectedAnnotations.provide.token = annotation.token;
        collectedAnnotations.provide.isPromise = annotation.isPromise;
      }
    }
  }

  // Read annotations for individual parameters.
  if (fn.parameters) {
    fn.parameters.forEach((param, idx) => {
      for (var paramAnnotation of param) {
        // Type annotation.
        if (isFunction(paramAnnotation) && !collectedAnnotations.params[idx]) {
          collectedAnnotations.params[idx] = {
            token: paramAnnotation,
            isPromise: false,
            isLazy: false
          };
        } else if (paramAnnotation instanceof Inject) {
          collectedAnnotations.params[idx] = {
            token: paramAnnotation.tokens[0],
            isPromise: paramAnnotation.isPromise,
            isLazy: paramAnnotation.isLazy
          };
        }
      }
    });
  }

  return collectedAnnotations;
}


export {
  annotate,
  hasAnnotation,
  readAnnotations,

  SuperConstructor,
  TransientScope,
  Inject,
  InjectPromise,
  InjectLazy,
  Provide,
  ProvidePromise,
  ClassProvider,
  FactoryProvider
};
