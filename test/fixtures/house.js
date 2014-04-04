import {annotate, Inject, Provide} from '../../src/annotations';

export class House {
  constructor(kitchen) {

  }

  nothing() {}
}

export class Kitchen {
  constructor(sink) {

  }

  nothing() {}
}

// Sink is missing.
// export class Sink {
//   nothing() {}
// }



// @Inject('Kitchen')
annotate(House, new Inject('Kitchen'));

// @Inject('Sink')
annotate(Kitchen, new Inject('Sink'));
