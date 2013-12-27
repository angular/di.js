import {annotate, InjectAnnotation} from '../../src/annotations';

export class ShinyHouse {
  constructor(kitchen) {}

  nothing() {}
}


// @Inject('Kitchen')
annotate(ShinyHouse, new InjectAnnotation('Kitchen'));
