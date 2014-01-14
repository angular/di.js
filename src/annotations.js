class InjectAnnotation {
  constructor() {
    this.params = Array.prototype.slice.call(arguments);
  }
}

class ProvideAnnotation {
  constructor(id) {
    this.id = id;
  }
}

// aliases
var Inject = InjectAnnotation;
var Provide = ProvideAnnotation;

// Helpers for when annotations are not enabled in Traceur.
function annotate(fn, annotation) {
  fn.annotations = fn.annotations || [];
  fn.annotations.push(annotation);
}


function getProvideAnnotation(provider, defaultAnnotation) {
  if (!provider || !provider.annotations || !provider.annotations.length) {
    return null;
  }


  var annotations = provider.annotations;
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i] instanceof ProvideAnnotation) {
      return annotations[i].id || defaultAnnotation;
    }
  }

  return null;
}

function getInjectAnnotation(provider) {
  if (!provider || !provider.annotations || !provider.annotations.length) {
    return null;
  }

  var annotations = provider.annotations;
  for (var i = 0; i < annotations.length; i++) {
    if (annotations[i] instanceof InjectAnnotation) {
      return annotations[i].params;
    }
  }

  return null;
}

export {
  annotate,
  Inject,
  InjectAnnotation,
  Provide,
  ProvideAnnotation,
  getInjectAnnotation,
  getProvideAnnotation
}
