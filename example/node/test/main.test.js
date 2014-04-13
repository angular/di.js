var di = require('di');
var assert = require('assert');
var Car = require('../car');
var MockEngine = require('./mock_engine');

var injector = new di.Injector([MockEngine]);
var car = injector.get(Car);

process.stdout.write('test: car should be running... ');
assert.ok(car.isRunning());
console.log('passed');
