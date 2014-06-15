import {
  hasAnnotation,
  readAnnotations,
  Inject,
  InjectLazy,
  InjectPromise,
  Provide,
  ProvidePromise
} from '../src/annotations';


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

  it('should read @Provide', function() {
    class Bar {}

    @Provide(Bar)
    class Foo {}

    var annotations = readAnnotations(Foo);

    expect(annotations.provide.token).toBe(Bar);
    expect(annotations.provide.isPromise).toBe(false);
  });


  it('should read @ProvidePromise', function() {
    class Bar {}

    @ProvidePromise(Bar)
    class Foo {}

    var annotations = readAnnotations(Foo);

    expect(annotations.provide.token).toBe(Bar);
    expect(annotations.provide.isPromise).toBe(true);
  });


  it('should read @Inject', function() {
    class One {}
    class Two {}

    @Inject(One, Two)
    class Foo {}

    var annotations = readAnnotations(Foo);

    expect(annotations.params[0].token).toBe(One);
    expect(annotations.params[0].isPromise).toBe(false);
    expect(annotations.params[0].isLazy).toBe(false);

    expect(annotations.params[1].token).toBe(Two);
    expect(annotations.params[1].isPromise).toBe(false);
    expect(annotations.params[1].isLazy).toBe(false);
  });


  it('should read @Inject on a parameter', function() {
    class One {}
    class Two {}

    class Foo {
      constructor(@Inject(One) one, @Inject(Two) two) {}
    }

    var annotations = readAnnotations(Foo);

    expect(annotations.params[0].token).toBe(One);
    expect(annotations.params[0].isPromise).toBe(false);
    expect(annotations.params[0].isLazy).toBe(false);

    expect(annotations.params[1].token).toBe(Two);
    expect(annotations.params[1].isPromise).toBe(false);
    expect(annotations.params[1].isLazy).toBe(false);
  });


  it('should read @InjectLazy on a parameter', function() {
    class One {}

    class Foo {
      constructor(@InjectLazy(One) one) {}
    }

    var annotations = readAnnotations(Foo);

    expect(annotations.params[0].token).toBe(One);
    expect(annotations.params[0].isPromise).toBe(false);
    expect(annotations.params[0].isLazy).toBe(true);
  });


  it('should read @InjectPromise on a parameter', function() {
    class One {}

    class Foo {
      constructor(@InjectPromise(One) one) {}
    }

    var annotations = readAnnotations(Foo);

    expect(annotations.params[0].token).toBe(One);
    expect(annotations.params[0].isPromise).toBe(true);
    expect(annotations.params[0].isLazy).toBe(false);
  });


  it('should read type annotations', function() {
    class One {}
    class Two {}

    class Foo {
      constructor(one: One, two: Two) {}
    }

    var annotations = readAnnotations(Foo);

    expect(annotations.params[0].token).toBe(One);
    expect(annotations.params[0].isPromise).toBe(false);
    expect(annotations.params[0].isLazy).toBe(false);

    expect(annotations.params[1].token).toBe(Two);
    expect(annotations.params[1].isPromise).toBe(false);
    expect(annotations.params[1].isLazy).toBe(false);
  });

  it('should read stacked @Inject{Lazy, Promise} annotations', function() {
    class One {}
    class Two {}
    class Three {}

    @Inject(One)
    @InjectLazy(Two)
    @InjectPromise(Three)
    class Foo {}

    var annotations = readAnnotations(Foo);

    expect(annotations.params[0].token).toBe(One);
    expect(annotations.params[0].isPromise).toBe(false);
    expect(annotations.params[0].isLazy).toBe(false);

    expect(annotations.params[1].token).toBe(Two);
    expect(annotations.params[1].isPromise).toBe(false);
    expect(annotations.params[1].isLazy).toBe(true);

    expect(annotations.params[2].token).toBe(Three);
    expect(annotations.params[2].isPromise).toBe(true);
    expect(annotations.params[2].isLazy).toBe(false);
  });
});
