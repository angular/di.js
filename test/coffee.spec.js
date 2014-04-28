import {Injector} from '../src/injector';

import {module as coffeeModule} from '../example/coffee/coffee_module';
import {CoffeeMaker} from '../example/coffee/coffee_maker';
import {MockHeater} from '../example/coffee/mock_heater';


describe('coffee example', function() {
  it('should work', function() {
    var i = new Injector(coffeeModule);

    i.get(CoffeeMaker).brew();
  });


  it('should work with mocked heater', function() {
    var i = new Injector([MockHeater]);

    i.get(CoffeeMaker).brew();
  });
});
