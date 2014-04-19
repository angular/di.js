var di = require('di');
var Car = require('../car');
var MockEngine = require('./mock_engine');

describe('Car', function() {
  beforeEach(function() {
    var injector = new di.Injector([MockEngine]);
    this.car = injector.get(Car);
  });

  it('is running', function() {
    expect(this.car.isRunning()).toBe(true);
  });
});
