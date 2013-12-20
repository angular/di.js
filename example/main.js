import {Injector} from '../src/injector';

module coffeeModule from './coffee/coffee_module';


var i = new Injector([coffeeModule]);

i.get('CoffeeMaker').brew();
