import {Inject} from '../../src/annotations';
import {Electricity} from './electricity';

@Inject(Electricity)
export class Fridge {
  constructor(electricity) {
    this.electricity = electricity;
    this.name = 'fridge';
  }

  getEggs() {
    return '3 eggs';
  }
}
