import {Inject} from '../../src/annotations';
import {Electricity} from './electricity';

@Inject(Electricity)
export class Dishwasher {
  constructor(electricity) {
    this.electricity = electricity;
    this.name = 'dishwasher';
  }

  add(item) {
    console.log('Putting ' + item + ' into the dishwasher...');
  }
  wash() {
    console.log('Running the dishwasher...');
  }
}
