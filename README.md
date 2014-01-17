## Dependency Injection v2

### Installation
```bash
# Install all the the dev deps, such as Karma, Grunt, ...
npm install

# If you wanna use "karma" or "grunt" commands, install also
npm install -g karma-cli
npm install -g grunt-cli
```

### Running the [tests](./test/)
```bash
karma start
```

### Transpiling ES6

```bash
# Transpile ES6 into ./compiled/*
grunt traceur

# Watch all the sources and transpile on any change
grunt watch
```


### Examples
```bash
grunt traceur
grunt serve
```


### More stuff

I talked about this DI framework at the ng-conf, here are some more links...

  - [video](http://www.youtube.com/watch?v=_OGGsf1ZXMs)
  - [slides](https://dl.dropboxusercontent.com/u/36607830/talks/ng-conf-di-v2.pdf) ([annotated version](https://dl.dropboxusercontent.com/u/36607830/talks/ng-conf-di-v2-annotated.pdf))

Also, [here](https://docs.google.com/document/d/1fTR4TcTGbmExa5w2SRNAkM1fsB9kYeOvfuiI99FgR24/edit?usp=sharing) is the original design doc, which is quickly becoming out-dated ;-)
