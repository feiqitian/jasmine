/**
 * @constructor
 * @param {jasmine.Env} env
 * @param actual
 * @param {jasmine.Spec} spec
 */
jasmine.Matchers = function(env, actual, spec, opt_isNot) {
  //TODO: true dependency: equals, contains
  this.env = env;
  this.actual = actual;
  this.spec = spec;
  this.isNot = opt_isNot || false;
};

jasmine.Matchers.prototype.buildFailureMessage = function() {
  var args = Array.prototype.slice.call(arguments, 0),
    matcherName  = args[0],
    isNot = args[1],
    actual = args[2],
    expected = args.slice(3),
    englishyPredicate = matcherName.replace(/[A-Z]/g, function(s) { return ' ' + s.toLowerCase(); });

  var message = "Expected " +
    jasmine.pp(actual) +
    (isNot ? " not " : " ") +
    englishyPredicate;

  if (expected.length > 0) {
    for (var i = 0; i < expected.length; i++) {
      if (i > 0) message += ",";
      message += " " + jasmine.pp(expected[i]);
    }
  }

  return message + ".";
};


// TODO: probably kill all of this below



// todo: @deprecated as of Jasmine 0.11, remove soon [xw]
jasmine.Matchers.pp = function(str) {
  throw new Error("jasmine.Matchers.pp() is no longer supported, please use jasmine.pp() instead!");
};


jasmine.Matchers.wrapInto_ = function(prototype, matchersClass) {
  for (var methodName in prototype) {
    var orig = prototype[methodName];
    matchersClass.prototype[methodName] = jasmine.Matchers.matcherFn_(methodName, orig);
  }
};

jasmine.Matchers.matcherFn_ = function(matcherName, matcherFunction) {
  var matcherArgs = jasmine.util.argsToArray(arguments);
  this.matcherArgs = matcherArgs;
  this.matcherName = matcherName;

  return function() {

    var result = matcherFunction.apply(this, arguments);

    if (this.isNot) {
      result = !result;
    }

    var message;
    if (!result) {
      if (this.message) {
        message = this.message.apply(this, arguments);
        if (jasmine.isArray_(message)) {
          message = message[this.isNot ? 1 : 0];
        }
      } else {
        var englishyPredicate = matcherName.replace(/[A-Z]/g, function(s) { return ' ' + s.toLowerCase(); });
        message = "Expected " + jasmine.pp(this.actual) + (this.isNot ? " not " : " ") + englishyPredicate;
        if (matcherArgs.length > 0) {
          for (var i = 0; i < matcherArgs.length; i++) {
            if (i > 0) message += ",";
            message += " " + jasmine.pp(matcherArgs[i]);
          }
        }
        message += ".";
      }
    }

    this.spec.addExpectationResult(result, {
      matcherName: matcherName,
      passed: result,
      expected: matcherArgs.length > 1 ? matcherArgs : matcherArgs[0],
      actual: this.actual,
      message: message
    });
    return void 0;
  };
};

jasmine.Matchers.prototype.equalityTesters_ = [];

jasmine.Matchers.prototype.addEqualityTester = function(equalityTester) {
  this.equalityTesters_.push(equalityTester);
};

jasmine.Matchers.prototype.equals_ = function(a, b, mismatchKeys, mismatchValues) {
  mismatchKeys = mismatchKeys || [];
  mismatchValues = mismatchValues || [];

  for (var i = 0; i < this.equalityTesters_.length; i++) {
    var equalityTester = this.equalityTesters_[i];
    var result = equalityTester(a, b, this, mismatchKeys, mismatchValues);
    if (!jasmine.util.isUndefined(result)) {
      return result;
    }
  }

  if (a === b) return true;

  if (jasmine.util.isUndefined(a) || a === null || jasmine.util.isUndefined(b) || b === null) {
    return (jasmine.util.isUndefined(a) && jasmine.util.isUndefined(b));
  }

  if (jasmine.isDomNode(a) && jasmine.isDomNode(b)) {
    return a === b;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() == b.getTime();
  }

  if (a.jasmineMatches) {
    return a.jasmineMatches(b);
  }

  if (b.jasmineMatches) {
    return b.jasmineMatches(a);
  }

  if (a instanceof jasmine.Matchers.ObjectContaining) {
    return a.matches(b);
  }

  if (b instanceof jasmine.Matchers.ObjectContaining) {
    return b.matches(a);
  }

  if (jasmine.isString_(a) && jasmine.isString_(b)) {
    return (a == b);
  }

  if (jasmine.isNumber_(a) && jasmine.isNumber_(b)) {
    return (a == b);
  }

  if (a instanceof RegExp && b instanceof RegExp) {
    return this.compareRegExps_(a, b, mismatchKeys, mismatchValues);
  }

  if (typeof a === "object" && typeof b === "object") {
    return this.compareObjects_(a, b, mismatchKeys, mismatchValues);
  }

  //Straight check
  return (a === b);
};

jasmine.Matchers.prototype.contains_ = function(haystack, needle) {
  // TODO: isArray_ is used where?
  if (jasmine.isArray_(haystack)) {
    for (var i = 0; i < haystack.length; i++) {
      if (this.equals_(haystack[i], needle)) return true;
    }
    return false;
  }
  return haystack.indexOf(needle) >= 0;
};


jasmine.Matchers.prototype.toBe = function(expected) {
  return this.actual === expected;
};

jasmine.Matchers.prototype.toNotBe = function(expected) {
  return this.actual !== expected;
};

jasmine.Matchers.prototype.toEqual = function(expected) {
  return this.equals_(this.actual, expected);
};

jasmine.Matchers.prototype.toNotEqual = function(expected) {
  return !this.equals_(this.actual, expected);
};

jasmine.Matchers.prototype.toMatch = function(expected) {
  return new RegExp(expected).test(this.actual);
};

jasmine.Matchers.prototype.toNotMatch = function(expected) {
  return !(new RegExp(expected).test(this.actual));
};

jasmine.Matchers.prototype.toBeDefined = function() {
  return !jasmine.util.isUndefined(this.actual);
};

jasmine.Matchers.prototype.toBeUndefined = function() {
  return jasmine.util.isUndefined(this.actual);
};

jasmine.Matchers.prototype.toBeNull = function() {
  return (this.actual === null);
};

jasmine.Matchers.prototype.toBeNaN = function() {
  this.message = function() {
      return [ "Expected " + jasmine.pp(this.actual) + " to be NaN." ];
  };

  return (this.actual !== this.actual);
};

jasmine.Matchers.prototype.toBeTruthy = function() {
  return !!this.actual;
};

jasmine.Matchers.prototype.toBeFalsy = function() {
  return !this.actual;
};

jasmine.Matchers.prototype.toHaveBeenCalled = function() {
  if (arguments.length > 0) {
    throw new Error('toHaveBeenCalled does not take arguments, use toHaveBeenCalledWith');
  }

  if (!jasmine.isSpy(this.actual)) {
    throw new Error('Expected a spy, but got ' + jasmine.pp(this.actual) + '.');
  }

  this.message = function() {
    return [
      "Expected spy " + this.actual.identity + " to have been called.",
      "Expected spy " + this.actual.identity + " not to have been called."
    ];
  };

  return this.actual.wasCalled;
};

// TODO: kill this for 2.0
jasmine.Matchers.prototype.wasCalled = jasmine.Matchers.prototype.toHaveBeenCalled;

jasmine.Matchers.prototype.wasNotCalled = function() {
  if (arguments.length > 0) {
    throw new Error('wasNotCalled does not take arguments');
  }

  if (!jasmine.isSpy(this.actual)) {
    throw new Error('Expected a spy, but got ' + jasmine.pp(this.actual) + '.');
  }

  this.message = function() {
    return [
      "Expected spy " + this.actual.identity + " to not have been called.",
      "Expected spy " + this.actual.identity + " to have been called."
    ];
  };

  return !this.actual.wasCalled;
};

jasmine.Matchers.prototype.toHaveBeenCalledWith = function() {
  var expectedArgs = jasmine.util.argsToArray(arguments);
  if (!jasmine.isSpy(this.actual)) {
    throw new Error('Expected a spy, but got ' + jasmine.pp(this.actual) + '.');
  }
  this.message = function() {
    var invertedMessage = "Expected spy " + this.actual.identity + " not to have been called with " + jasmine.pp(expectedArgs) + " but it was.";
    var positiveMessage = "";
    if (this.actual.callCount === 0) {
      positiveMessage = "Expected spy " + this.actual.identity + " to have been called with " + jasmine.pp(expectedArgs) + " but it was never called.";
    } else {
      positiveMessage = "Expected spy " + this.actual.identity + " to have been called with " + jasmine.pp(expectedArgs) + " but actual calls were " + jasmine.pp(this.actual.argsForCall).replace(/^\[ | \]$/g, '');
    }
    return [positiveMessage, invertedMessage];
  };

  return this.contains_(this.actual.argsForCall, expectedArgs);
};

// TODO: kill for 2.0
jasmine.Matchers.prototype.wasCalledWith = jasmine.Matchers.prototype.toHaveBeenCalledWith;

// TODO: kill for 2.0
jasmine.Matchers.prototype.wasNotCalledWith = function() {
  var expectedArgs = jasmine.util.argsToArray(arguments);
  if (!jasmine.isSpy(this.actual)) {
    throw new Error('Expected a spy, but got ' + jasmine.pp(this.actual) + '.');
  }

  this.message = function() {
    return [
      "Expected spy not to have been called with " + jasmine.pp(expectedArgs) + " but it was",
      "Expected spy to have been called with " + jasmine.pp(expectedArgs) + " but it was"
    ];
  };

  return !this.contains_(this.actual.argsForCall, expectedArgs);
};

jasmine.Matchers.prototype.toContain = function(expected) {
  return this.contains_(this.actual, expected);
};

jasmine.Matchers.prototype.toBeLessThan = function(expected) {
  return this.actual < expected;
};

jasmine.Matchers.prototype.toBeGreaterThan = function(expected) {
  return this.actual > expected;
};

jasmine.Matchers.prototype.toBeCloseTo = function(expected, precision) {
  if (precision !== 0) {
    precision = precision || 2;
  }
  return Math.abs(expected - this.actual) < (Math.pow(10, -precision) / 2);
};

jasmine.Matchers.prototype.toThrow = function(expected) {
  var result = false;
  var exception, exceptionMessage;
  if (typeof this.actual != 'function') {
    throw new Error('Actual is not a function');
  }
  try {
    this.actual();
  } catch (e) {
    exception = e;
  }

  if (exception) {
    exceptionMessage = exception.message || exception;
    result = (jasmine.util.isUndefined(expected) || this.equals_(exceptionMessage, expected.message || expected) || (jasmine.isA_("RegExp", expected) && expected.test(exceptionMessage)));
  }

  var not = this.isNot ? "not " : "";
  var regexMatch = jasmine.isA_("RegExp", expected) ? " an exception matching" : "";

  this.message = function() {
    if (exception) {
      return ["Expected function " + not + "to throw" + regexMatch, expected ? expected.message || expected : "an exception", ", but it threw", exceptionMessage].join(' ');
    } else {
      return "Expected function to throw an exception.";
    }
  };

  return result;
};

jasmine.Matchers.Any = function(expectedClass) {
  this.expectedClass = expectedClass;
};

jasmine.Matchers.Any.prototype.jasmineMatches = function(other) {
  if (this.expectedClass == String) {
    return typeof other == 'string' || other instanceof String;
  }

  if (this.expectedClass == Number) {
    return typeof other == 'number' || other instanceof Number;
  }

  if (this.expectedClass == Function) {
    return typeof other == 'function' || other instanceof Function;
  }

  if (this.expectedClass == Object) {
    return typeof other == 'object';
  }

  return other instanceof this.expectedClass;
};

jasmine.Matchers.Any.prototype.jasmineToString = function() {
  return '<jasmine.any(' + this.expectedClass + ')>';
};

jasmine.Matchers.ObjectContaining = function(sample) {
  this.sample = sample;
};

jasmine.Matchers.ObjectContaining.prototype.jasmineMatches = function(other, mismatchKeys, mismatchValues) {
  mismatchKeys = mismatchKeys || [];
  mismatchValues = mismatchValues || [];

  var env = jasmine.getEnv();

  var hasKey = function(obj, keyName) {
    return obj !== null && !jasmine.util.isUndefined(obj[keyName]);
  };

  for (var property in this.sample) {
    if (!hasKey(other, property) && hasKey(this.sample, property)) {
      mismatchKeys.push("expected has key '" + property + "', but missing from actual.");
    }
    else if (!env.equals_(this.sample[property], other[property], mismatchKeys, mismatchValues)) {
      mismatchValues.push("'" + property + "' was '" + (other[property] ? jasmine.util.htmlEscape(other[property].toString()) : other[property]) + "' in expected, but was '" + (this.sample[property] ? jasmine.util.htmlEscape(this.sample[property].toString()) : this.sample[property]) + "' in actual.");
    }
  }

  return (mismatchKeys.length === 0 && mismatchValues.length === 0);
};

jasmine.Matchers.ObjectContaining.prototype.jasmineToString = function() {
  return "<jasmine.objectContaining(" + jasmine.pp(this.sample) + ")>";
};
