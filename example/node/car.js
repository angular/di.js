var Engine = require('./engine');
var di = require('di');

var Car = function(engine) {
  this.engine = engine;
};

Car.prototype = {
  run: function() {
    this.engine.start();
  }
};

di.annotate(Car, new di.Inject(Engine));

module.exports = Car;
