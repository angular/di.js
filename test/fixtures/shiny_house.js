import {Inject, Provide} from '../../src/annotations';

@Provide('House')
@Inject('Kitchen')
export class ShinyHouse {
  constructor(kitchen) {}

  nothing() {}
}

export var module = [ShinyHouse];
