import {Inject} from 'di';
import {Electricity} from './electricity';

@Inject(Electricity)
export class Fridge {
  constructor(electricity) {
    this.electricity = electricity;
  }

  getEggs() {
    return '3 eggs';
  }
}
