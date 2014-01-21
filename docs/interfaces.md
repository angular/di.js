# Using "interfaces"

This DI framework uses annotations to figure out what dependencies particular provider needs. You can use *anything* as a token (Angular v1.x uses strings). The recomended way is to use references to the actual dependencies, as shown in the [example]. That has a couple benefits:
- the framework can use these classes as default providers,
- no conflicts,
- easy minification.

This works very well until you override providers. If you override a provider, the original class is still imported (because it is used as the token). All the transitive dependencies are imported too. In the [example], `MockHeater` is used but the real `Heater` is still imported, even though it is not used.

For small objects, this is not a problem. **For a bigger object you wanna use an interface**, which is an empty class without any dependencies.

You can easily refactor an existing provider into an "interface" once it gets too big. Here is an example - let's say `Heater` is too big (or has many dependencies), we don't wanna import it when using `MockHeater`.

```js
// heater.js
// This is the interface which is used as the token and therefore always imported.
class Heater {}

// electric_heater.js
// This is the real implementation (with many dependencies and tons of code), only imported when used.
import {Heater} from './heater';

@Provide(Heater)
class ElectricHeater {
  // ...
}

// mock_heater.js
// This is the mock version.
import {Heater} from './heater';

@Provide(Heater)
class MockHeater {
  // ...
}
```

Now, only the interface (`Heater` - an empty class) is always imported.

[example]: ./example/kitchen-di
