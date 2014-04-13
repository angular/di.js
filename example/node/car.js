var di = require('di');
var Engine = require('./engine');

var Car = function(engine) {
  this.engine = engine;
};

Car.prototype = {
  run: function() {
    this.engine.start();
  },
  isRunning: function() {
    return this.engine.state === 'running';
  }
};

di.annotate(Car, new di.Inject(Engine));

module.exports = Car;
