import {annotate, InjectAnnotation, ProvideAnnotation} from '../../src/annotations';

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
annotate(House, new InjectAnnotation('Kitchen'));

// @Inject('Sink')
annotate(Kitchen, new InjectAnnotation('Sink'));
