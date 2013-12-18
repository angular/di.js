import {Foo} from '../src/foo.js';

describe('Foo', () => {
  it('should sum numbers', () => {
    var f = new Foo();
    expect(f.sum(1, 2)).toBe(3);
  });
});
