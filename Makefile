ifndef TRAVIS_BROWSERS
	TRAVIS_BROWSERS=Chrome
endif

test:
	karma start --single-run --browsers $(TRAVIS_BROWSERS)
	node example/node/test/main.test.js

.PHONY : test
