import {isFunction} from './util';

class SuperConstructor {}

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
    this.tokens = tokens;
    this.isPromise = true;
    this.isLazy = false;
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
    this.token = token;
    this.isPromise = true;
  }
}

class InjectLazy extends Inject {
  constructor(...tokens) {
    this.tokens = tokens;
    this.isPromise = false;
    this.isLazy = true;
  }
}


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
        collectedAnnotations.params = annotation.tokens.map((token) => {
          return {token: token, isPromise: annotation.isPromise, isLazy: annotation.isLazy};
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
  ProvidePromise
};
