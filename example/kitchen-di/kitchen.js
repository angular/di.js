import {Inject} from 'di';
import {CoffeeMaker} from './coffee_maker/coffee_maker';
import {Skillet} from './skillet';
import {Stove} from './stove';
import {Fridge} from './fridge';
import {Dishwasher} from './dishwasher';

@Inject(CoffeeMaker, Skillet, Stove, Fridge, Dishwasher)
export class Kitchen {
  constructor(coffeeMaker, skillet, stove, fridge, dishwasher) {
    this.coffeeMaker = coffeeMaker;
    this.skillet = skillet;
    this.stove = stove;
    this.fridge = fridge;
    this.dishwasher = dishwasher;
  }

  makeScrambledEggs() {
    console.log('Making some eggs...');
    this.skillet.add(this.fridge.getEggs());
    this.stove.add(this.skillet);
    this.stove.on();
    this.stove.off();
    console.log('Scrambled eggs are ready.');
  }

  makeBreakfast() {
    // make a cofee
    this.coffeeMaker.brew();

    // make some eggs
    this.makeScrambledEggs();

    // clean the dishes
    this.dishwasher.add(this.skillet);
    this.dishwasher.wash();
  }
}
