# Terminology

**Injector** - a container, capable of instantiating objects.

**Provider** - a recipe for constructing an object, typically a class or a factory function. A provider is typically annotated with Tokens, which tells Injector what dependencies particular provider needs.

**Token** - a contract, an identifier of a dependency. Typically a class or a string.


## An example

```js
@Provide(Heater)
class MockHeater {
  // ...
}

@Provide(Heater)
function createElectricHeater() {
  // ...
}
```

- Heater class is a token.
- MockHeater is a provider.
- createElectricHeater function is a provider.
