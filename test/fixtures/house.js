import {Inject, Provide} from '../../src/annotations';

// This is an example of using string as tokens.

@Provide('House')
@Inject('Kitchen')
export class House {
  constructor(kitchen) {

  }

  nothing() {}
}

@Provide('Kitchen')
@Inject('Sink')
export class Kitchen {
  constructor(sink) {

  }

  nothing() {}
}

// Sink is missing.
// @Provide('Sink')
// export class Sink {
//   nothing() {}
// }

export var module = [House, Kitchen];
