import {Kitchen} from './kitchen';
import {CoffeeMaker} from './coffee_maker';
import {Grinder} from './grinder';
import {Electricity} from './electricity';
import {Pump} from './pump';
import {Heater} from './heater';
import {Skillet} from './skillet';
import {Stove} from './stove';
import {Fridge} from './fridge';
import {Dishwasher} from './dishwasher';


function main() {
  var electricity = new Electricity();
  var skillet = new Skillet();
  var stove = new Stove(electricity);
  var fridge = new Fridge(electricity);
  var dishwasher = new Dishwasher(electricity);

  // assemble the CoffeeMaker
  var grinder = new Grinder(electricity);
  var heater = new Heater(electricity);
  var pump = new Pump(heater, electricity);
  var coffeeMaker = new CoffeeMaker(grinder, pump, heater);

  // assemble the Kitchen
  var kitchen = new Kitchen(coffeeMaker, skillet, stove, fridge, dishwasher);

  // finally, make the breakfast
  kitchen.makeBreakfast();
}

main();
