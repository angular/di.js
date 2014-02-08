[![Build Status](https://travis-ci.org/angular/di.js.png?branch=master)](https://travis-ci.org/angular/di.js)

## Dependency Injection v2

This readme describes how to set up your working space in order to run the tests and hack on it. See [How can I use it](./docs/how-can-i-use-it.md) on how to use this DI framework in your project.

### Installation
```bash
# Clone this repo (or your fork).
git clone https://github.com/angular/di.js.git

# Install all the the dev dependencies, such as Karma, Gulp, etc.
npm install

# If you wanna use "karma" or "gulp" commands, install also:
npm install -g karma-cli
npm install -g gulp
```

### Running the [tests](./test/)
This will start Karma and Chrome (with `--harmony` enabled). Karma will watch the source code and run the tests anytime you save a change.

```bash
karma start
```

### Transpiling ES6
All the source code is written in the upcoming version of JavaScript - ES6. In order to use it in the current browsers you need to transpile the code into ES5 using [Traceur].


```bash
# Transpile ES6 into ./compiled/*
gulp build

# Watch all the sources and transpile on any change
gulp watch
```


### Examples
```bash
gulp build_examples
gulp serve
```


### More stuff

I talked about this DI framework at the [ng-conf], here are some more links...

  - [video](http://www.youtube.com/watch?v=_OGGsf1ZXMs)
  - [slides](https://dl.dropboxusercontent.com/u/36607830/talks/ng-conf-di-v2.pdf) ([annotated version](https://dl.dropboxusercontent.com/u/36607830/talks/ng-conf-di-v2-annotated.pdf))

Also, [here](https://docs.google.com/document/d/1fTR4TcTGbmExa5w2SRNAkM1fsB9kYeOvfuiI99FgR24/edit?usp=sharing) is the original design doc, which is quickly becoming out-dated ;-)

[Traceur]: https://github.com/google/traceur-compiler
[ng-conf]: http://ng-conf.org/
