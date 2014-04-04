import {annotate, Inject} from '../../src/annotations';

export class ShinyHouse {
  constructor(kitchen) {}

  nothing() {}
}


// @Inject('Kitchen')
annotate(ShinyHouse, new Inject('Kitchen'));
