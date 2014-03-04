This is my attempt to explain "Service Locator", "Dependency Injection" and "Module Loading", based on how I understand it. I'm not saying this is some ultimate truth.

### Service Locator

```js
class Car {
  constructor(context) {
    this.engine = context.get('engine');
    this.transmission = context.get('transmission');
  }
}
```



### Dependency Injection

```js
class Car {
  @Inject(Engine, Transmission)
  constructor(engine, transmission) {
    this.engine = engine;
    this.transmission = transmission;
  }
}
```


### Why is DI better?
DI style is less coupled. If you wanna reuse `Car`, the only requirement is that there is something that acts as an engine and something that acts as a transmission. With the service locator, you need to make sure there is some context object with a `get` method that gives you these instances. This is not a terrible requirement, I know, but it is an additional requirement compare to the DI style. **DI style is cleaner, you can take the same code and use it without DI, assembling it manually.**

Service locator breaks the [Law of Demeter]. `Car` needs an engine and a transmission. So why bother with a context object? `Car` does not need it. This makes testing slightly more painful. Instead of creating just mocks, you need to create also this "context object".

With DI, the constructor serves as a documentation, you look at it and you know what you need in order to instantiate particular class. With service locator, the constructor basically lies to you. This can actually become a big deal. There are some big projects at Google using service locator pattern and I hate it! You spend so much time trying to figure out how to instantiate something you wanna use, because you have to scan the entire code to see what it really needs. Remember that the context can be passed around and so even a dependency can call `get()` on it. I wasted so much time with this.

Also, DI is declarative and that makes it easier for tooling. For instance checking the dependency graph statically will be much simpler than with the service locator.

I think it's easy to see that for describing depenendecies, declarative is better than imperative. Imperative code is good for describing behaviors not structures.

That said, service locator is much better than looking up dependencies in the global state, as it is more clear what the context is. Looking up dependencies in the global state is essentially a service locator pattern too - where the context is global state and its interface is not that clear.

I tried to explain why Dependency Injection is good in my [ng-conf talk] (in the first part). There is also the [testability interview repo] where I tried to show some of these problems.



### Module Loader (eg. RequireJS or ES6 module loader)
The purpose of a module loader is to load source files (locate them on the disk or network, fetch, evaluate, etc). I would call this "static dependencies" - one should be able to resolve them statically, without evaluating the code. DI resolves runtime dependencies between concrete instances. Thus DI and module loader should both work together and it is not a question of which one is better.

The problem is that many people are over-using module loaders (mostly RequireJS in the client and CommonJS in Node.js) for both "static" and "runtime" dependencies. In a more static environment (eg. C, Java, Dart), this is not even possible. It won't be possible with [ES6 modules] either.

If you wanna use just moduler loader (both for "static" and "runtime" dependencies), you need to keep state in these modules. Otherwise you won't be able to share instances (dependencies) between multiple objects (dependents).

This is very tricky to test. You need to clean up the state after each test, otherwise you get into troubles such as "this test is passing on its own, but failing when run in the whole suite". It is also very hard to mock things out.

These issues are caused by 1/ not having acces inside the module and 2/ modules being cached. Of course, JS is a very dynamic environment and so there are workarounds/hacks. There are different workarounds (see [proxyquire](https://github.com/thlorenz/proxyquire), [mockery](https://github.com/mfncooper/mockery), [rewire](https://github.com/jhnns/rewire), [injectr](https://github.com/nathanmacinnes/injectr), [squire](https://github.com/iammerrick/Squire.js/) and many more), but the point is more less always the same - make it possible to override stuff inside a module. I've done this too (see [Testing Private State and Mocking Dependencies]). I still use this technique in Karma. I hate it! I wish I never did it and can't wait to refactor it out. It causes so many subtle issues that are so hard to debug. I wasted so much time with this!

So Karma uses one of these hacks, `loadFile()` from [node-mocks], which evaluates the module again and again, so that you can pass in different mocks. It also exposes module internals. Here are some concrete issues with this approach. Well, just those I can remember right now:

1. You can't override the top level variables once module is instantiated (well, you can but it won't work the way you would expect), and so you end up putting stuff into object containers so that you can do it (after wasting some time to figure out why it silently did not work).
2. Stuff like `instanceof` don't work, as there are many "classes" of the same thing (because you evaluated the code many times) and in order to make instanceof to work, you have to compare the same references. Again, you will waste some time first to figure out why this is the case.
3. Tests are slow, because each module is executed many times (of course it also takes much more memory).
4. It's ugly.
5. Feels wrong.

I'm pretty sure there are many other issues that I have succesfully forgotten. Anyway, you can probably achieve all the stuff you need with it. You will just have to use some of these workarounds and will probably waste some time debugging issues caused by these worarounds. **The DI approach is cleaner and you don't need any workarounds. It's true that bringing a DI framework into your app also brings some additional complexity. I use DI framework because I think this additional complexity is worthy making my code cleaner.** I also want to make [di.js] as simple and transparent as possible, in order to minimize this additional cost.

So the best way that works for me right now is something like this: Modules are stateless. They only contain definitions of classes/functions/constants. I use module loader to load all the modules my app needs and Dependency Injection framework for assembling the app (resolving the runtime dependencies) based on declarative annotations.

That said, everybody can use whatever works for them ;-)


[Law of Demeter]: http://en.wikipedia.org/wiki/Law_of_Demeter
[ng-conf talk]: http://www.youtube.com/watch?v=_OGGsf1ZXMs
[testability interview repo]: https://github.com/vojtajina/testability-interview
[ES6 modules]: http://wiki.ecmascript.org/doku.php?id=harmony:modules
[Testing Private State and Mocking Dependencies]: http://howtonode.org/testing-private-state-and-mocking-deps
[node-mocks]: https://github.com/vojtajina/node-mocks
[di.js]: https://github.com/angular/di.js
