# How can I use it?

## In the browser
See the [kitchen-di example](../example/kitchen-di/index.html) on how to use the DI with [RequireJS].

You will need:
- a browser that supports `Map`, or include a polyfill,
- include the [Traceur runtime].

## In Node.js
```bash
npm install di --tag v2
```

See the [node example] on how to use the DI in regular ES5.

## Using ES6
If you decide to write your project in ES6, you can consume the ES6 source code in [`src/`] and compile it with [Traceur] on your own, similar to the [kitchen-di example].


[kitchen-di example]: ../example/kitchen-di
[RequireJS]: http://requirejs.org/
[Traceur runtime]: https://github.com/google/traceur-compiler/blob/master/src/runtime/runtime.js
[node example]: ../example/node
[`src/`]: ../src
[Traceur]: https://github.com/google/traceur-compiler
