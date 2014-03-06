// This is the file that gets included when you use "di" module in Node.js.

// Include Traceur runtime.
require('traceur/bin/traceur-runtime');

// Node.js has to be run with --harmony_collections to support ES6 Map.
// If not defined, include a polyfill.
if (typeof Map === 'undefined') {
  require('es6-shim');
}

var annotations = require('../dist/cjs/annotations');
var injector =  require('../dist/cjs/injector');

// Public API
module.exports = {
  Injector: injector.Injector,
  InjectAnnotation: annotations.Inject,
  ProvideAnnotation: annotations.Provide,
  annotate: annotations.annotate
};
