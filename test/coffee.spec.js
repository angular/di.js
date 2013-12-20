import {Injector} from '../src/injector';

import {MockHeater} from '../example/coffee/mock_heater';
module coffeeModule from '../example/coffee/coffee_module';


describe('coffee example', function() {
  it('should work', function() {
    var i = new Injector([coffeeModule]);

    i.get('CoffeeMaker').brew();
  });


  it('should work with mocked heater', function() {
    var mockModule = {
      Heater: MockHeater
    };

    var i = new Injector([coffeeModule, mockModule]);

    i.get('CoffeeMaker').brew();
  });
});
