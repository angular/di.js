var di = require('di');
var Engine = require('../engine');

var MockEngine = function() {};
MockEngine.prototype = {
  state: 'running'
};

di.annotate(MockEngine, new di.Provide(Engine));

module.exports = MockEngine;
