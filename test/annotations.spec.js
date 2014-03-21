import {hasAnnotation, readAnnotations} from '../src/annotations';


describe('hasAnnotation', function() {

  it('should return false if fn not annotated', function() {
    function foo() {}
    class Bar {}
    class SomeAnnotation {}

    expect(hasAnnotation(foo, SomeAnnotation)).toBe(false);
    expect(hasAnnotation(Bar, SomeAnnotation)).toBe(false);
  });


  it('should return true if the fn has an instance of given annotation', function() {
    class SomeAnnotation {}

    @SomeAnnotation
    function foo() {}

    expect(hasAnnotation(foo, SomeAnnotation)).toBe(true);
  });


  it('should return false if fn does not have given annotation', function() {
    class YepAnnotation {}
    class NopeAnnotation {}

    @YepAnnotation
    function foo() {}

    expect(hasAnnotation(foo, NopeAnnotation)).toBe(false);
  });
});


describe('readAnnotations', function() {

});
