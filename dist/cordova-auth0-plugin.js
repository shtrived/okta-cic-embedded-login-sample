/**
 * auth0-js v9.20.2
 * Author: Auth0
 * Date: 2023-04-09
 * License: MIT
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.CordovaAuth0Plugin = factory());
}(this, (function () { 'use strict';

  var version = { raw: '9.20.2' };

  var toString = Object.prototype.toString;

  function attribute(o, attr, type, text) {
    type = type === 'array' ? 'object' : type;
    if (o && typeof o[attr] !== type) {
      throw new Error(text);
    }
  }

  function variable(o, type, text) {
    if (typeof o !== type) {
      throw new Error(text);
    }
  }

  function value(o, values, text) {
    if (values.indexOf(o) === -1) {
      throw new Error(text);
    }
  }

  function check(o, config, attributes) {
    if (!config.optional || o) {
      variable(o, config.type, config.message);
    }
    if (config.type === 'object' && attributes) {
      var keys = Object.keys(attributes);

      for (var index = 0; index < keys.length; index++) {
        var a = keys[index];
        if (!attributes[a].optional || o[a]) {
          if (!attributes[a].condition || attributes[a].condition(o)) {
            attribute(o, a, attributes[a].type, attributes[a].message);
            if (attributes[a].values) {
              value(o[a], attributes[a].values, attributes[a].value_message);
            }
          }
        }
      }
    }
  }

  /**
   * Wrap `Array.isArray` Polyfill for IE9
   * source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
   *
   * @param {Array} array
   * @private
   */
  function isArray(array) {
    if (this.supportsIsArray()) {
      return Array.isArray(array);
    }

    return toString.call(array) === '[object Array]';
  }

  function supportsIsArray() {
    return Array.isArray != null;
  }

  var assert = {
    check: check,
    attribute: attribute,
    variable: variable,
    value: value,
    isArray: isArray,
    supportsIsArray: supportsIsArray
  };

  /* eslint-disable no-continue */

  function get() {
    if (!Object.assign) {
      return objectAssignPolyfill;
    }

    return Object.assign;
  }

  function objectAssignPolyfill(target) {
    if (target === undefined || target === null) {
      throw new TypeError('Cannot convert first argument to object');
    }

    var to = Object(target);
    for (var i = 1; i < arguments.length; i++) {
      var nextSource = arguments[i];
      if (nextSource === undefined || nextSource === null) {
        continue;
      }

      var keysArray = Object.keys(Object(nextSource));
      for (
        var nextIndex = 0, len = keysArray.length;
        nextIndex < len;
        nextIndex++
      ) {
        var nextKey = keysArray[nextIndex];
        var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
        if (desc !== undefined && desc.enumerable) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
    return to;
  }

  var objectAssign = {
    get: get,
    objectAssignPolyfill: objectAssignPolyfill
  };

  /* eslint-disable no-param-reassign */

  function pick(object, keys) {
    return keys.reduce(function(prev, key) {
      if (object[key]) {
        prev[key] = object[key];
      }
      return prev;
    }, {});
  }

  function getKeysNotIn(obj, allowedKeys) {
    var notAllowed = [];
    for (var key in obj) {
      if (allowedKeys.indexOf(key) === -1) {
        notAllowed.push(key);
      }
    }
    return notAllowed;
  }

  function objectValues(obj) {
    var values = [];
    for (var key in obj) {
      values.push(obj[key]);
    }
    return values;
  }

  function extend() {
    var params = objectValues(arguments);
    params.unshift({});
    return objectAssign.get().apply(undefined, params);
  }

  function merge(object, keys) {
    return {
      base: keys ? pick(object, keys) : object,
      with: function(object2, keys2) {
        object2 = keys2 ? pick(object2, keys2) : object2;
        return extend(this.base, object2);
      }
    };
  }

  function blacklist(object, blacklistedKeys) {
    return Object.keys(object).reduce(function(p, key) {
      if (blacklistedKeys.indexOf(key) === -1) {
        p[key] = object[key];
      }
      return p;
    }, {});
  }

  function camelToSnake(str) {
    var newKey = '';
    var index = 0;
    var code;
    var wasPrevNumber = true;
    var wasPrevUppercase = true;

    while (index < str.length) {
      code = str.charCodeAt(index);
      if (
        (!wasPrevUppercase && code >= 65 && code <= 90) ||
        (!wasPrevNumber && code >= 48 && code <= 57)
      ) {
        newKey += '_';
        newKey += str[index].toLowerCase();
      } else {
        newKey += str[index].toLowerCase();
      }
      wasPrevNumber = code >= 48 && code <= 57;
      wasPrevUppercase = code >= 65 && code <= 90;
      index++;
    }

    return newKey;
  }

  function snakeToCamel(str) {
    var parts = str.split('_');
    return parts.reduce(function(p, c) {
      return p + c.charAt(0).toUpperCase() + c.slice(1);
    }, parts.shift());
  }

  function toSnakeCase(object, exceptions) {
    if (typeof object !== 'object' || assert.isArray(object) || object === null) {
      return object;
    }
    exceptions = exceptions || [];

    return Object.keys(object).reduce(function(p, key) {
      var newKey = exceptions.indexOf(key) === -1 ? camelToSnake(key) : key;
      p[newKey] = toSnakeCase(object[key]);
      return p;
    }, {});
  }

  function toCamelCase(object, exceptions, options) {
    if (typeof object !== 'object' || assert.isArray(object) || object === null) {
      return object;
    }

    exceptions = exceptions || [];
    options = options || {};
    return Object.keys(object).reduce(function(p, key) {
      var newKey = exceptions.indexOf(key) === -1 ? snakeToCamel(key) : key;

      p[newKey] = toCamelCase(object[newKey] || object[key], [], options);

      if (options.keepOriginal) {
        p[key] = toCamelCase(object[key], [], options);
      }
      return p;
    }, {});
  }

  function getLocationFromUrl(href) {
    var match = href.match(
      /^(https?:|file:|chrome-extension:)\/\/(([^:/?#]*)(?::([0-9]+))?)([/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/
    );
    return (
      match && {
        href: href,
        protocol: match[1],
        host: match[2],
        hostname: match[3],
        port: match[4],
        pathname: match[5],
        search: match[6],
        hash: match[7]
      }
    );
  }

  function getOriginFromUrl(url) {
    if (!url) {
      return undefined;
    }
    var parsed = getLocationFromUrl(url);
    if (!parsed) {
      return null;
    }
    var origin = parsed.protocol + '//' + parsed.hostname;
    if (parsed.port) {
      origin += ':' + parsed.port;
    }
    return origin;
  }

  function trim(options, key) {
    var trimmed = extend(options);
    if (options[key]) {
      trimmed[key] = options[key].trim();
    }
    return trimmed;
  }

  function trimMultiple(options, keys) {
    return keys.reduce(trim, options);
  }

  function trimUserDetails(options) {
    return trimMultiple(options, ['username', 'email', 'phoneNumber']);
  }

  /**
   * Updates the value of a property on the given object, using a deep path selector.
   * @param {object} obj The object to set the property value on
   * @param {string|array} path The path to the property that should have its value updated. e.g. 'prop1.prop2.prop3' or ['prop1', 'prop2', 'prop3']
   * @param {any} value The value to set
   * @ignore
   */
  function updatePropertyOn(obj, path, value) {
    if (typeof path === 'string') {
      path = path.split('.');
    }

    var next = path[0];

    if (obj.hasOwnProperty(next)) {
      if (path.length === 1) {
        obj[next] = value;
      } else {
        updatePropertyOn(obj[next], path.slice(1), value);
      }
    }
  }

  var objectHelper = {
    toSnakeCase: toSnakeCase,
    toCamelCase: toCamelCase,
    blacklist: blacklist,
    merge: merge,
    pick: pick,
    getKeysNotIn: getKeysNotIn,
    extend: extend,
    getOriginFromUrl: getOriginFromUrl,
    getLocationFromUrl: getLocationFromUrl,
    trimUserDetails: trimUserDetails,
    updatePropertyOn: updatePropertyOn
  };

  function redirect(url) {
    getWindow().location = url;
  }

  function getDocument() {
    return getWindow().document;
  }

  function getWindow() {
    return window;
  }

  function getOrigin() {
    var location = getWindow().location;
    var origin = location.origin;

    if (!origin) {
      origin = objectHelper.getOriginFromUrl(location.href);
    }

    return origin;
  }

  var windowHandler = {
    redirect: redirect,
    getDocument: getDocument,
    getWindow: getWindow,
    getOrigin: getOrigin
  };

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  function getCjsExportFromNamespace (n) {
  	return n && n['default'] || n;
  }

  var urlJoin = createCommonjsModule(function (module) {
  (function (name, context, definition) {
    if ( module.exports) module.exports = definition();
    else context[name] = definition();
  })('urljoin', commonjsGlobal, function () {

    function normalize (strArray) {
      var resultArray = [];
      if (strArray.length === 0) { return ''; }

      if (typeof strArray[0] !== 'string') {
        throw new TypeError('Url must be a string. Received ' + strArray[0]);
      }

      // If the first part is a plain protocol, we combine it with the next part.
      if (strArray[0].match(/^[^/:]+:\/*$/) && strArray.length > 1) {
        var first = strArray.shift();
        strArray[0] = first + strArray[0];
      }

      // There must be two or three slashes in the file protocol, two slashes in anything else.
      if (strArray[0].match(/^file:\/\/\//)) {
        strArray[0] = strArray[0].replace(/^([^/:]+):\/*/, '$1:///');
      } else {
        strArray[0] = strArray[0].replace(/^([^/:]+):\/*/, '$1://');
      }

      for (var i = 0; i < strArray.length; i++) {
        var component = strArray[i];

        if (typeof component !== 'string') {
          throw new TypeError('Url must be a string. Received ' + component);
        }

        if (component === '') { continue; }

        if (i > 0) {
          // Removing the starting slashes for each component but the first.
          component = component.replace(/^[\/]+/, '');
        }
        if (i < strArray.length - 1) {
          // Removing the ending slashes for each component but the last.
          component = component.replace(/[\/]+$/, '');
        } else {
          // For the last component we will combine multiple slashes to a single one.
          component = component.replace(/[\/]+$/, '/');
        }

        resultArray.push(component);

      }

      var str = resultArray.join('/');
      // Each input component is now separated by a single slash except the possible first plain protocol part.

      // remove trailing slash before parameters or hash
      str = str.replace(/\/(\?|&|#[^!])/g, '$1');

      // replace ? in parameters with &
      var parts = str.split('?');
      str = parts.shift() + (parts.length > 0 ? '?': '') + parts.join('&');

      return str;
    }

    return function () {
      var input;

      if (typeof arguments[0] === 'object') {
        input = arguments[0];
      } else {
        input = [].slice.call(arguments);
      }

      return normalize(input);
    };

  });
  });

  /* eslint complexity: [2, 18], max-statements: [2, 33] */
  var shams = function hasSymbols() {
  	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
  	if (typeof Symbol.iterator === 'symbol') { return true; }

  	var obj = {};
  	var sym = Symbol('test');
  	var symObj = Object(sym);
  	if (typeof sym === 'string') { return false; }

  	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
  	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

  	// temp disabled per https://github.com/ljharb/object.assign/issues/17
  	// if (sym instanceof Symbol) { return false; }
  	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
  	// if (!(symObj instanceof Symbol)) { return false; }

  	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
  	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

  	var symVal = 42;
  	obj[sym] = symVal;
  	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
  	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

  	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

  	var syms = Object.getOwnPropertySymbols(obj);
  	if (syms.length !== 1 || syms[0] !== sym) { return false; }

  	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

  	if (typeof Object.getOwnPropertyDescriptor === 'function') {
  		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
  		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
  	}

  	return true;
  };

  var origSymbol = typeof Symbol !== 'undefined' && Symbol;


  var hasSymbols = function hasNativeSymbols() {
  	if (typeof origSymbol !== 'function') { return false; }
  	if (typeof Symbol !== 'function') { return false; }
  	if (typeof origSymbol('foo') !== 'symbol') { return false; }
  	if (typeof Symbol('bar') !== 'symbol') { return false; }

  	return shams();
  };

  /* eslint no-invalid-this: 1 */

  var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
  var slice = Array.prototype.slice;
  var toStr = Object.prototype.toString;
  var funcType = '[object Function]';

  var implementation = function bind(that) {
      var target = this;
      if (typeof target !== 'function' || toStr.call(target) !== funcType) {
          throw new TypeError(ERROR_MESSAGE + target);
      }
      var args = slice.call(arguments, 1);

      var bound;
      var binder = function () {
          if (this instanceof bound) {
              var result = target.apply(
                  this,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return this;
          } else {
              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );
          }
      };

      var boundLength = Math.max(0, target.length - args.length);
      var boundArgs = [];
      for (var i = 0; i < boundLength; i++) {
          boundArgs.push('$' + i);
      }

      bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

      if (target.prototype) {
          var Empty = function Empty() {};
          Empty.prototype = target.prototype;
          bound.prototype = new Empty();
          Empty.prototype = null;
      }

      return bound;
  };

  var functionBind = Function.prototype.bind || implementation;

  var src = functionBind.call(Function.call, Object.prototype.hasOwnProperty);

  var undefined$1;

  var $SyntaxError = SyntaxError;
  var $Function = Function;
  var $TypeError = TypeError;

  // eslint-disable-next-line consistent-return
  var getEvalledConstructor = function (expressionSyntax) {
  	try {
  		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
  	} catch (e) {}
  };

  var $gOPD = Object.getOwnPropertyDescriptor;
  if ($gOPD) {
  	try {
  		$gOPD({}, '');
  	} catch (e) {
  		$gOPD = null; // this is IE 8, which has a broken gOPD
  	}
  }

  var throwTypeError = function () {
  	throw new $TypeError();
  };
  var ThrowTypeError = $gOPD
  	? (function () {
  		try {
  			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
  			arguments.callee; // IE 8 does not throw here
  			return throwTypeError;
  		} catch (calleeThrows) {
  			try {
  				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
  				return $gOPD(arguments, 'callee').get;
  			} catch (gOPDthrows) {
  				return throwTypeError;
  			}
  		}
  	}())
  	: throwTypeError;

  var hasSymbols$1 = hasSymbols();

  var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

  var needsEval = {};

  var TypedArray = typeof Uint8Array === 'undefined' ? undefined$1 : getProto(Uint8Array);

  var INTRINSICS = {
  	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined$1 : AggregateError,
  	'%Array%': Array,
  	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer,
  	'%ArrayIteratorPrototype%': hasSymbols$1 ? getProto([][Symbol.iterator]()) : undefined$1,
  	'%AsyncFromSyncIteratorPrototype%': undefined$1,
  	'%AsyncFunction%': needsEval,
  	'%AsyncGenerator%': needsEval,
  	'%AsyncGeneratorFunction%': needsEval,
  	'%AsyncIteratorPrototype%': needsEval,
  	'%Atomics%': typeof Atomics === 'undefined' ? undefined$1 : Atomics,
  	'%BigInt%': typeof BigInt === 'undefined' ? undefined$1 : BigInt,
  	'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined$1 : BigInt64Array,
  	'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined$1 : BigUint64Array,
  	'%Boolean%': Boolean,
  	'%DataView%': typeof DataView === 'undefined' ? undefined$1 : DataView,
  	'%Date%': Date,
  	'%decodeURI%': decodeURI,
  	'%decodeURIComponent%': decodeURIComponent,
  	'%encodeURI%': encodeURI,
  	'%encodeURIComponent%': encodeURIComponent,
  	'%Error%': Error,
  	'%eval%': eval, // eslint-disable-line no-eval
  	'%EvalError%': EvalError,
  	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined$1 : Float32Array,
  	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined$1 : Float64Array,
  	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined$1 : FinalizationRegistry,
  	'%Function%': $Function,
  	'%GeneratorFunction%': needsEval,
  	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined$1 : Int8Array,
  	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined$1 : Int16Array,
  	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined$1 : Int32Array,
  	'%isFinite%': isFinite,
  	'%isNaN%': isNaN,
  	'%IteratorPrototype%': hasSymbols$1 ? getProto(getProto([][Symbol.iterator]())) : undefined$1,
  	'%JSON%': typeof JSON === 'object' ? JSON : undefined$1,
  	'%Map%': typeof Map === 'undefined' ? undefined$1 : Map,
  	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols$1 ? undefined$1 : getProto(new Map()[Symbol.iterator]()),
  	'%Math%': Math,
  	'%Number%': Number,
  	'%Object%': Object,
  	'%parseFloat%': parseFloat,
  	'%parseInt%': parseInt,
  	'%Promise%': typeof Promise === 'undefined' ? undefined$1 : Promise,
  	'%Proxy%': typeof Proxy === 'undefined' ? undefined$1 : Proxy,
  	'%RangeError%': RangeError,
  	'%ReferenceError%': ReferenceError,
  	'%Reflect%': typeof Reflect === 'undefined' ? undefined$1 : Reflect,
  	'%RegExp%': RegExp,
  	'%Set%': typeof Set === 'undefined' ? undefined$1 : Set,
  	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols$1 ? undefined$1 : getProto(new Set()[Symbol.iterator]()),
  	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer,
  	'%String%': String,
  	'%StringIteratorPrototype%': hasSymbols$1 ? getProto(''[Symbol.iterator]()) : undefined$1,
  	'%Symbol%': hasSymbols$1 ? Symbol : undefined$1,
  	'%SyntaxError%': $SyntaxError,
  	'%ThrowTypeError%': ThrowTypeError,
  	'%TypedArray%': TypedArray,
  	'%TypeError%': $TypeError,
  	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$1 : Uint8Array,
  	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$1 : Uint8ClampedArray,
  	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$1 : Uint16Array,
  	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$1 : Uint32Array,
  	'%URIError%': URIError,
  	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$1 : WeakMap,
  	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined$1 : WeakRef,
  	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$1 : WeakSet
  };

  try {
  	null.error; // eslint-disable-line no-unused-expressions
  } catch (e) {
  	// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
  	var errorProto = getProto(getProto(e));
  	INTRINSICS['%Error.prototype%'] = errorProto;
  }

  var doEval = function doEval(name) {
  	var value;
  	if (name === '%AsyncFunction%') {
  		value = getEvalledConstructor('async function () {}');
  	} else if (name === '%GeneratorFunction%') {
  		value = getEvalledConstructor('function* () {}');
  	} else if (name === '%AsyncGeneratorFunction%') {
  		value = getEvalledConstructor('async function* () {}');
  	} else if (name === '%AsyncGenerator%') {
  		var fn = doEval('%AsyncGeneratorFunction%');
  		if (fn) {
  			value = fn.prototype;
  		}
  	} else if (name === '%AsyncIteratorPrototype%') {
  		var gen = doEval('%AsyncGenerator%');
  		if (gen) {
  			value = getProto(gen.prototype);
  		}
  	}

  	INTRINSICS[name] = value;

  	return value;
  };

  var LEGACY_ALIASES = {
  	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
  	'%ArrayPrototype%': ['Array', 'prototype'],
  	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
  	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
  	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
  	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
  	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
  	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
  	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
  	'%BooleanPrototype%': ['Boolean', 'prototype'],
  	'%DataViewPrototype%': ['DataView', 'prototype'],
  	'%DatePrototype%': ['Date', 'prototype'],
  	'%ErrorPrototype%': ['Error', 'prototype'],
  	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
  	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
  	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
  	'%FunctionPrototype%': ['Function', 'prototype'],
  	'%Generator%': ['GeneratorFunction', 'prototype'],
  	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
  	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
  	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
  	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
  	'%JSONParse%': ['JSON', 'parse'],
  	'%JSONStringify%': ['JSON', 'stringify'],
  	'%MapPrototype%': ['Map', 'prototype'],
  	'%NumberPrototype%': ['Number', 'prototype'],
  	'%ObjectPrototype%': ['Object', 'prototype'],
  	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
  	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
  	'%PromisePrototype%': ['Promise', 'prototype'],
  	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
  	'%Promise_all%': ['Promise', 'all'],
  	'%Promise_reject%': ['Promise', 'reject'],
  	'%Promise_resolve%': ['Promise', 'resolve'],
  	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
  	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
  	'%RegExpPrototype%': ['RegExp', 'prototype'],
  	'%SetPrototype%': ['Set', 'prototype'],
  	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
  	'%StringPrototype%': ['String', 'prototype'],
  	'%SymbolPrototype%': ['Symbol', 'prototype'],
  	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
  	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
  	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
  	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
  	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
  	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
  	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
  	'%URIErrorPrototype%': ['URIError', 'prototype'],
  	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
  	'%WeakSetPrototype%': ['WeakSet', 'prototype']
  };



  var $concat = functionBind.call(Function.call, Array.prototype.concat);
  var $spliceApply = functionBind.call(Function.apply, Array.prototype.splice);
  var $replace = functionBind.call(Function.call, String.prototype.replace);
  var $strSlice = functionBind.call(Function.call, String.prototype.slice);
  var $exec = functionBind.call(Function.call, RegExp.prototype.exec);

  /* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
  var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
  var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
  var stringToPath = function stringToPath(string) {
  	var first = $strSlice(string, 0, 1);
  	var last = $strSlice(string, -1);
  	if (first === '%' && last !== '%') {
  		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
  	} else if (last === '%' && first !== '%') {
  		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
  	}
  	var result = [];
  	$replace(string, rePropName, function (match, number, quote, subString) {
  		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
  	});
  	return result;
  };
  /* end adaptation */

  var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
  	var intrinsicName = name;
  	var alias;
  	if (src(LEGACY_ALIASES, intrinsicName)) {
  		alias = LEGACY_ALIASES[intrinsicName];
  		intrinsicName = '%' + alias[0] + '%';
  	}

  	if (src(INTRINSICS, intrinsicName)) {
  		var value = INTRINSICS[intrinsicName];
  		if (value === needsEval) {
  			value = doEval(intrinsicName);
  		}
  		if (typeof value === 'undefined' && !allowMissing) {
  			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
  		}

  		return {
  			alias: alias,
  			name: intrinsicName,
  			value: value
  		};
  	}

  	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
  };

  var getIntrinsic = function GetIntrinsic(name, allowMissing) {
  	if (typeof name !== 'string' || name.length === 0) {
  		throw new $TypeError('intrinsic name must be a non-empty string');
  	}
  	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
  		throw new $TypeError('"allowMissing" argument must be a boolean');
  	}

  	if ($exec(/^%?[^%]*%?$/, name) === null) {
  		throw new $SyntaxError('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
  	}
  	var parts = stringToPath(name);
  	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

  	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
  	var intrinsicRealName = intrinsic.name;
  	var value = intrinsic.value;
  	var skipFurtherCaching = false;

  	var alias = intrinsic.alias;
  	if (alias) {
  		intrinsicBaseName = alias[0];
  		$spliceApply(parts, $concat([0, 1], alias));
  	}

  	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
  		var part = parts[i];
  		var first = $strSlice(part, 0, 1);
  		var last = $strSlice(part, -1);
  		if (
  			(
  				(first === '"' || first === "'" || first === '`')
  				|| (last === '"' || last === "'" || last === '`')
  			)
  			&& first !== last
  		) {
  			throw new $SyntaxError('property names with quotes must have matching quotes');
  		}
  		if (part === 'constructor' || !isOwn) {
  			skipFurtherCaching = true;
  		}

  		intrinsicBaseName += '.' + part;
  		intrinsicRealName = '%' + intrinsicBaseName + '%';

  		if (src(INTRINSICS, intrinsicRealName)) {
  			value = INTRINSICS[intrinsicRealName];
  		} else if (value != null) {
  			if (!(part in value)) {
  				if (!allowMissing) {
  					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
  				}
  				return void undefined$1;
  			}
  			if ($gOPD && (i + 1) >= parts.length) {
  				var desc = $gOPD(value, part);
  				isOwn = !!desc;

  				// By convention, when a data property is converted to an accessor
  				// property to emulate a data property that does not suffer from
  				// the override mistake, that accessor's getter is marked with
  				// an `originalValue` property. Here, when we detect this, we
  				// uphold the illusion by pretending to see that original data
  				// property, i.e., returning the value rather than the getter
  				// itself.
  				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
  					value = desc.get;
  				} else {
  					value = value[part];
  				}
  			} else {
  				isOwn = src(value, part);
  				value = value[part];
  			}

  			if (isOwn && !skipFurtherCaching) {
  				INTRINSICS[intrinsicRealName] = value;
  			}
  		}
  	}
  	return value;
  };

  var callBind = createCommonjsModule(function (module) {




  var $apply = getIntrinsic('%Function.prototype.apply%');
  var $call = getIntrinsic('%Function.prototype.call%');
  var $reflectApply = getIntrinsic('%Reflect.apply%', true) || functionBind.call($call, $apply);

  var $gOPD = getIntrinsic('%Object.getOwnPropertyDescriptor%', true);
  var $defineProperty = getIntrinsic('%Object.defineProperty%', true);
  var $max = getIntrinsic('%Math.max%');

  if ($defineProperty) {
  	try {
  		$defineProperty({}, 'a', { value: 1 });
  	} catch (e) {
  		// IE 8 has a broken defineProperty
  		$defineProperty = null;
  	}
  }

  module.exports = function callBind(originalFunction) {
  	var func = $reflectApply(functionBind, $call, arguments);
  	if ($gOPD && $defineProperty) {
  		var desc = $gOPD(func, 'length');
  		if (desc.configurable) {
  			// original length, plus the receiver, minus any additional arguments (after the receiver)
  			$defineProperty(
  				func,
  				'length',
  				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
  			);
  		}
  	}
  	return func;
  };

  var applyBind = function applyBind() {
  	return $reflectApply(functionBind, $apply, arguments);
  };

  if ($defineProperty) {
  	$defineProperty(module.exports, 'apply', { value: applyBind });
  } else {
  	module.exports.apply = applyBind;
  }
  });
  var callBind_1 = callBind.apply;

  var $indexOf = callBind(getIntrinsic('String.prototype.indexOf'));

  var callBound = function callBoundIntrinsic(name, allowMissing) {
  	var intrinsic = getIntrinsic(name, !!allowMissing);
  	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
  		return callBind(intrinsic);
  	}
  	return intrinsic;
  };

  var _nodeResolve_empty = {};

  var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    'default': _nodeResolve_empty
  });

  var utilInspect = getCjsExportFromNamespace(_nodeResolve_empty$1);

  var hasMap = typeof Map === 'function' && Map.prototype;
  var mapSizeDescriptor = Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, 'size') : null;
  var mapSize = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === 'function' ? mapSizeDescriptor.get : null;
  var mapForEach = hasMap && Map.prototype.forEach;
  var hasSet = typeof Set === 'function' && Set.prototype;
  var setSizeDescriptor = Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, 'size') : null;
  var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === 'function' ? setSizeDescriptor.get : null;
  var setForEach = hasSet && Set.prototype.forEach;
  var hasWeakMap = typeof WeakMap === 'function' && WeakMap.prototype;
  var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
  var hasWeakSet = typeof WeakSet === 'function' && WeakSet.prototype;
  var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
  var hasWeakRef = typeof WeakRef === 'function' && WeakRef.prototype;
  var weakRefDeref = hasWeakRef ? WeakRef.prototype.deref : null;
  var booleanValueOf = Boolean.prototype.valueOf;
  var objectToString = Object.prototype.toString;
  var functionToString = Function.prototype.toString;
  var $match = String.prototype.match;
  var $slice = String.prototype.slice;
  var $replace$1 = String.prototype.replace;
  var $toUpperCase = String.prototype.toUpperCase;
  var $toLowerCase = String.prototype.toLowerCase;
  var $test = RegExp.prototype.test;
  var $concat$1 = Array.prototype.concat;
  var $join = Array.prototype.join;
  var $arrSlice = Array.prototype.slice;
  var $floor = Math.floor;
  var bigIntValueOf = typeof BigInt === 'function' ? BigInt.prototype.valueOf : null;
  var gOPS = Object.getOwnPropertySymbols;
  var symToString = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? Symbol.prototype.toString : null;
  var hasShammedSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'object';
  // ie, `has-tostringtag/shams
  var toStringTag = typeof Symbol === 'function' && Symbol.toStringTag && (typeof Symbol.toStringTag === hasShammedSymbols ? 'object' : 'symbol')
      ? Symbol.toStringTag
      : null;
  var isEnumerable = Object.prototype.propertyIsEnumerable;

  var gPO = (typeof Reflect === 'function' ? Reflect.getPrototypeOf : Object.getPrototypeOf) || (
      [].__proto__ === Array.prototype // eslint-disable-line no-proto
          ? function (O) {
              return O.__proto__; // eslint-disable-line no-proto
          }
          : null
  );

  function addNumericSeparator(num, str) {
      if (
          num === Infinity
          || num === -Infinity
          || num !== num
          || (num && num > -1000 && num < 1000)
          || $test.call(/e/, str)
      ) {
          return str;
      }
      var sepRegex = /[0-9](?=(?:[0-9]{3})+(?![0-9]))/g;
      if (typeof num === 'number') {
          var int = num < 0 ? -$floor(-num) : $floor(num); // trunc(num)
          if (int !== num) {
              var intStr = String(int);
              var dec = $slice.call(str, intStr.length + 1);
              return $replace$1.call(intStr, sepRegex, '$&_') + '.' + $replace$1.call($replace$1.call(dec, /([0-9]{3})/g, '$&_'), /_$/, '');
          }
      }
      return $replace$1.call(str, sepRegex, '$&_');
  }


  var inspectCustom = utilInspect.custom;
  var inspectSymbol = isSymbol(inspectCustom) ? inspectCustom : null;

  var objectInspect = function inspect_(obj, options, depth, seen) {
      var opts = options || {};

      if (has(opts, 'quoteStyle') && (opts.quoteStyle !== 'single' && opts.quoteStyle !== 'double')) {
          throw new TypeError('option "quoteStyle" must be "single" or "double"');
      }
      if (
          has(opts, 'maxStringLength') && (typeof opts.maxStringLength === 'number'
              ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity
              : opts.maxStringLength !== null
          )
      ) {
          throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
      }
      var customInspect = has(opts, 'customInspect') ? opts.customInspect : true;
      if (typeof customInspect !== 'boolean' && customInspect !== 'symbol') {
          throw new TypeError('option "customInspect", if provided, must be `true`, `false`, or `\'symbol\'`');
      }

      if (
          has(opts, 'indent')
          && opts.indent !== null
          && opts.indent !== '\t'
          && !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)
      ) {
          throw new TypeError('option "indent" must be "\\t", an integer > 0, or `null`');
      }
      if (has(opts, 'numericSeparator') && typeof opts.numericSeparator !== 'boolean') {
          throw new TypeError('option "numericSeparator", if provided, must be `true` or `false`');
      }
      var numericSeparator = opts.numericSeparator;

      if (typeof obj === 'undefined') {
          return 'undefined';
      }
      if (obj === null) {
          return 'null';
      }
      if (typeof obj === 'boolean') {
          return obj ? 'true' : 'false';
      }

      if (typeof obj === 'string') {
          return inspectString(obj, opts);
      }
      if (typeof obj === 'number') {
          if (obj === 0) {
              return Infinity / obj > 0 ? '0' : '-0';
          }
          var str = String(obj);
          return numericSeparator ? addNumericSeparator(obj, str) : str;
      }
      if (typeof obj === 'bigint') {
          var bigIntStr = String(obj) + 'n';
          return numericSeparator ? addNumericSeparator(obj, bigIntStr) : bigIntStr;
      }

      var maxDepth = typeof opts.depth === 'undefined' ? 5 : opts.depth;
      if (typeof depth === 'undefined') { depth = 0; }
      if (depth >= maxDepth && maxDepth > 0 && typeof obj === 'object') {
          return isArray$1(obj) ? '[Array]' : '[Object]';
      }

      var indent = getIndent(opts, depth);

      if (typeof seen === 'undefined') {
          seen = [];
      } else if (indexOf(seen, obj) >= 0) {
          return '[Circular]';
      }

      function inspect(value, from, noIndent) {
          if (from) {
              seen = $arrSlice.call(seen);
              seen.push(from);
          }
          if (noIndent) {
              var newOpts = {
                  depth: opts.depth
              };
              if (has(opts, 'quoteStyle')) {
                  newOpts.quoteStyle = opts.quoteStyle;
              }
              return inspect_(value, newOpts, depth + 1, seen);
          }
          return inspect_(value, opts, depth + 1, seen);
      }

      if (typeof obj === 'function' && !isRegExp(obj)) { // in older engines, regexes are callable
          var name = nameOf(obj);
          var keys = arrObjKeys(obj, inspect);
          return '[Function' + (name ? ': ' + name : ' (anonymous)') + ']' + (keys.length > 0 ? ' { ' + $join.call(keys, ', ') + ' }' : '');
      }
      if (isSymbol(obj)) {
          var symString = hasShammedSymbols ? $replace$1.call(String(obj), /^(Symbol\(.*\))_[^)]*$/, '$1') : symToString.call(obj);
          return typeof obj === 'object' && !hasShammedSymbols ? markBoxed(symString) : symString;
      }
      if (isElement(obj)) {
          var s = '<' + $toLowerCase.call(String(obj.nodeName));
          var attrs = obj.attributes || [];
          for (var i = 0; i < attrs.length; i++) {
              s += ' ' + attrs[i].name + '=' + wrapQuotes(quote(attrs[i].value), 'double', opts);
          }
          s += '>';
          if (obj.childNodes && obj.childNodes.length) { s += '...'; }
          s += '</' + $toLowerCase.call(String(obj.nodeName)) + '>';
          return s;
      }
      if (isArray$1(obj)) {
          if (obj.length === 0) { return '[]'; }
          var xs = arrObjKeys(obj, inspect);
          if (indent && !singleLineValues(xs)) {
              return '[' + indentedJoin(xs, indent) + ']';
          }
          return '[ ' + $join.call(xs, ', ') + ' ]';
      }
      if (isError(obj)) {
          var parts = arrObjKeys(obj, inspect);
          if (!('cause' in Error.prototype) && 'cause' in obj && !isEnumerable.call(obj, 'cause')) {
              return '{ [' + String(obj) + '] ' + $join.call($concat$1.call('[cause]: ' + inspect(obj.cause), parts), ', ') + ' }';
          }
          if (parts.length === 0) { return '[' + String(obj) + ']'; }
          return '{ [' + String(obj) + '] ' + $join.call(parts, ', ') + ' }';
      }
      if (typeof obj === 'object' && customInspect) {
          if (inspectSymbol && typeof obj[inspectSymbol] === 'function' && utilInspect) {
              return utilInspect(obj, { depth: maxDepth - depth });
          } else if (customInspect !== 'symbol' && typeof obj.inspect === 'function') {
              return obj.inspect();
          }
      }
      if (isMap(obj)) {
          var mapParts = [];
          if (mapForEach) {
              mapForEach.call(obj, function (value, key) {
                  mapParts.push(inspect(key, obj, true) + ' => ' + inspect(value, obj));
              });
          }
          return collectionOf('Map', mapSize.call(obj), mapParts, indent);
      }
      if (isSet(obj)) {
          var setParts = [];
          if (setForEach) {
              setForEach.call(obj, function (value) {
                  setParts.push(inspect(value, obj));
              });
          }
          return collectionOf('Set', setSize.call(obj), setParts, indent);
      }
      if (isWeakMap(obj)) {
          return weakCollectionOf('WeakMap');
      }
      if (isWeakSet(obj)) {
          return weakCollectionOf('WeakSet');
      }
      if (isWeakRef(obj)) {
          return weakCollectionOf('WeakRef');
      }
      if (isNumber(obj)) {
          return markBoxed(inspect(Number(obj)));
      }
      if (isBigInt(obj)) {
          return markBoxed(inspect(bigIntValueOf.call(obj)));
      }
      if (isBoolean(obj)) {
          return markBoxed(booleanValueOf.call(obj));
      }
      if (isString(obj)) {
          return markBoxed(inspect(String(obj)));
      }
      if (!isDate(obj) && !isRegExp(obj)) {
          var ys = arrObjKeys(obj, inspect);
          var isPlainObject = gPO ? gPO(obj) === Object.prototype : obj instanceof Object || obj.constructor === Object;
          var protoTag = obj instanceof Object ? '' : 'null prototype';
          var stringTag = !isPlainObject && toStringTag && Object(obj) === obj && toStringTag in obj ? $slice.call(toStr$1(obj), 8, -1) : protoTag ? 'Object' : '';
          var constructorTag = isPlainObject || typeof obj.constructor !== 'function' ? '' : obj.constructor.name ? obj.constructor.name + ' ' : '';
          var tag = constructorTag + (stringTag || protoTag ? '[' + $join.call($concat$1.call([], stringTag || [], protoTag || []), ': ') + '] ' : '');
          if (ys.length === 0) { return tag + '{}'; }
          if (indent) {
              return tag + '{' + indentedJoin(ys, indent) + '}';
          }
          return tag + '{ ' + $join.call(ys, ', ') + ' }';
      }
      return String(obj);
  };

  function wrapQuotes(s, defaultStyle, opts) {
      var quoteChar = (opts.quoteStyle || defaultStyle) === 'double' ? '"' : "'";
      return quoteChar + s + quoteChar;
  }

  function quote(s) {
      return $replace$1.call(String(s), /"/g, '&quot;');
  }

  function isArray$1(obj) { return toStr$1(obj) === '[object Array]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
  function isDate(obj) { return toStr$1(obj) === '[object Date]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
  function isRegExp(obj) { return toStr$1(obj) === '[object RegExp]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
  function isError(obj) { return toStr$1(obj) === '[object Error]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
  function isString(obj) { return toStr$1(obj) === '[object String]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
  function isNumber(obj) { return toStr$1(obj) === '[object Number]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
  function isBoolean(obj) { return toStr$1(obj) === '[object Boolean]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }

  // Symbol and BigInt do have Symbol.toStringTag by spec, so that can't be used to eliminate false positives
  function isSymbol(obj) {
      if (hasShammedSymbols) {
          return obj && typeof obj === 'object' && obj instanceof Symbol;
      }
      if (typeof obj === 'symbol') {
          return true;
      }
      if (!obj || typeof obj !== 'object' || !symToString) {
          return false;
      }
      try {
          symToString.call(obj);
          return true;
      } catch (e) {}
      return false;
  }

  function isBigInt(obj) {
      if (!obj || typeof obj !== 'object' || !bigIntValueOf) {
          return false;
      }
      try {
          bigIntValueOf.call(obj);
          return true;
      } catch (e) {}
      return false;
  }

  var hasOwn = Object.prototype.hasOwnProperty || function (key) { return key in this; };
  function has(obj, key) {
      return hasOwn.call(obj, key);
  }

  function toStr$1(obj) {
      return objectToString.call(obj);
  }

  function nameOf(f) {
      if (f.name) { return f.name; }
      var m = $match.call(functionToString.call(f), /^function\s*([\w$]+)/);
      if (m) { return m[1]; }
      return null;
  }

  function indexOf(xs, x) {
      if (xs.indexOf) { return xs.indexOf(x); }
      for (var i = 0, l = xs.length; i < l; i++) {
          if (xs[i] === x) { return i; }
      }
      return -1;
  }

  function isMap(x) {
      if (!mapSize || !x || typeof x !== 'object') {
          return false;
      }
      try {
          mapSize.call(x);
          try {
              setSize.call(x);
          } catch (s) {
              return true;
          }
          return x instanceof Map; // core-js workaround, pre-v2.5.0
      } catch (e) {}
      return false;
  }

  function isWeakMap(x) {
      if (!weakMapHas || !x || typeof x !== 'object') {
          return false;
      }
      try {
          weakMapHas.call(x, weakMapHas);
          try {
              weakSetHas.call(x, weakSetHas);
          } catch (s) {
              return true;
          }
          return x instanceof WeakMap; // core-js workaround, pre-v2.5.0
      } catch (e) {}
      return false;
  }

  function isWeakRef(x) {
      if (!weakRefDeref || !x || typeof x !== 'object') {
          return false;
      }
      try {
          weakRefDeref.call(x);
          return true;
      } catch (e) {}
      return false;
  }

  function isSet(x) {
      if (!setSize || !x || typeof x !== 'object') {
          return false;
      }
      try {
          setSize.call(x);
          try {
              mapSize.call(x);
          } catch (m) {
              return true;
          }
          return x instanceof Set; // core-js workaround, pre-v2.5.0
      } catch (e) {}
      return false;
  }

  function isWeakSet(x) {
      if (!weakSetHas || !x || typeof x !== 'object') {
          return false;
      }
      try {
          weakSetHas.call(x, weakSetHas);
          try {
              weakMapHas.call(x, weakMapHas);
          } catch (s) {
              return true;
          }
          return x instanceof WeakSet; // core-js workaround, pre-v2.5.0
      } catch (e) {}
      return false;
  }

  function isElement(x) {
      if (!x || typeof x !== 'object') { return false; }
      if (typeof HTMLElement !== 'undefined' && x instanceof HTMLElement) {
          return true;
      }
      return typeof x.nodeName === 'string' && typeof x.getAttribute === 'function';
  }

  function inspectString(str, opts) {
      if (str.length > opts.maxStringLength) {
          var remaining = str.length - opts.maxStringLength;
          var trailer = '... ' + remaining + ' more character' + (remaining > 1 ? 's' : '');
          return inspectString($slice.call(str, 0, opts.maxStringLength), opts) + trailer;
      }
      // eslint-disable-next-line no-control-regex
      var s = $replace$1.call($replace$1.call(str, /(['\\])/g, '\\$1'), /[\x00-\x1f]/g, lowbyte);
      return wrapQuotes(s, 'single', opts);
  }

  function lowbyte(c) {
      var n = c.charCodeAt(0);
      var x = {
          8: 'b',
          9: 't',
          10: 'n',
          12: 'f',
          13: 'r'
      }[n];
      if (x) { return '\\' + x; }
      return '\\x' + (n < 0x10 ? '0' : '') + $toUpperCase.call(n.toString(16));
  }

  function markBoxed(str) {
      return 'Object(' + str + ')';
  }

  function weakCollectionOf(type) {
      return type + ' { ? }';
  }

  function collectionOf(type, size, entries, indent) {
      var joinedEntries = indent ? indentedJoin(entries, indent) : $join.call(entries, ', ');
      return type + ' (' + size + ') {' + joinedEntries + '}';
  }

  function singleLineValues(xs) {
      for (var i = 0; i < xs.length; i++) {
          if (indexOf(xs[i], '\n') >= 0) {
              return false;
          }
      }
      return true;
  }

  function getIndent(opts, depth) {
      var baseIndent;
      if (opts.indent === '\t') {
          baseIndent = '\t';
      } else if (typeof opts.indent === 'number' && opts.indent > 0) {
          baseIndent = $join.call(Array(opts.indent + 1), ' ');
      } else {
          return null;
      }
      return {
          base: baseIndent,
          prev: $join.call(Array(depth + 1), baseIndent)
      };
  }

  function indentedJoin(xs, indent) {
      if (xs.length === 0) { return ''; }
      var lineJoiner = '\n' + indent.prev + indent.base;
      return lineJoiner + $join.call(xs, ',' + lineJoiner) + '\n' + indent.prev;
  }

  function arrObjKeys(obj, inspect) {
      var isArr = isArray$1(obj);
      var xs = [];
      if (isArr) {
          xs.length = obj.length;
          for (var i = 0; i < obj.length; i++) {
              xs[i] = has(obj, i) ? inspect(obj[i], obj) : '';
          }
      }
      var syms = typeof gOPS === 'function' ? gOPS(obj) : [];
      var symMap;
      if (hasShammedSymbols) {
          symMap = {};
          for (var k = 0; k < syms.length; k++) {
              symMap['$' + syms[k]] = syms[k];
          }
      }

      for (var key in obj) { // eslint-disable-line no-restricted-syntax
          if (!has(obj, key)) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
          if (isArr && String(Number(key)) === key && key < obj.length) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
          if (hasShammedSymbols && symMap['$' + key] instanceof Symbol) {
              // this is to prevent shammed Symbols, which are stored as strings, from being included in the string key section
              continue; // eslint-disable-line no-restricted-syntax, no-continue
          } else if ($test.call(/[^\w$]/, key)) {
              xs.push(inspect(key, obj) + ': ' + inspect(obj[key], obj));
          } else {
              xs.push(key + ': ' + inspect(obj[key], obj));
          }
      }
      if (typeof gOPS === 'function') {
          for (var j = 0; j < syms.length; j++) {
              if (isEnumerable.call(obj, syms[j])) {
                  xs.push('[' + inspect(syms[j]) + ']: ' + inspect(obj[syms[j]], obj));
              }
          }
      }
      return xs;
  }

  var $TypeError$1 = getIntrinsic('%TypeError%');
  var $WeakMap = getIntrinsic('%WeakMap%', true);
  var $Map = getIntrinsic('%Map%', true);

  var $weakMapGet = callBound('WeakMap.prototype.get', true);
  var $weakMapSet = callBound('WeakMap.prototype.set', true);
  var $weakMapHas = callBound('WeakMap.prototype.has', true);
  var $mapGet = callBound('Map.prototype.get', true);
  var $mapSet = callBound('Map.prototype.set', true);
  var $mapHas = callBound('Map.prototype.has', true);

  /*
   * This function traverses the list returning the node corresponding to the
   * given key.
   *
   * That node is also moved to the head of the list, so that if it's accessed
   * again we don't need to traverse the whole list. By doing so, all the recently
   * used nodes can be accessed relatively quickly.
   */
  var listGetNode = function (list, key) { // eslint-disable-line consistent-return
  	for (var prev = list, curr; (curr = prev.next) !== null; prev = curr) {
  		if (curr.key === key) {
  			prev.next = curr.next;
  			curr.next = list.next;
  			list.next = curr; // eslint-disable-line no-param-reassign
  			return curr;
  		}
  	}
  };

  var listGet = function (objects, key) {
  	var node = listGetNode(objects, key);
  	return node && node.value;
  };
  var listSet = function (objects, key, value) {
  	var node = listGetNode(objects, key);
  	if (node) {
  		node.value = value;
  	} else {
  		// Prepend the new node to the beginning of the list
  		objects.next = { // eslint-disable-line no-param-reassign
  			key: key,
  			next: objects.next,
  			value: value
  		};
  	}
  };
  var listHas = function (objects, key) {
  	return !!listGetNode(objects, key);
  };

  var sideChannel = function getSideChannel() {
  	var $wm;
  	var $m;
  	var $o;
  	var channel = {
  		assert: function (key) {
  			if (!channel.has(key)) {
  				throw new $TypeError$1('Side channel does not contain ' + objectInspect(key));
  			}
  		},
  		get: function (key) { // eslint-disable-line consistent-return
  			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
  				if ($wm) {
  					return $weakMapGet($wm, key);
  				}
  			} else if ($Map) {
  				if ($m) {
  					return $mapGet($m, key);
  				}
  			} else {
  				if ($o) { // eslint-disable-line no-lonely-if
  					return listGet($o, key);
  				}
  			}
  		},
  		has: function (key) {
  			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
  				if ($wm) {
  					return $weakMapHas($wm, key);
  				}
  			} else if ($Map) {
  				if ($m) {
  					return $mapHas($m, key);
  				}
  			} else {
  				if ($o) { // eslint-disable-line no-lonely-if
  					return listHas($o, key);
  				}
  			}
  			return false;
  		},
  		set: function (key, value) {
  			if ($WeakMap && key && (typeof key === 'object' || typeof key === 'function')) {
  				if (!$wm) {
  					$wm = new $WeakMap();
  				}
  				$weakMapSet($wm, key, value);
  			} else if ($Map) {
  				if (!$m) {
  					$m = new $Map();
  				}
  				$mapSet($m, key, value);
  			} else {
  				if (!$o) {
  					/*
  					 * Initialize the linked list as an empty node, so that we don't have
  					 * to special-case handling of the first node: we can always refer to
  					 * it as (previous node).next, instead of something like (list).head
  					 */
  					$o = { key: {}, next: null };
  				}
  				listSet($o, key, value);
  			}
  		}
  	};
  	return channel;
  };

  var replace = String.prototype.replace;
  var percentTwenties = /%20/g;

  var Format = {
      RFC1738: 'RFC1738',
      RFC3986: 'RFC3986'
  };

  var formats = {
      'default': Format.RFC3986,
      formatters: {
          RFC1738: function (value) {
              return replace.call(value, percentTwenties, '+');
          },
          RFC3986: function (value) {
              return String(value);
          }
      },
      RFC1738: Format.RFC1738,
      RFC3986: Format.RFC3986
  };

  var has$1 = Object.prototype.hasOwnProperty;
  var isArray$2 = Array.isArray;

  var hexTable = (function () {
      var array = [];
      for (var i = 0; i < 256; ++i) {
          array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
      }

      return array;
  }());

  var compactQueue = function compactQueue(queue) {
      while (queue.length > 1) {
          var item = queue.pop();
          var obj = item.obj[item.prop];

          if (isArray$2(obj)) {
              var compacted = [];

              for (var j = 0; j < obj.length; ++j) {
                  if (typeof obj[j] !== 'undefined') {
                      compacted.push(obj[j]);
                  }
              }

              item.obj[item.prop] = compacted;
          }
      }
  };

  var arrayToObject = function arrayToObject(source, options) {
      var obj = options && options.plainObjects ? Object.create(null) : {};
      for (var i = 0; i < source.length; ++i) {
          if (typeof source[i] !== 'undefined') {
              obj[i] = source[i];
          }
      }

      return obj;
  };

  var merge$1 = function merge(target, source, options) {
      /* eslint no-param-reassign: 0 */
      if (!source) {
          return target;
      }

      if (typeof source !== 'object') {
          if (isArray$2(target)) {
              target.push(source);
          } else if (target && typeof target === 'object') {
              if ((options && (options.plainObjects || options.allowPrototypes)) || !has$1.call(Object.prototype, source)) {
                  target[source] = true;
              }
          } else {
              return [target, source];
          }

          return target;
      }

      if (!target || typeof target !== 'object') {
          return [target].concat(source);
      }

      var mergeTarget = target;
      if (isArray$2(target) && !isArray$2(source)) {
          mergeTarget = arrayToObject(target, options);
      }

      if (isArray$2(target) && isArray$2(source)) {
          source.forEach(function (item, i) {
              if (has$1.call(target, i)) {
                  var targetItem = target[i];
                  if (targetItem && typeof targetItem === 'object' && item && typeof item === 'object') {
                      target[i] = merge(targetItem, item, options);
                  } else {
                      target.push(item);
                  }
              } else {
                  target[i] = item;
              }
          });
          return target;
      }

      return Object.keys(source).reduce(function (acc, key) {
          var value = source[key];

          if (has$1.call(acc, key)) {
              acc[key] = merge(acc[key], value, options);
          } else {
              acc[key] = value;
          }
          return acc;
      }, mergeTarget);
  };

  var assign = function assignSingleSource(target, source) {
      return Object.keys(source).reduce(function (acc, key) {
          acc[key] = source[key];
          return acc;
      }, target);
  };

  var decode = function (str, decoder, charset) {
      var strWithoutPlus = str.replace(/\+/g, ' ');
      if (charset === 'iso-8859-1') {
          // unescape never throws, no try...catch needed:
          return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
      }
      // utf-8
      try {
          return decodeURIComponent(strWithoutPlus);
      } catch (e) {
          return strWithoutPlus;
      }
  };

  var encode = function encode(str, defaultEncoder, charset, kind, format) {
      // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
      // It has been adapted here for stricter adherence to RFC 3986
      if (str.length === 0) {
          return str;
      }

      var string = str;
      if (typeof str === 'symbol') {
          string = Symbol.prototype.toString.call(str);
      } else if (typeof str !== 'string') {
          string = String(str);
      }

      if (charset === 'iso-8859-1') {
          return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
              return '%26%23' + parseInt($0.slice(2), 16) + '%3B';
          });
      }

      var out = '';
      for (var i = 0; i < string.length; ++i) {
          var c = string.charCodeAt(i);

          if (
              c === 0x2D // -
              || c === 0x2E // .
              || c === 0x5F // _
              || c === 0x7E // ~
              || (c >= 0x30 && c <= 0x39) // 0-9
              || (c >= 0x41 && c <= 0x5A) // a-z
              || (c >= 0x61 && c <= 0x7A) // A-Z
              || (format === formats.RFC1738 && (c === 0x28 || c === 0x29)) // ( )
          ) {
              out += string.charAt(i);
              continue;
          }

          if (c < 0x80) {
              out = out + hexTable[c];
              continue;
          }

          if (c < 0x800) {
              out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
              continue;
          }

          if (c < 0xD800 || c >= 0xE000) {
              out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
              continue;
          }

          i += 1;
          c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
          /* eslint operator-linebreak: [2, "before"] */
          out += hexTable[0xF0 | (c >> 18)]
              + hexTable[0x80 | ((c >> 12) & 0x3F)]
              + hexTable[0x80 | ((c >> 6) & 0x3F)]
              + hexTable[0x80 | (c & 0x3F)];
      }

      return out;
  };

  var compact = function compact(value) {
      var queue = [{ obj: { o: value }, prop: 'o' }];
      var refs = [];

      for (var i = 0; i < queue.length; ++i) {
          var item = queue[i];
          var obj = item.obj[item.prop];

          var keys = Object.keys(obj);
          for (var j = 0; j < keys.length; ++j) {
              var key = keys[j];
              var val = obj[key];
              if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
                  queue.push({ obj: obj, prop: key });
                  refs.push(val);
              }
          }
      }

      compactQueue(queue);

      return value;
  };

  var isRegExp$1 = function isRegExp(obj) {
      return Object.prototype.toString.call(obj) === '[object RegExp]';
  };

  var isBuffer = function isBuffer(obj) {
      if (!obj || typeof obj !== 'object') {
          return false;
      }

      return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
  };

  var combine = function combine(a, b) {
      return [].concat(a, b);
  };

  var maybeMap = function maybeMap(val, fn) {
      if (isArray$2(val)) {
          var mapped = [];
          for (var i = 0; i < val.length; i += 1) {
              mapped.push(fn(val[i]));
          }
          return mapped;
      }
      return fn(val);
  };

  var utils = {
      arrayToObject: arrayToObject,
      assign: assign,
      combine: combine,
      compact: compact,
      decode: decode,
      encode: encode,
      isBuffer: isBuffer,
      isRegExp: isRegExp$1,
      maybeMap: maybeMap,
      merge: merge$1
  };

  var has$2 = Object.prototype.hasOwnProperty;

  var arrayPrefixGenerators = {
      brackets: function brackets(prefix) {
          return prefix + '[]';
      },
      comma: 'comma',
      indices: function indices(prefix, key) {
          return prefix + '[' + key + ']';
      },
      repeat: function repeat(prefix) {
          return prefix;
      }
  };

  var isArray$3 = Array.isArray;
  var split = String.prototype.split;
  var push = Array.prototype.push;
  var pushToArray = function (arr, valueOrArray) {
      push.apply(arr, isArray$3(valueOrArray) ? valueOrArray : [valueOrArray]);
  };

  var toISO = Date.prototype.toISOString;

  var defaultFormat = formats['default'];
  var defaults = {
      addQueryPrefix: false,
      allowDots: false,
      charset: 'utf-8',
      charsetSentinel: false,
      delimiter: '&',
      encode: true,
      encoder: utils.encode,
      encodeValuesOnly: false,
      format: defaultFormat,
      formatter: formats.formatters[defaultFormat],
      // deprecated
      indices: false,
      serializeDate: function serializeDate(date) {
          return toISO.call(date);
      },
      skipNulls: false,
      strictNullHandling: false
  };

  var isNonNullishPrimitive = function isNonNullishPrimitive(v) {
      return typeof v === 'string'
          || typeof v === 'number'
          || typeof v === 'boolean'
          || typeof v === 'symbol'
          || typeof v === 'bigint';
  };

  var sentinel = {};

  var stringify = function stringify(
      object,
      prefix,
      generateArrayPrefix,
      commaRoundTrip,
      strictNullHandling,
      skipNulls,
      encoder,
      filter,
      sort,
      allowDots,
      serializeDate,
      format,
      formatter,
      encodeValuesOnly,
      charset,
      sideChannel$1
  ) {
      var obj = object;

      var tmpSc = sideChannel$1;
      var step = 0;
      var findFlag = false;
      while ((tmpSc = tmpSc.get(sentinel)) !== void undefined && !findFlag) {
          // Where object last appeared in the ref tree
          var pos = tmpSc.get(object);
          step += 1;
          if (typeof pos !== 'undefined') {
              if (pos === step) {
                  throw new RangeError('Cyclic object value');
              } else {
                  findFlag = true; // Break while
              }
          }
          if (typeof tmpSc.get(sentinel) === 'undefined') {
              step = 0;
          }
      }

      if (typeof filter === 'function') {
          obj = filter(prefix, obj);
      } else if (obj instanceof Date) {
          obj = serializeDate(obj);
      } else if (generateArrayPrefix === 'comma' && isArray$3(obj)) {
          obj = utils.maybeMap(obj, function (value) {
              if (value instanceof Date) {
                  return serializeDate(value);
              }
              return value;
          });
      }

      if (obj === null) {
          if (strictNullHandling) {
              return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset, 'key', format) : prefix;
          }

          obj = '';
      }

      if (isNonNullishPrimitive(obj) || utils.isBuffer(obj)) {
          if (encoder) {
              var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset, 'key', format);
              if (generateArrayPrefix === 'comma' && encodeValuesOnly) {
                  var valuesArray = split.call(String(obj), ',');
                  var valuesJoined = '';
                  for (var i = 0; i < valuesArray.length; ++i) {
                      valuesJoined += (i === 0 ? '' : ',') + formatter(encoder(valuesArray[i], defaults.encoder, charset, 'value', format));
                  }
                  return [formatter(keyValue) + (commaRoundTrip && isArray$3(obj) && valuesArray.length === 1 ? '[]' : '') + '=' + valuesJoined];
              }
              return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults.encoder, charset, 'value', format))];
          }
          return [formatter(prefix) + '=' + formatter(String(obj))];
      }

      var values = [];

      if (typeof obj === 'undefined') {
          return values;
      }

      var objKeys;
      if (generateArrayPrefix === 'comma' && isArray$3(obj)) {
          // we need to join elements in
          objKeys = [{ value: obj.length > 0 ? obj.join(',') || null : void undefined }];
      } else if (isArray$3(filter)) {
          objKeys = filter;
      } else {
          var keys = Object.keys(obj);
          objKeys = sort ? keys.sort(sort) : keys;
      }

      var adjustedPrefix = commaRoundTrip && isArray$3(obj) && obj.length === 1 ? prefix + '[]' : prefix;

      for (var j = 0; j < objKeys.length; ++j) {
          var key = objKeys[j];
          var value = typeof key === 'object' && typeof key.value !== 'undefined' ? key.value : obj[key];

          if (skipNulls && value === null) {
              continue;
          }

          var keyPrefix = isArray$3(obj)
              ? typeof generateArrayPrefix === 'function' ? generateArrayPrefix(adjustedPrefix, key) : adjustedPrefix
              : adjustedPrefix + (allowDots ? '.' + key : '[' + key + ']');

          sideChannel$1.set(object, step);
          var valueSideChannel = sideChannel();
          valueSideChannel.set(sentinel, sideChannel$1);
          pushToArray(values, stringify(
              value,
              keyPrefix,
              generateArrayPrefix,
              commaRoundTrip,
              strictNullHandling,
              skipNulls,
              encoder,
              filter,
              sort,
              allowDots,
              serializeDate,
              format,
              formatter,
              encodeValuesOnly,
              charset,
              valueSideChannel
          ));
      }

      return values;
  };

  var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
      if (!opts) {
          return defaults;
      }

      if (opts.encoder !== null && typeof opts.encoder !== 'undefined' && typeof opts.encoder !== 'function') {
          throw new TypeError('Encoder has to be a function.');
      }

      var charset = opts.charset || defaults.charset;
      if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
          throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
      }

      var format = formats['default'];
      if (typeof opts.format !== 'undefined') {
          if (!has$2.call(formats.formatters, opts.format)) {
              throw new TypeError('Unknown format option provided.');
          }
          format = opts.format;
      }
      var formatter = formats.formatters[format];

      var filter = defaults.filter;
      if (typeof opts.filter === 'function' || isArray$3(opts.filter)) {
          filter = opts.filter;
      }

      return {
          addQueryPrefix: typeof opts.addQueryPrefix === 'boolean' ? opts.addQueryPrefix : defaults.addQueryPrefix,
          allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
          charset: charset,
          charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
          delimiter: typeof opts.delimiter === 'undefined' ? defaults.delimiter : opts.delimiter,
          encode: typeof opts.encode === 'boolean' ? opts.encode : defaults.encode,
          encoder: typeof opts.encoder === 'function' ? opts.encoder : defaults.encoder,
          encodeValuesOnly: typeof opts.encodeValuesOnly === 'boolean' ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
          filter: filter,
          format: format,
          formatter: formatter,
          serializeDate: typeof opts.serializeDate === 'function' ? opts.serializeDate : defaults.serializeDate,
          skipNulls: typeof opts.skipNulls === 'boolean' ? opts.skipNulls : defaults.skipNulls,
          sort: typeof opts.sort === 'function' ? opts.sort : null,
          strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
      };
  };

  var stringify_1 = function (object, opts) {
      var obj = object;
      var options = normalizeStringifyOptions(opts);

      var objKeys;
      var filter;

      if (typeof options.filter === 'function') {
          filter = options.filter;
          obj = filter('', obj);
      } else if (isArray$3(options.filter)) {
          filter = options.filter;
          objKeys = filter;
      }

      var keys = [];

      if (typeof obj !== 'object' || obj === null) {
          return '';
      }

      var arrayFormat;
      if (opts && opts.arrayFormat in arrayPrefixGenerators) {
          arrayFormat = opts.arrayFormat;
      } else if (opts && 'indices' in opts) {
          arrayFormat = opts.indices ? 'indices' : 'repeat';
      } else {
          arrayFormat = 'indices';
      }

      var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];
      if (opts && 'commaRoundTrip' in opts && typeof opts.commaRoundTrip !== 'boolean') {
          throw new TypeError('`commaRoundTrip` must be a boolean, or absent');
      }
      var commaRoundTrip = generateArrayPrefix === 'comma' && opts && opts.commaRoundTrip;

      if (!objKeys) {
          objKeys = Object.keys(obj);
      }

      if (options.sort) {
          objKeys.sort(options.sort);
      }

      var sideChannel$1 = sideChannel();
      for (var i = 0; i < objKeys.length; ++i) {
          var key = objKeys[i];

          if (options.skipNulls && obj[key] === null) {
              continue;
          }
          pushToArray(keys, stringify(
              obj[key],
              key,
              generateArrayPrefix,
              commaRoundTrip,
              options.strictNullHandling,
              options.skipNulls,
              options.encode ? options.encoder : null,
              options.filter,
              options.sort,
              options.allowDots,
              options.serializeDate,
              options.format,
              options.formatter,
              options.encodeValuesOnly,
              options.charset,
              sideChannel$1
          ));
      }

      var joined = keys.join(options.delimiter);
      var prefix = options.addQueryPrefix === true ? '?' : '';

      if (options.charsetSentinel) {
          if (options.charset === 'iso-8859-1') {
              // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
              prefix += 'utf8=%26%2310003%3B&';
          } else {
              // encodeURIComponent('✓')
              prefix += 'utf8=%E2%9C%93&';
          }
      }

      return joined.length > 0 ? prefix + joined : '';
  };

  var has$3 = Object.prototype.hasOwnProperty;
  var isArray$4 = Array.isArray;

  var defaults$1 = {
      allowDots: false,
      allowPrototypes: false,
      allowSparse: false,
      arrayLimit: 20,
      charset: 'utf-8',
      charsetSentinel: false,
      comma: false,
      decoder: utils.decode,
      delimiter: '&',
      depth: 5,
      ignoreQueryPrefix: false,
      interpretNumericEntities: false,
      parameterLimit: 1000,
      parseArrays: true,
      plainObjects: false,
      strictNullHandling: false
  };

  var interpretNumericEntities = function (str) {
      return str.replace(/&#(\d+);/g, function ($0, numberStr) {
          return String.fromCharCode(parseInt(numberStr, 10));
      });
  };

  var parseArrayValue = function (val, options) {
      if (val && typeof val === 'string' && options.comma && val.indexOf(',') > -1) {
          return val.split(',');
      }

      return val;
  };

  // This is what browsers will submit when the ✓ character occurs in an
  // application/x-www-form-urlencoded body and the encoding of the page containing
  // the form is iso-8859-1, or when the submitted form has an accept-charset
  // attribute of iso-8859-1. Presumably also with other charsets that do not contain
  // the ✓ character, such as us-ascii.
  var isoSentinel = 'utf8=%26%2310003%3B'; // encodeURIComponent('&#10003;')

  // These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.
  var charsetSentinel = 'utf8=%E2%9C%93'; // encodeURIComponent('✓')

  var parseValues = function parseQueryStringValues(str, options) {
      var obj = {};
      var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
      var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
      var parts = cleanStr.split(options.delimiter, limit);
      var skipIndex = -1; // Keep track of where the utf8 sentinel was found
      var i;

      var charset = options.charset;
      if (options.charsetSentinel) {
          for (i = 0; i < parts.length; ++i) {
              if (parts[i].indexOf('utf8=') === 0) {
                  if (parts[i] === charsetSentinel) {
                      charset = 'utf-8';
                  } else if (parts[i] === isoSentinel) {
                      charset = 'iso-8859-1';
                  }
                  skipIndex = i;
                  i = parts.length; // The eslint settings do not allow break;
              }
          }
      }

      for (i = 0; i < parts.length; ++i) {
          if (i === skipIndex) {
              continue;
          }
          var part = parts[i];

          var bracketEqualsPos = part.indexOf(']=');
          var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

          var key, val;
          if (pos === -1) {
              key = options.decoder(part, defaults$1.decoder, charset, 'key');
              val = options.strictNullHandling ? null : '';
          } else {
              key = options.decoder(part.slice(0, pos), defaults$1.decoder, charset, 'key');
              val = utils.maybeMap(
                  parseArrayValue(part.slice(pos + 1), options),
                  function (encodedVal) {
                      return options.decoder(encodedVal, defaults$1.decoder, charset, 'value');
                  }
              );
          }

          if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
              val = interpretNumericEntities(val);
          }

          if (part.indexOf('[]=') > -1) {
              val = isArray$4(val) ? [val] : val;
          }

          if (has$3.call(obj, key)) {
              obj[key] = utils.combine(obj[key], val);
          } else {
              obj[key] = val;
          }
      }

      return obj;
  };

  var parseObject = function (chain, val, options, valuesParsed) {
      var leaf = valuesParsed ? val : parseArrayValue(val, options);

      for (var i = chain.length - 1; i >= 0; --i) {
          var obj;
          var root = chain[i];

          if (root === '[]' && options.parseArrays) {
              obj = [].concat(leaf);
          } else {
              obj = options.plainObjects ? Object.create(null) : {};
              var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
              var index = parseInt(cleanRoot, 10);
              if (!options.parseArrays && cleanRoot === '') {
                  obj = { 0: leaf };
              } else if (
                  !isNaN(index)
                  && root !== cleanRoot
                  && String(index) === cleanRoot
                  && index >= 0
                  && (options.parseArrays && index <= options.arrayLimit)
              ) {
                  obj = [];
                  obj[index] = leaf;
              } else if (cleanRoot !== '__proto__') {
                  obj[cleanRoot] = leaf;
              }
          }

          leaf = obj;
      }

      return leaf;
  };

  var parseKeys = function parseQueryStringKeys(givenKey, val, options, valuesParsed) {
      if (!givenKey) {
          return;
      }

      // Transform dot notation to bracket notation
      var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

      // The regex chunks

      var brackets = /(\[[^[\]]*])/;
      var child = /(\[[^[\]]*])/g;

      // Get the parent

      var segment = options.depth > 0 && brackets.exec(key);
      var parent = segment ? key.slice(0, segment.index) : key;

      // Stash the parent if it exists

      var keys = [];
      if (parent) {
          // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
          if (!options.plainObjects && has$3.call(Object.prototype, parent)) {
              if (!options.allowPrototypes) {
                  return;
              }
          }

          keys.push(parent);
      }

      // Loop through children appending to the array until we hit depth

      var i = 0;
      while (options.depth > 0 && (segment = child.exec(key)) !== null && i < options.depth) {
          i += 1;
          if (!options.plainObjects && has$3.call(Object.prototype, segment[1].slice(1, -1))) {
              if (!options.allowPrototypes) {
                  return;
              }
          }
          keys.push(segment[1]);
      }

      // If there's a remainder, just add whatever is left

      if (segment) {
          keys.push('[' + key.slice(segment.index) + ']');
      }

      return parseObject(keys, val, options, valuesParsed);
  };

  var normalizeParseOptions = function normalizeParseOptions(opts) {
      if (!opts) {
          return defaults$1;
      }

      if (opts.decoder !== null && opts.decoder !== undefined && typeof opts.decoder !== 'function') {
          throw new TypeError('Decoder has to be a function.');
      }

      if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
          throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
      }
      var charset = typeof opts.charset === 'undefined' ? defaults$1.charset : opts.charset;

      return {
          allowDots: typeof opts.allowDots === 'undefined' ? defaults$1.allowDots : !!opts.allowDots,
          allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults$1.allowPrototypes,
          allowSparse: typeof opts.allowSparse === 'boolean' ? opts.allowSparse : defaults$1.allowSparse,
          arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults$1.arrayLimit,
          charset: charset,
          charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults$1.charsetSentinel,
          comma: typeof opts.comma === 'boolean' ? opts.comma : defaults$1.comma,
          decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults$1.decoder,
          delimiter: typeof opts.delimiter === 'string' || utils.isRegExp(opts.delimiter) ? opts.delimiter : defaults$1.delimiter,
          // eslint-disable-next-line no-implicit-coercion, no-extra-parens
          depth: (typeof opts.depth === 'number' || opts.depth === false) ? +opts.depth : defaults$1.depth,
          ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
          interpretNumericEntities: typeof opts.interpretNumericEntities === 'boolean' ? opts.interpretNumericEntities : defaults$1.interpretNumericEntities,
          parameterLimit: typeof opts.parameterLimit === 'number' ? opts.parameterLimit : defaults$1.parameterLimit,
          parseArrays: opts.parseArrays !== false,
          plainObjects: typeof opts.plainObjects === 'boolean' ? opts.plainObjects : defaults$1.plainObjects,
          strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults$1.strictNullHandling
      };
  };

  var parse = function (str, opts) {
      var options = normalizeParseOptions(opts);

      if (str === '' || str === null || typeof str === 'undefined') {
          return options.plainObjects ? Object.create(null) : {};
      }

      var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
      var obj = options.plainObjects ? Object.create(null) : {};

      // Iterate over the keys and setup the new object

      var keys = Object.keys(tempObj);
      for (var i = 0; i < keys.length; ++i) {
          var key = keys[i];
          var newObj = parseKeys(key, tempObj[key], options, typeof str === 'string');
          obj = utils.merge(obj, newObj, options);
      }

      if (options.allowSparse === true) {
          return obj;
      }

      return utils.compact(obj);
  };

  var lib = {
      formats: formats,
      parse: parse,
      stringify: stringify_1
  };

  function PopupHandler(webAuth) {
    this.webAuth = webAuth;
    this._current_popup = null;
    this.options = null;
  }

  PopupHandler.prototype.preload = function(options) {
    var _this = this;
    var _window = windowHandler.getWindow();

    var url = options.url || 'about:blank';
    var popupOptions = options.popupOptions || {};

    popupOptions.location = 'yes';
    delete popupOptions.width;
    delete popupOptions.height;

    var windowFeatures = lib.stringify(popupOptions, {
      encode: false,
      delimiter: ','
    });

    if (this._current_popup && !this._current_popup.closed) {
      return this._current_popup;
    }

    this._current_popup = _window.open(url, '_blank', windowFeatures);

    this._current_popup.kill = function(success) {
      _this._current_popup.success = success;
      this.close();
      _this._current_popup = null;
    };

    return this._current_popup;
  };

  PopupHandler.prototype.load = function(url, _, options, cb) {
    var _this = this;
    this.url = url;
    this.options = options;
    if (!this._current_popup) {
      options.url = url;
      this.preload(options);
    } else {
      this._current_popup.location.href = url;
    }

    this.transientErrorHandler = function(event) {
      _this.errorHandler(event, cb);
    };

    this.transientStartHandler = function(event) {
      _this.startHandler(event, cb);
    };

    this.transientExitHandler = function() {
      _this.exitHandler(cb);
    };

    this._current_popup.addEventListener('loaderror', this.transientErrorHandler);
    this._current_popup.addEventListener('loadstart', this.transientStartHandler);
    this._current_popup.addEventListener('exit', this.transientExitHandler);
  };

  PopupHandler.prototype.errorHandler = function(event, cb) {
    if (!this._current_popup) {
      return;
    }

    this._current_popup.kill(true);

    cb({ error: 'window_error', errorDescription: event.message });
  };

  PopupHandler.prototype.unhook = function() {
    this._current_popup.removeEventListener(
      'loaderror',
      this.transientErrorHandler
    );
    this._current_popup.removeEventListener(
      'loadstart',
      this.transientStartHandler
    );
    this._current_popup.removeEventListener('exit', this.transientExitHandler);
  };

  PopupHandler.prototype.exitHandler = function(cb) {
    if (!this._current_popup) {
      return;
    }

    // when the modal is closed, this event is called which ends up removing the
    // event listeners. If you move this before closing the modal, it will add ~1 sec
    // delay between the user being redirected to the callback and the popup gets closed.
    this.unhook();

    if (!this._current_popup.success) {
      cb({ error: 'window_closed', errorDescription: 'Browser window closed' });
    }
  };

  PopupHandler.prototype.startHandler = function(event, cb) {
    var _this = this;

    if (!this._current_popup) {
      return;
    }

    var callbackUrl = urlJoin(
      'https:',
      this.webAuth.baseOptions.domain,
      '/mobile'
    );

    if (event.url && !(event.url.indexOf(callbackUrl + '#') === 0)) {
      return;
    }

    var parts = event.url.split('#');

    if (parts.length === 1) {
      return;
    }

    var opts = { hash: parts.pop() };

    if (this.options.nonce) {
      opts.nonce = this.options.nonce;
    }

    this.webAuth.parseHash(opts, function(error, result) {
      if (error || result) {
        _this._current_popup.kill(true);
        cb(error, result);
      }
    });
  };

  function PluginHandler(webAuth) {
    this.webAuth = webAuth;
  }

  PluginHandler.prototype.processParams = function(params) {
    params.redirectUri = urlJoin('https://' + params.domain, 'mobile');
    delete params.owp;
    return params;
  };

  PluginHandler.prototype.getPopupHandler = function() {
    return new PopupHandler(this.webAuth);
  };

  function CordovaPlugin() {
    this.webAuth = null;
    this.version = version.raw;
    this.extensibilityPoints = ['popup.authorize', 'popup.getPopupHandler'];
  }

  CordovaPlugin.prototype.setWebAuth = function(webAuth) {
    this.webAuth = webAuth;
  };

  CordovaPlugin.prototype.supports = function(extensibilityPoint) {
    var _window = windowHandler.getWindow();
    return (
      (!!_window.cordova || !!_window.electron) &&
      this.extensibilityPoints.indexOf(extensibilityPoint) > -1
    );
  };

  CordovaPlugin.prototype.init = function() {
    return new PluginHandler(this.webAuth);
  };

  return CordovaPlugin;

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZG92YS1hdXRoMC1wbHVnaW4uanMiLCJzb3VyY2VzIjpbIi4uL3NyYy92ZXJzaW9uLmpzIiwiLi4vc3JjL2hlbHBlci9hc3NlcnQuanMiLCIuLi9zcmMvaGVscGVyL29iamVjdC1hc3NpZ24uanMiLCIuLi9zcmMvaGVscGVyL29iamVjdC5qcyIsIi4uL3NyYy9oZWxwZXIvd2luZG93LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3VybC1qb2luL2xpYi91cmwtam9pbi5qcyIsIi4uL25vZGVfbW9kdWxlcy9oYXMtc3ltYm9scy9zaGFtcy5qcyIsIi4uL25vZGVfbW9kdWxlcy9oYXMtc3ltYm9scy9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9mdW5jdGlvbi1iaW5kL2ltcGxlbWVudGF0aW9uLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2Z1bmN0aW9uLWJpbmQvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvaGFzL3NyYy9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9nZXQtaW50cmluc2ljL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2NhbGwtYmluZC9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9jYWxsLWJpbmQvY2FsbEJvdW5kLmpzIiwiLi4vbm9kZV9tb2R1bGVzL29iamVjdC1pbnNwZWN0L2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NpZGUtY2hhbm5lbC9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9xcy9saWIvZm9ybWF0cy5qcyIsIi4uL25vZGVfbW9kdWxlcy9xcy9saWIvdXRpbHMuanMiLCIuLi9ub2RlX21vZHVsZXMvcXMvbGliL3N0cmluZ2lmeS5qcyIsIi4uL25vZGVfbW9kdWxlcy9xcy9saWIvcGFyc2UuanMiLCIuLi9ub2RlX21vZHVsZXMvcXMvbGliL2luZGV4LmpzIiwiLi4vcGx1Z2lucy9jb3Jkb3ZhL3BvcHVwLWhhbmRsZXIuanMiLCIuLi9wbHVnaW5zL2NvcmRvdmEvcGx1Z2luLWhhbmRsZXIuanMiLCIuLi9wbHVnaW5zL2NvcmRvdmEvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSB7IHJhdzogJzkuMjAuMicgfTtcbiIsInZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbmZ1bmN0aW9uIGF0dHJpYnV0ZShvLCBhdHRyLCB0eXBlLCB0ZXh0KSB7XG4gIHR5cGUgPSB0eXBlID09PSAnYXJyYXknID8gJ29iamVjdCcgOiB0eXBlO1xuICBpZiAobyAmJiB0eXBlb2Ygb1thdHRyXSAhPT0gdHlwZSkge1xuICAgIHRocm93IG5ldyBFcnJvcih0ZXh0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB2YXJpYWJsZShvLCB0eXBlLCB0ZXh0KSB7XG4gIGlmICh0eXBlb2YgbyAhPT0gdHlwZSkge1xuICAgIHRocm93IG5ldyBFcnJvcih0ZXh0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB2YWx1ZShvLCB2YWx1ZXMsIHRleHQpIHtcbiAgaWYgKHZhbHVlcy5pbmRleE9mKG8pID09PSAtMSkge1xuICAgIHRocm93IG5ldyBFcnJvcih0ZXh0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjaGVjayhvLCBjb25maWcsIGF0dHJpYnV0ZXMpIHtcbiAgaWYgKCFjb25maWcub3B0aW9uYWwgfHwgbykge1xuICAgIHZhcmlhYmxlKG8sIGNvbmZpZy50eXBlLCBjb25maWcubWVzc2FnZSk7XG4gIH1cbiAgaWYgKGNvbmZpZy50eXBlID09PSAnb2JqZWN0JyAmJiBhdHRyaWJ1dGVzKSB7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKTtcblxuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBrZXlzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgdmFyIGEgPSBrZXlzW2luZGV4XTtcbiAgICAgIGlmICghYXR0cmlidXRlc1thXS5vcHRpb25hbCB8fCBvW2FdKSB7XG4gICAgICAgIGlmICghYXR0cmlidXRlc1thXS5jb25kaXRpb24gfHwgYXR0cmlidXRlc1thXS5jb25kaXRpb24obykpIHtcbiAgICAgICAgICBhdHRyaWJ1dGUobywgYSwgYXR0cmlidXRlc1thXS50eXBlLCBhdHRyaWJ1dGVzW2FdLm1lc3NhZ2UpO1xuICAgICAgICAgIGlmIChhdHRyaWJ1dGVzW2FdLnZhbHVlcykge1xuICAgICAgICAgICAgdmFsdWUob1thXSwgYXR0cmlidXRlc1thXS52YWx1ZXMsIGF0dHJpYnV0ZXNbYV0udmFsdWVfbWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogV3JhcCBgQXJyYXkuaXNBcnJheWAgUG9seWZpbGwgZm9yIElFOVxuICogc291cmNlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9pc0FycmF5XG4gKlxuICogQHBhcmFtIHtBcnJheX0gYXJyYXlcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIGlzQXJyYXkoYXJyYXkpIHtcbiAgaWYgKHRoaXMuc3VwcG9ydHNJc0FycmF5KCkpIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheShhcnJheSk7XG4gIH1cblxuICByZXR1cm4gdG9TdHJpbmcuY2FsbChhcnJheSkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59XG5cbmZ1bmN0aW9uIHN1cHBvcnRzSXNBcnJheSgpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkgIT0gbnVsbDtcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICBjaGVjazogY2hlY2ssXG4gIGF0dHJpYnV0ZTogYXR0cmlidXRlLFxuICB2YXJpYWJsZTogdmFyaWFibGUsXG4gIHZhbHVlOiB2YWx1ZSxcbiAgaXNBcnJheTogaXNBcnJheSxcbiAgc3VwcG9ydHNJc0FycmF5OiBzdXBwb3J0c0lzQXJyYXlcbn07XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBuby1jb250aW51ZSAqL1xuXG5mdW5jdGlvbiBnZXQoKSB7XG4gIGlmICghT2JqZWN0LmFzc2lnbikge1xuICAgIHJldHVybiBvYmplY3RBc3NpZ25Qb2x5ZmlsbDtcbiAgfVxuXG4gIHJldHVybiBPYmplY3QuYXNzaWduO1xufVxuXG5mdW5jdGlvbiBvYmplY3RBc3NpZ25Qb2x5ZmlsbCh0YXJnZXQpIHtcbiAgaWYgKHRhcmdldCA9PT0gdW5kZWZpbmVkIHx8IHRhcmdldCA9PT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjb252ZXJ0IGZpcnN0IGFyZ3VtZW50IHRvIG9iamVjdCcpO1xuICB9XG5cbiAgdmFyIHRvID0gT2JqZWN0KHRhcmdldCk7XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIG5leHRTb3VyY2UgPSBhcmd1bWVudHNbaV07XG4gICAgaWYgKG5leHRTb3VyY2UgPT09IHVuZGVmaW5lZCB8fCBuZXh0U291cmNlID09PSBudWxsKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICB2YXIga2V5c0FycmF5ID0gT2JqZWN0LmtleXMoT2JqZWN0KG5leHRTb3VyY2UpKTtcbiAgICBmb3IgKFxuICAgICAgdmFyIG5leHRJbmRleCA9IDAsIGxlbiA9IGtleXNBcnJheS5sZW5ndGg7XG4gICAgICBuZXh0SW5kZXggPCBsZW47XG4gICAgICBuZXh0SW5kZXgrK1xuICAgICkge1xuICAgICAgdmFyIG5leHRLZXkgPSBrZXlzQXJyYXlbbmV4dEluZGV4XTtcbiAgICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihuZXh0U291cmNlLCBuZXh0S2V5KTtcbiAgICAgIGlmIChkZXNjICE9PSB1bmRlZmluZWQgJiYgZGVzYy5lbnVtZXJhYmxlKSB7XG4gICAgICAgIHRvW25leHRLZXldID0gbmV4dFNvdXJjZVtuZXh0S2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRvO1xufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGdldDogZ2V0LFxuICBvYmplY3RBc3NpZ25Qb2x5ZmlsbDogb2JqZWN0QXNzaWduUG9seWZpbGxcbn07XG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBuby1wYXJhbS1yZWFzc2lnbiAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tcmVzdHJpY3RlZC1zeW50YXggKi9cbi8qIGVzbGludC1kaXNhYmxlIGd1YXJkLWZvci1pbiAqL1xuXG5pbXBvcnQgYXNzZXJ0IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCBvYmplY3RBc3NpZ24gZnJvbSAnLi9vYmplY3QtYXNzaWduJztcblxuZnVuY3Rpb24gcGljayhvYmplY3QsIGtleXMpIHtcbiAgcmV0dXJuIGtleXMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGtleSkge1xuICAgIGlmIChvYmplY3Rba2V5XSkge1xuICAgICAgcHJldltrZXldID0gb2JqZWN0W2tleV07XG4gICAgfVxuICAgIHJldHVybiBwcmV2O1xuICB9LCB7fSk7XG59XG5cbmZ1bmN0aW9uIGdldEtleXNOb3RJbihvYmosIGFsbG93ZWRLZXlzKSB7XG4gIHZhciBub3RBbGxvd2VkID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoYWxsb3dlZEtleXMuaW5kZXhPZihrZXkpID09PSAtMSkge1xuICAgICAgbm90QWxsb3dlZC5wdXNoKGtleSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBub3RBbGxvd2VkO1xufVxuXG5mdW5jdGlvbiBvYmplY3RWYWx1ZXMob2JqKSB7XG4gIHZhciB2YWx1ZXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIHZhbHVlcy5wdXNoKG9ialtrZXldKTtcbiAgfVxuICByZXR1cm4gdmFsdWVzO1xufVxuXG5mdW5jdGlvbiBleHRlbmQoKSB7XG4gIHZhciBwYXJhbXMgPSBvYmplY3RWYWx1ZXMoYXJndW1lbnRzKTtcbiAgcGFyYW1zLnVuc2hpZnQoe30pO1xuICByZXR1cm4gb2JqZWN0QXNzaWduLmdldCgpLmFwcGx5KHVuZGVmaW5lZCwgcGFyYW1zKTtcbn1cblxuZnVuY3Rpb24gbWVyZ2Uob2JqZWN0LCBrZXlzKSB7XG4gIHJldHVybiB7XG4gICAgYmFzZToga2V5cyA/IHBpY2sob2JqZWN0LCBrZXlzKSA6IG9iamVjdCxcbiAgICB3aXRoOiBmdW5jdGlvbihvYmplY3QyLCBrZXlzMikge1xuICAgICAgb2JqZWN0MiA9IGtleXMyID8gcGljayhvYmplY3QyLCBrZXlzMikgOiBvYmplY3QyO1xuICAgICAgcmV0dXJuIGV4dGVuZCh0aGlzLmJhc2UsIG9iamVjdDIpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gYmxhY2tsaXN0KG9iamVjdCwgYmxhY2tsaXN0ZWRLZXlzKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhvYmplY3QpLnJlZHVjZShmdW5jdGlvbihwLCBrZXkpIHtcbiAgICBpZiAoYmxhY2tsaXN0ZWRLZXlzLmluZGV4T2Yoa2V5KSA9PT0gLTEpIHtcbiAgICAgIHBba2V5XSA9IG9iamVjdFtrZXldO1xuICAgIH1cbiAgICByZXR1cm4gcDtcbiAgfSwge30pO1xufVxuXG5mdW5jdGlvbiBjYW1lbFRvU25ha2Uoc3RyKSB7XG4gIHZhciBuZXdLZXkgPSAnJztcbiAgdmFyIGluZGV4ID0gMDtcbiAgdmFyIGNvZGU7XG4gIHZhciB3YXNQcmV2TnVtYmVyID0gdHJ1ZTtcbiAgdmFyIHdhc1ByZXZVcHBlcmNhc2UgPSB0cnVlO1xuXG4gIHdoaWxlIChpbmRleCA8IHN0ci5sZW5ndGgpIHtcbiAgICBjb2RlID0gc3RyLmNoYXJDb2RlQXQoaW5kZXgpO1xuICAgIGlmIChcbiAgICAgICghd2FzUHJldlVwcGVyY2FzZSAmJiBjb2RlID49IDY1ICYmIGNvZGUgPD0gOTApIHx8XG4gICAgICAoIXdhc1ByZXZOdW1iZXIgJiYgY29kZSA+PSA0OCAmJiBjb2RlIDw9IDU3KVxuICAgICkge1xuICAgICAgbmV3S2V5ICs9ICdfJztcbiAgICAgIG5ld0tleSArPSBzdHJbaW5kZXhdLnRvTG93ZXJDYXNlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld0tleSArPSBzdHJbaW5kZXhdLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuICAgIHdhc1ByZXZOdW1iZXIgPSBjb2RlID49IDQ4ICYmIGNvZGUgPD0gNTc7XG4gICAgd2FzUHJldlVwcGVyY2FzZSA9IGNvZGUgPj0gNjUgJiYgY29kZSA8PSA5MDtcbiAgICBpbmRleCsrO1xuICB9XG5cbiAgcmV0dXJuIG5ld0tleTtcbn1cblxuZnVuY3Rpb24gc25ha2VUb0NhbWVsKHN0cikge1xuICB2YXIgcGFydHMgPSBzdHIuc3BsaXQoJ18nKTtcbiAgcmV0dXJuIHBhcnRzLnJlZHVjZShmdW5jdGlvbihwLCBjKSB7XG4gICAgcmV0dXJuIHAgKyBjLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgYy5zbGljZSgxKTtcbiAgfSwgcGFydHMuc2hpZnQoKSk7XG59XG5cbmZ1bmN0aW9uIHRvU25ha2VDYXNlKG9iamVjdCwgZXhjZXB0aW9ucykge1xuICBpZiAodHlwZW9mIG9iamVjdCAhPT0gJ29iamVjdCcgfHwgYXNzZXJ0LmlzQXJyYXkob2JqZWN0KSB8fCBvYmplY3QgPT09IG51bGwpIHtcbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG4gIGV4Y2VwdGlvbnMgPSBleGNlcHRpb25zIHx8IFtdO1xuXG4gIHJldHVybiBPYmplY3Qua2V5cyhvYmplY3QpLnJlZHVjZShmdW5jdGlvbihwLCBrZXkpIHtcbiAgICB2YXIgbmV3S2V5ID0gZXhjZXB0aW9ucy5pbmRleE9mKGtleSkgPT09IC0xID8gY2FtZWxUb1NuYWtlKGtleSkgOiBrZXk7XG4gICAgcFtuZXdLZXldID0gdG9TbmFrZUNhc2Uob2JqZWN0W2tleV0pO1xuICAgIHJldHVybiBwO1xuICB9LCB7fSk7XG59XG5cbmZ1bmN0aW9uIHRvQ2FtZWxDYXNlKG9iamVjdCwgZXhjZXB0aW9ucywgb3B0aW9ucykge1xuICBpZiAodHlwZW9mIG9iamVjdCAhPT0gJ29iamVjdCcgfHwgYXNzZXJ0LmlzQXJyYXkob2JqZWN0KSB8fCBvYmplY3QgPT09IG51bGwpIHtcbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG5cbiAgZXhjZXB0aW9ucyA9IGV4Y2VwdGlvbnMgfHwgW107XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICByZXR1cm4gT2JqZWN0LmtleXMob2JqZWN0KS5yZWR1Y2UoZnVuY3Rpb24ocCwga2V5KSB7XG4gICAgdmFyIG5ld0tleSA9IGV4Y2VwdGlvbnMuaW5kZXhPZihrZXkpID09PSAtMSA/IHNuYWtlVG9DYW1lbChrZXkpIDoga2V5O1xuXG4gICAgcFtuZXdLZXldID0gdG9DYW1lbENhc2Uob2JqZWN0W25ld0tleV0gfHwgb2JqZWN0W2tleV0sIFtdLCBvcHRpb25zKTtcblxuICAgIGlmIChvcHRpb25zLmtlZXBPcmlnaW5hbCkge1xuICAgICAgcFtrZXldID0gdG9DYW1lbENhc2Uob2JqZWN0W2tleV0sIFtdLCBvcHRpb25zKTtcbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH0sIHt9KTtcbn1cblxuZnVuY3Rpb24gZ2V0TG9jYXRpb25Gcm9tVXJsKGhyZWYpIHtcbiAgdmFyIG1hdGNoID0gaHJlZi5tYXRjaChcbiAgICAvXihodHRwcz86fGZpbGU6fGNocm9tZS1leHRlbnNpb246KVxcL1xcLygoW146Lz8jXSopKD86OihbMC05XSspKT8pKFsvXXswLDF9W14/I10qKShcXD9bXiNdKnwpKCMuKnwpJC9cbiAgKTtcbiAgcmV0dXJuIChcbiAgICBtYXRjaCAmJiB7XG4gICAgICBocmVmOiBocmVmLFxuICAgICAgcHJvdG9jb2w6IG1hdGNoWzFdLFxuICAgICAgaG9zdDogbWF0Y2hbMl0sXG4gICAgICBob3N0bmFtZTogbWF0Y2hbM10sXG4gICAgICBwb3J0OiBtYXRjaFs0XSxcbiAgICAgIHBhdGhuYW1lOiBtYXRjaFs1XSxcbiAgICAgIHNlYXJjaDogbWF0Y2hbNl0sXG4gICAgICBoYXNoOiBtYXRjaFs3XVxuICAgIH1cbiAgKTtcbn1cblxuZnVuY3Rpb24gZ2V0T3JpZ2luRnJvbVVybCh1cmwpIHtcbiAgaWYgKCF1cmwpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIHZhciBwYXJzZWQgPSBnZXRMb2NhdGlvbkZyb21VcmwodXJsKTtcbiAgaWYgKCFwYXJzZWQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICB2YXIgb3JpZ2luID0gcGFyc2VkLnByb3RvY29sICsgJy8vJyArIHBhcnNlZC5ob3N0bmFtZTtcbiAgaWYgKHBhcnNlZC5wb3J0KSB7XG4gICAgb3JpZ2luICs9ICc6JyArIHBhcnNlZC5wb3J0O1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59XG5cbmZ1bmN0aW9uIHRyaW0ob3B0aW9ucywga2V5KSB7XG4gIHZhciB0cmltbWVkID0gZXh0ZW5kKG9wdGlvbnMpO1xuICBpZiAob3B0aW9uc1trZXldKSB7XG4gICAgdHJpbW1lZFtrZXldID0gb3B0aW9uc1trZXldLnRyaW0oKTtcbiAgfVxuICByZXR1cm4gdHJpbW1lZDtcbn1cblxuZnVuY3Rpb24gdHJpbU11bHRpcGxlKG9wdGlvbnMsIGtleXMpIHtcbiAgcmV0dXJuIGtleXMucmVkdWNlKHRyaW0sIG9wdGlvbnMpO1xufVxuXG5mdW5jdGlvbiB0cmltVXNlckRldGFpbHMob3B0aW9ucykge1xuICByZXR1cm4gdHJpbU11bHRpcGxlKG9wdGlvbnMsIFsndXNlcm5hbWUnLCAnZW1haWwnLCAncGhvbmVOdW1iZXInXSk7XG59XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBvbiB0aGUgZ2l2ZW4gb2JqZWN0LCB1c2luZyBhIGRlZXAgcGF0aCBzZWxlY3Rvci5cbiAqIEBwYXJhbSB7b2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBzZXQgdGhlIHByb3BlcnR5IHZhbHVlIG9uXG4gKiBAcGFyYW0ge3N0cmluZ3xhcnJheX0gcGF0aCBUaGUgcGF0aCB0byB0aGUgcHJvcGVydHkgdGhhdCBzaG91bGQgaGF2ZSBpdHMgdmFsdWUgdXBkYXRlZC4gZS5nLiAncHJvcDEucHJvcDIucHJvcDMnIG9yIFsncHJvcDEnLCAncHJvcDInLCAncHJvcDMnXVxuICogQHBhcmFtIHthbnl9IHZhbHVlIFRoZSB2YWx1ZSB0byBzZXRcbiAqIEBpZ25vcmVcbiAqL1xuZnVuY3Rpb24gdXBkYXRlUHJvcGVydHlPbihvYmosIHBhdGgsIHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgcGF0aCA9PT0gJ3N0cmluZycpIHtcbiAgICBwYXRoID0gcGF0aC5zcGxpdCgnLicpO1xuICB9XG5cbiAgdmFyIG5leHQgPSBwYXRoWzBdO1xuXG4gIGlmIChvYmouaGFzT3duUHJvcGVydHkobmV4dCkpIHtcbiAgICBpZiAocGF0aC5sZW5ndGggPT09IDEpIHtcbiAgICAgIG9ialtuZXh0XSA9IHZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVQcm9wZXJ0eU9uKG9ialtuZXh0XSwgcGF0aC5zbGljZSgxKSwgdmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIHRvU25ha2VDYXNlOiB0b1NuYWtlQ2FzZSxcbiAgdG9DYW1lbENhc2U6IHRvQ2FtZWxDYXNlLFxuICBibGFja2xpc3Q6IGJsYWNrbGlzdCxcbiAgbWVyZ2U6IG1lcmdlLFxuICBwaWNrOiBwaWNrLFxuICBnZXRLZXlzTm90SW46IGdldEtleXNOb3RJbixcbiAgZXh0ZW5kOiBleHRlbmQsXG4gIGdldE9yaWdpbkZyb21Vcmw6IGdldE9yaWdpbkZyb21VcmwsXG4gIGdldExvY2F0aW9uRnJvbVVybDogZ2V0TG9jYXRpb25Gcm9tVXJsLFxuICB0cmltVXNlckRldGFpbHM6IHRyaW1Vc2VyRGV0YWlscyxcbiAgdXBkYXRlUHJvcGVydHlPbjogdXBkYXRlUHJvcGVydHlPblxufTtcbiIsImltcG9ydCBvYmplY3RIZWxwZXIgZnJvbSAnLi9vYmplY3QnO1xuXG5mdW5jdGlvbiByZWRpcmVjdCh1cmwpIHtcbiAgZ2V0V2luZG93KCkubG9jYXRpb24gPSB1cmw7XG59XG5cbmZ1bmN0aW9uIGdldERvY3VtZW50KCkge1xuICByZXR1cm4gZ2V0V2luZG93KCkuZG9jdW1lbnQ7XG59XG5cbmZ1bmN0aW9uIGdldFdpbmRvdygpIHtcbiAgcmV0dXJuIHdpbmRvdztcbn1cblxuZnVuY3Rpb24gZ2V0T3JpZ2luKCkge1xuICB2YXIgbG9jYXRpb24gPSBnZXRXaW5kb3coKS5sb2NhdGlvbjtcbiAgdmFyIG9yaWdpbiA9IGxvY2F0aW9uLm9yaWdpbjtcblxuICBpZiAoIW9yaWdpbikge1xuICAgIG9yaWdpbiA9IG9iamVjdEhlbHBlci5nZXRPcmlnaW5Gcm9tVXJsKGxvY2F0aW9uLmhyZWYpO1xuICB9XG5cbiAgcmV0dXJuIG9yaWdpbjtcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICByZWRpcmVjdDogcmVkaXJlY3QsXG4gIGdldERvY3VtZW50OiBnZXREb2N1bWVudCxcbiAgZ2V0V2luZG93OiBnZXRXaW5kb3csXG4gIGdldE9yaWdpbjogZ2V0T3JpZ2luXG59O1xuIiwiKGZ1bmN0aW9uIChuYW1lLCBjb250ZXh0LCBkZWZpbml0aW9uKSB7XG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbml0aW9uKCk7XG4gIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkgZGVmaW5lKGRlZmluaXRpb24pO1xuICBlbHNlIGNvbnRleHRbbmFtZV0gPSBkZWZpbml0aW9uKCk7XG59KSgndXJsam9pbicsIHRoaXMsIGZ1bmN0aW9uICgpIHtcblxuICBmdW5jdGlvbiBub3JtYWxpemUgKHN0ckFycmF5KSB7XG4gICAgdmFyIHJlc3VsdEFycmF5ID0gW107XG4gICAgaWYgKHN0ckFycmF5Lmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gJyc7IH1cblxuICAgIGlmICh0eXBlb2Ygc3RyQXJyYXlbMF0gIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVcmwgbXVzdCBiZSBhIHN0cmluZy4gUmVjZWl2ZWQgJyArIHN0ckFycmF5WzBdKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgZmlyc3QgcGFydCBpcyBhIHBsYWluIHByb3RvY29sLCB3ZSBjb21iaW5lIGl0IHdpdGggdGhlIG5leHQgcGFydC5cbiAgICBpZiAoc3RyQXJyYXlbMF0ubWF0Y2goL15bXi86XSs6XFwvKiQvKSAmJiBzdHJBcnJheS5sZW5ndGggPiAxKSB7XG4gICAgICB2YXIgZmlyc3QgPSBzdHJBcnJheS5zaGlmdCgpO1xuICAgICAgc3RyQXJyYXlbMF0gPSBmaXJzdCArIHN0ckFycmF5WzBdO1xuICAgIH1cblxuICAgIC8vIFRoZXJlIG11c3QgYmUgdHdvIG9yIHRocmVlIHNsYXNoZXMgaW4gdGhlIGZpbGUgcHJvdG9jb2wsIHR3byBzbGFzaGVzIGluIGFueXRoaW5nIGVsc2UuXG4gICAgaWYgKHN0ckFycmF5WzBdLm1hdGNoKC9eZmlsZTpcXC9cXC9cXC8vKSkge1xuICAgICAgc3RyQXJyYXlbMF0gPSBzdHJBcnJheVswXS5yZXBsYWNlKC9eKFteLzpdKyk6XFwvKi8sICckMTovLy8nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyQXJyYXlbMF0gPSBzdHJBcnJheVswXS5yZXBsYWNlKC9eKFteLzpdKyk6XFwvKi8sICckMTovLycpO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjb21wb25lbnQgPSBzdHJBcnJheVtpXTtcblxuICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1VybCBtdXN0IGJlIGEgc3RyaW5nLiBSZWNlaXZlZCAnICsgY29tcG9uZW50KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbXBvbmVudCA9PT0gJycpIHsgY29udGludWU7IH1cblxuICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgIC8vIFJlbW92aW5nIHRoZSBzdGFydGluZyBzbGFzaGVzIGZvciBlYWNoIGNvbXBvbmVudCBidXQgdGhlIGZpcnN0LlxuICAgICAgICBjb21wb25lbnQgPSBjb21wb25lbnQucmVwbGFjZSgvXltcXC9dKy8sICcnKTtcbiAgICAgIH1cbiAgICAgIGlmIChpIDwgc3RyQXJyYXkubGVuZ3RoIC0gMSkge1xuICAgICAgICAvLyBSZW1vdmluZyB0aGUgZW5kaW5nIHNsYXNoZXMgZm9yIGVhY2ggY29tcG9uZW50IGJ1dCB0aGUgbGFzdC5cbiAgICAgICAgY29tcG9uZW50ID0gY29tcG9uZW50LnJlcGxhY2UoL1tcXC9dKyQvLCAnJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGb3IgdGhlIGxhc3QgY29tcG9uZW50IHdlIHdpbGwgY29tYmluZSBtdWx0aXBsZSBzbGFzaGVzIHRvIGEgc2luZ2xlIG9uZS5cbiAgICAgICAgY29tcG9uZW50ID0gY29tcG9uZW50LnJlcGxhY2UoL1tcXC9dKyQvLCAnLycpO1xuICAgICAgfVxuXG4gICAgICByZXN1bHRBcnJheS5wdXNoKGNvbXBvbmVudCk7XG5cbiAgICB9XG5cbiAgICB2YXIgc3RyID0gcmVzdWx0QXJyYXkuam9pbignLycpO1xuICAgIC8vIEVhY2ggaW5wdXQgY29tcG9uZW50IGlzIG5vdyBzZXBhcmF0ZWQgYnkgYSBzaW5nbGUgc2xhc2ggZXhjZXB0IHRoZSBwb3NzaWJsZSBmaXJzdCBwbGFpbiBwcm90b2NvbCBwYXJ0LlxuXG4gICAgLy8gcmVtb3ZlIHRyYWlsaW5nIHNsYXNoIGJlZm9yZSBwYXJhbWV0ZXJzIG9yIGhhc2hcbiAgICBzdHIgPSBzdHIucmVwbGFjZSgvXFwvKFxcP3wmfCNbXiFdKS9nLCAnJDEnKTtcblxuICAgIC8vIHJlcGxhY2UgPyBpbiBwYXJhbWV0ZXJzIHdpdGggJlxuICAgIHZhciBwYXJ0cyA9IHN0ci5zcGxpdCgnPycpO1xuICAgIHN0ciA9IHBhcnRzLnNoaWZ0KCkgKyAocGFydHMubGVuZ3RoID4gMCA/ICc/JzogJycpICsgcGFydHMuam9pbignJicpO1xuXG4gICAgcmV0dXJuIHN0cjtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGlucHV0O1xuXG4gICAgaWYgKHR5cGVvZiBhcmd1bWVudHNbMF0gPT09ICdvYmplY3QnKSB7XG4gICAgICBpbnB1dCA9IGFyZ3VtZW50c1swXTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5wdXQgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vcm1hbGl6ZShpbnB1dCk7XG4gIH07XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBlc2xpbnQgY29tcGxleGl0eTogWzIsIDE4XSwgbWF4LXN0YXRlbWVudHM6IFsyLCAzM10gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaGFzU3ltYm9scygpIHtcblx0aWYgKHR5cGVvZiBTeW1ib2wgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgIT09ICdmdW5jdGlvbicpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdGlmICh0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSAnc3ltYm9sJykgeyByZXR1cm4gdHJ1ZTsgfVxuXG5cdHZhciBvYmogPSB7fTtcblx0dmFyIHN5bSA9IFN5bWJvbCgndGVzdCcpO1xuXHR2YXIgc3ltT2JqID0gT2JqZWN0KHN5bSk7XG5cdGlmICh0eXBlb2Ygc3ltID09PSAnc3RyaW5nJykgeyByZXR1cm4gZmFsc2U7IH1cblxuXHRpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHN5bSkgIT09ICdbb2JqZWN0IFN5bWJvbF0nKSB7IHJldHVybiBmYWxzZTsgfVxuXHRpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHN5bU9iaikgIT09ICdbb2JqZWN0IFN5bWJvbF0nKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdC8vIHRlbXAgZGlzYWJsZWQgcGVyIGh0dHBzOi8vZ2l0aHViLmNvbS9samhhcmIvb2JqZWN0LmFzc2lnbi9pc3N1ZXMvMTdcblx0Ly8gaWYgKHN5bSBpbnN0YW5jZW9mIFN5bWJvbCkgeyByZXR1cm4gZmFsc2U7IH1cblx0Ly8gdGVtcCBkaXNhYmxlZCBwZXIgaHR0cHM6Ly9naXRodWIuY29tL1dlYlJlZmxlY3Rpb24vZ2V0LW93bi1wcm9wZXJ0eS1zeW1ib2xzL2lzc3Vlcy80XG5cdC8vIGlmICghKHN5bU9iaiBpbnN0YW5jZW9mIFN5bWJvbCkpIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0Ly8gaWYgKHR5cGVvZiBTeW1ib2wucHJvdG90eXBlLnRvU3RyaW5nICE9PSAnZnVuY3Rpb24nKSB7IHJldHVybiBmYWxzZTsgfVxuXHQvLyBpZiAoU3RyaW5nKHN5bSkgIT09IFN5bWJvbC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChzeW0pKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdHZhciBzeW1WYWwgPSA0Mjtcblx0b2JqW3N5bV0gPSBzeW1WYWw7XG5cdGZvciAoc3ltIGluIG9iaikgeyByZXR1cm4gZmFsc2U7IH0gLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1yZXN0cmljdGVkLXN5bnRheCwgbm8tdW5yZWFjaGFibGUtbG9vcFxuXHRpZiAodHlwZW9mIE9iamVjdC5rZXlzID09PSAnZnVuY3Rpb24nICYmIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoICE9PSAwKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdGlmICh0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgPT09ICdmdW5jdGlvbicgJiYgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMob2JqKS5sZW5ndGggIT09IDApIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0dmFyIHN5bXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG9iaik7XG5cdGlmIChzeW1zLmxlbmd0aCAhPT0gMSB8fCBzeW1zWzBdICE9PSBzeW0pIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0aWYgKCFPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwob2JqLCBzeW0pKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdGlmICh0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHZhciBkZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmosIHN5bSk7XG5cdFx0aWYgKGRlc2NyaXB0b3IudmFsdWUgIT09IHN5bVZhbCB8fCBkZXNjcmlwdG9yLmVudW1lcmFibGUgIT09IHRydWUpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdH1cblxuXHRyZXR1cm4gdHJ1ZTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBvcmlnU3ltYm9sID0gdHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sO1xudmFyIGhhc1N5bWJvbFNoYW0gPSByZXF1aXJlKCcuL3NoYW1zJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaGFzTmF0aXZlU3ltYm9scygpIHtcblx0aWYgKHR5cGVvZiBvcmlnU3ltYm9sICE9PSAnZnVuY3Rpb24nKSB7IHJldHVybiBmYWxzZTsgfVxuXHRpZiAodHlwZW9mIFN5bWJvbCAhPT0gJ2Z1bmN0aW9uJykgeyByZXR1cm4gZmFsc2U7IH1cblx0aWYgKHR5cGVvZiBvcmlnU3ltYm9sKCdmb28nKSAhPT0gJ3N5bWJvbCcpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdGlmICh0eXBlb2YgU3ltYm9sKCdiYXInKSAhPT0gJ3N5bWJvbCcpIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0cmV0dXJuIGhhc1N5bWJvbFNoYW0oKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qIGVzbGludCBuby1pbnZhbGlkLXRoaXM6IDEgKi9cblxudmFyIEVSUk9SX01FU1NBR0UgPSAnRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgY2FsbGVkIG9uIGluY29tcGF0aWJsZSAnO1xudmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIHRvU3RyID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbnZhciBmdW5jVHlwZSA9ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmluZCh0aGF0KSB7XG4gICAgdmFyIHRhcmdldCA9IHRoaXM7XG4gICAgaWYgKHR5cGVvZiB0YXJnZXQgIT09ICdmdW5jdGlvbicgfHwgdG9TdHIuY2FsbCh0YXJnZXQpICE9PSBmdW5jVHlwZSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEVSUk9SX01FU1NBR0UgKyB0YXJnZXQpO1xuICAgIH1cbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICAgIHZhciBib3VuZDtcbiAgICB2YXIgYmluZGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcyBpbnN0YW5jZW9mIGJvdW5kKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gdGFyZ2V0LmFwcGx5KFxuICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGlmIChPYmplY3QocmVzdWx0KSA9PT0gcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRhcmdldC5hcHBseShcbiAgICAgICAgICAgICAgICB0aGF0LFxuICAgICAgICAgICAgICAgIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGJvdW5kTGVuZ3RoID0gTWF0aC5tYXgoMCwgdGFyZ2V0Lmxlbmd0aCAtIGFyZ3MubGVuZ3RoKTtcbiAgICB2YXIgYm91bmRBcmdzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBib3VuZExlbmd0aDsgaSsrKSB7XG4gICAgICAgIGJvdW5kQXJncy5wdXNoKCckJyArIGkpO1xuICAgIH1cblxuICAgIGJvdW5kID0gRnVuY3Rpb24oJ2JpbmRlcicsICdyZXR1cm4gZnVuY3Rpb24gKCcgKyBib3VuZEFyZ3Muam9pbignLCcpICsgJyl7IHJldHVybiBiaW5kZXIuYXBwbHkodGhpcyxhcmd1bWVudHMpOyB9JykoYmluZGVyKTtcblxuICAgIGlmICh0YXJnZXQucHJvdG90eXBlKSB7XG4gICAgICAgIHZhciBFbXB0eSA9IGZ1bmN0aW9uIEVtcHR5KCkge307XG4gICAgICAgIEVtcHR5LnByb3RvdHlwZSA9IHRhcmdldC5wcm90b3R5cGU7XG4gICAgICAgIGJvdW5kLnByb3RvdHlwZSA9IG5ldyBFbXB0eSgpO1xuICAgICAgICBFbXB0eS5wcm90b3R5cGUgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBib3VuZDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpbXBsZW1lbnRhdGlvbiA9IHJlcXVpcmUoJy4vaW1wbGVtZW50YXRpb24nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCB8fCBpbXBsZW1lbnRhdGlvbjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGJpbmQgPSByZXF1aXJlKCdmdW5jdGlvbi1iaW5kJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gYmluZC5jYWxsKEZ1bmN0aW9uLmNhbGwsIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdW5kZWZpbmVkO1xuXG52YXIgJFN5bnRheEVycm9yID0gU3ludGF4RXJyb3I7XG52YXIgJEZ1bmN0aW9uID0gRnVuY3Rpb247XG52YXIgJFR5cGVFcnJvciA9IFR5cGVFcnJvcjtcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbnNpc3RlbnQtcmV0dXJuXG52YXIgZ2V0RXZhbGxlZENvbnN0cnVjdG9yID0gZnVuY3Rpb24gKGV4cHJlc3Npb25TeW50YXgpIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gJEZ1bmN0aW9uKCdcInVzZSBzdHJpY3RcIjsgcmV0dXJuICgnICsgZXhwcmVzc2lvblN5bnRheCArICcpLmNvbnN0cnVjdG9yOycpKCk7XG5cdH0gY2F0Y2ggKGUpIHt9XG59O1xuXG52YXIgJGdPUEQgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yO1xuaWYgKCRnT1BEKSB7XG5cdHRyeSB7XG5cdFx0JGdPUEQoe30sICcnKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdCRnT1BEID0gbnVsbDsgLy8gdGhpcyBpcyBJRSA4LCB3aGljaCBoYXMgYSBicm9rZW4gZ09QRFxuXHR9XG59XG5cbnZhciB0aHJvd1R5cGVFcnJvciA9IGZ1bmN0aW9uICgpIHtcblx0dGhyb3cgbmV3ICRUeXBlRXJyb3IoKTtcbn07XG52YXIgVGhyb3dUeXBlRXJyb3IgPSAkZ09QRFxuXHQ/IChmdW5jdGlvbiAoKSB7XG5cdFx0dHJ5IHtcblx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtZXhwcmVzc2lvbnMsIG5vLWNhbGxlciwgbm8tcmVzdHJpY3RlZC1wcm9wZXJ0aWVzXG5cdFx0XHRhcmd1bWVudHMuY2FsbGVlOyAvLyBJRSA4IGRvZXMgbm90IHRocm93IGhlcmVcblx0XHRcdHJldHVybiB0aHJvd1R5cGVFcnJvcjtcblx0XHR9IGNhdGNoIChjYWxsZWVUaHJvd3MpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdC8vIElFIDggdGhyb3dzIG9uIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoYXJndW1lbnRzLCAnJylcblx0XHRcdFx0cmV0dXJuICRnT1BEKGFyZ3VtZW50cywgJ2NhbGxlZScpLmdldDtcblx0XHRcdH0gY2F0Y2ggKGdPUER0aHJvd3MpIHtcblx0XHRcdFx0cmV0dXJuIHRocm93VHlwZUVycm9yO1xuXHRcdFx0fVxuXHRcdH1cblx0fSgpKVxuXHQ6IHRocm93VHlwZUVycm9yO1xuXG52YXIgaGFzU3ltYm9scyA9IHJlcXVpcmUoJ2hhcy1zeW1ib2xzJykoKTtcblxudmFyIGdldFByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uICh4KSB7IHJldHVybiB4Ll9fcHJvdG9fXzsgfTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wcm90b1xuXG52YXIgbmVlZHNFdmFsID0ge307XG5cbnZhciBUeXBlZEFycmF5ID0gdHlwZW9mIFVpbnQ4QXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogZ2V0UHJvdG8oVWludDhBcnJheSk7XG5cbnZhciBJTlRSSU5TSUNTID0ge1xuXHQnJUFnZ3JlZ2F0ZUVycm9yJSc6IHR5cGVvZiBBZ2dyZWdhdGVFcnJvciA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBBZ2dyZWdhdGVFcnJvcixcblx0JyVBcnJheSUnOiBBcnJheSxcblx0JyVBcnJheUJ1ZmZlciUnOiB0eXBlb2YgQXJyYXlCdWZmZXIgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogQXJyYXlCdWZmZXIsXG5cdCclQXJyYXlJdGVyYXRvclByb3RvdHlwZSUnOiBoYXNTeW1ib2xzID8gZ2V0UHJvdG8oW11bU3ltYm9sLml0ZXJhdG9yXSgpKSA6IHVuZGVmaW5lZCxcblx0JyVBc3luY0Zyb21TeW5jSXRlcmF0b3JQcm90b3R5cGUlJzogdW5kZWZpbmVkLFxuXHQnJUFzeW5jRnVuY3Rpb24lJzogbmVlZHNFdmFsLFxuXHQnJUFzeW5jR2VuZXJhdG9yJSc6IG5lZWRzRXZhbCxcblx0JyVBc3luY0dlbmVyYXRvckZ1bmN0aW9uJSc6IG5lZWRzRXZhbCxcblx0JyVBc3luY0l0ZXJhdG9yUHJvdG90eXBlJSc6IG5lZWRzRXZhbCxcblx0JyVBdG9taWNzJSc6IHR5cGVvZiBBdG9taWNzID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IEF0b21pY3MsXG5cdCclQmlnSW50JSc6IHR5cGVvZiBCaWdJbnQgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogQmlnSW50LFxuXHQnJUJpZ0ludDY0QXJyYXklJzogdHlwZW9mIEJpZ0ludDY0QXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogQmlnSW50NjRBcnJheSxcblx0JyVCaWdVaW50NjRBcnJheSUnOiB0eXBlb2YgQmlnVWludDY0QXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogQmlnVWludDY0QXJyYXksXG5cdCclQm9vbGVhbiUnOiBCb29sZWFuLFxuXHQnJURhdGFWaWV3JSc6IHR5cGVvZiBEYXRhVmlldyA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBEYXRhVmlldyxcblx0JyVEYXRlJSc6IERhdGUsXG5cdCclZGVjb2RlVVJJJSc6IGRlY29kZVVSSSxcblx0JyVkZWNvZGVVUklDb21wb25lbnQlJzogZGVjb2RlVVJJQ29tcG9uZW50LFxuXHQnJWVuY29kZVVSSSUnOiBlbmNvZGVVUkksXG5cdCclZW5jb2RlVVJJQ29tcG9uZW50JSc6IGVuY29kZVVSSUNvbXBvbmVudCxcblx0JyVFcnJvciUnOiBFcnJvcixcblx0JyVldmFsJSc6IGV2YWwsIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZXZhbFxuXHQnJUV2YWxFcnJvciUnOiBFdmFsRXJyb3IsXG5cdCclRmxvYXQzMkFycmF5JSc6IHR5cGVvZiBGbG9hdDMyQXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogRmxvYXQzMkFycmF5LFxuXHQnJUZsb2F0NjRBcnJheSUnOiB0eXBlb2YgRmxvYXQ2NEFycmF5ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IEZsb2F0NjRBcnJheSxcblx0JyVGaW5hbGl6YXRpb25SZWdpc3RyeSUnOiB0eXBlb2YgRmluYWxpemF0aW9uUmVnaXN0cnkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogRmluYWxpemF0aW9uUmVnaXN0cnksXG5cdCclRnVuY3Rpb24lJzogJEZ1bmN0aW9uLFxuXHQnJUdlbmVyYXRvckZ1bmN0aW9uJSc6IG5lZWRzRXZhbCxcblx0JyVJbnQ4QXJyYXklJzogdHlwZW9mIEludDhBcnJheSA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBJbnQ4QXJyYXksXG5cdCclSW50MTZBcnJheSUnOiB0eXBlb2YgSW50MTZBcnJheSA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBJbnQxNkFycmF5LFxuXHQnJUludDMyQXJyYXklJzogdHlwZW9mIEludDMyQXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogSW50MzJBcnJheSxcblx0JyVpc0Zpbml0ZSUnOiBpc0Zpbml0ZSxcblx0JyVpc05hTiUnOiBpc05hTixcblx0JyVJdGVyYXRvclByb3RvdHlwZSUnOiBoYXNTeW1ib2xzID8gZ2V0UHJvdG8oZ2V0UHJvdG8oW11bU3ltYm9sLml0ZXJhdG9yXSgpKSkgOiB1bmRlZmluZWQsXG5cdCclSlNPTiUnOiB0eXBlb2YgSlNPTiA9PT0gJ29iamVjdCcgPyBKU09OIDogdW5kZWZpbmVkLFxuXHQnJU1hcCUnOiB0eXBlb2YgTWFwID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IE1hcCxcblx0JyVNYXBJdGVyYXRvclByb3RvdHlwZSUnOiB0eXBlb2YgTWFwID09PSAndW5kZWZpbmVkJyB8fCAhaGFzU3ltYm9scyA/IHVuZGVmaW5lZCA6IGdldFByb3RvKG5ldyBNYXAoKVtTeW1ib2wuaXRlcmF0b3JdKCkpLFxuXHQnJU1hdGglJzogTWF0aCxcblx0JyVOdW1iZXIlJzogTnVtYmVyLFxuXHQnJU9iamVjdCUnOiBPYmplY3QsXG5cdCclcGFyc2VGbG9hdCUnOiBwYXJzZUZsb2F0LFxuXHQnJXBhcnNlSW50JSc6IHBhcnNlSW50LFxuXHQnJVByb21pc2UlJzogdHlwZW9mIFByb21pc2UgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogUHJvbWlzZSxcblx0JyVQcm94eSUnOiB0eXBlb2YgUHJveHkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogUHJveHksXG5cdCclUmFuZ2VFcnJvciUnOiBSYW5nZUVycm9yLFxuXHQnJVJlZmVyZW5jZUVycm9yJSc6IFJlZmVyZW5jZUVycm9yLFxuXHQnJVJlZmxlY3QlJzogdHlwZW9mIFJlZmxlY3QgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogUmVmbGVjdCxcblx0JyVSZWdFeHAlJzogUmVnRXhwLFxuXHQnJVNldCUnOiB0eXBlb2YgU2V0ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IFNldCxcblx0JyVTZXRJdGVyYXRvclByb3RvdHlwZSUnOiB0eXBlb2YgU2V0ID09PSAndW5kZWZpbmVkJyB8fCAhaGFzU3ltYm9scyA/IHVuZGVmaW5lZCA6IGdldFByb3RvKG5ldyBTZXQoKVtTeW1ib2wuaXRlcmF0b3JdKCkpLFxuXHQnJVNoYXJlZEFycmF5QnVmZmVyJSc6IHR5cGVvZiBTaGFyZWRBcnJheUJ1ZmZlciA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBTaGFyZWRBcnJheUJ1ZmZlcixcblx0JyVTdHJpbmclJzogU3RyaW5nLFxuXHQnJVN0cmluZ0l0ZXJhdG9yUHJvdG90eXBlJSc6IGhhc1N5bWJvbHMgPyBnZXRQcm90bygnJ1tTeW1ib2wuaXRlcmF0b3JdKCkpIDogdW5kZWZpbmVkLFxuXHQnJVN5bWJvbCUnOiBoYXNTeW1ib2xzID8gU3ltYm9sIDogdW5kZWZpbmVkLFxuXHQnJVN5bnRheEVycm9yJSc6ICRTeW50YXhFcnJvcixcblx0JyVUaHJvd1R5cGVFcnJvciUnOiBUaHJvd1R5cGVFcnJvcixcblx0JyVUeXBlZEFycmF5JSc6IFR5cGVkQXJyYXksXG5cdCclVHlwZUVycm9yJSc6ICRUeXBlRXJyb3IsXG5cdCclVWludDhBcnJheSUnOiB0eXBlb2YgVWludDhBcnJheSA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBVaW50OEFycmF5LFxuXHQnJVVpbnQ4Q2xhbXBlZEFycmF5JSc6IHR5cGVvZiBVaW50OENsYW1wZWRBcnJheSA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBVaW50OENsYW1wZWRBcnJheSxcblx0JyVVaW50MTZBcnJheSUnOiB0eXBlb2YgVWludDE2QXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogVWludDE2QXJyYXksXG5cdCclVWludDMyQXJyYXklJzogdHlwZW9mIFVpbnQzMkFycmF5ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IFVpbnQzMkFycmF5LFxuXHQnJVVSSUVycm9yJSc6IFVSSUVycm9yLFxuXHQnJVdlYWtNYXAlJzogdHlwZW9mIFdlYWtNYXAgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogV2Vha01hcCxcblx0JyVXZWFrUmVmJSc6IHR5cGVvZiBXZWFrUmVmID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IFdlYWtSZWYsXG5cdCclV2Vha1NldCUnOiB0eXBlb2YgV2Vha1NldCA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBXZWFrU2V0XG59O1xuXG50cnkge1xuXHRudWxsLmVycm9yOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC1leHByZXNzaW9uc1xufSBjYXRjaCAoZSkge1xuXHQvLyBodHRwczovL2dpdGh1Yi5jb20vdGMzOS9wcm9wb3NhbC1zaGFkb3dyZWFsbS9wdWxsLzM4NCNpc3N1ZWNvbW1lbnQtMTM2NDI2NDIyOVxuXHR2YXIgZXJyb3JQcm90byA9IGdldFByb3RvKGdldFByb3RvKGUpKTtcblx0SU5UUklOU0lDU1snJUVycm9yLnByb3RvdHlwZSUnXSA9IGVycm9yUHJvdG87XG59XG5cbnZhciBkb0V2YWwgPSBmdW5jdGlvbiBkb0V2YWwobmFtZSkge1xuXHR2YXIgdmFsdWU7XG5cdGlmIChuYW1lID09PSAnJUFzeW5jRnVuY3Rpb24lJykge1xuXHRcdHZhbHVlID0gZ2V0RXZhbGxlZENvbnN0cnVjdG9yKCdhc3luYyBmdW5jdGlvbiAoKSB7fScpO1xuXHR9IGVsc2UgaWYgKG5hbWUgPT09ICclR2VuZXJhdG9yRnVuY3Rpb24lJykge1xuXHRcdHZhbHVlID0gZ2V0RXZhbGxlZENvbnN0cnVjdG9yKCdmdW5jdGlvbiogKCkge30nKTtcblx0fSBlbHNlIGlmIChuYW1lID09PSAnJUFzeW5jR2VuZXJhdG9yRnVuY3Rpb24lJykge1xuXHRcdHZhbHVlID0gZ2V0RXZhbGxlZENvbnN0cnVjdG9yKCdhc3luYyBmdW5jdGlvbiogKCkge30nKTtcblx0fSBlbHNlIGlmIChuYW1lID09PSAnJUFzeW5jR2VuZXJhdG9yJScpIHtcblx0XHR2YXIgZm4gPSBkb0V2YWwoJyVBc3luY0dlbmVyYXRvckZ1bmN0aW9uJScpO1xuXHRcdGlmIChmbikge1xuXHRcdFx0dmFsdWUgPSBmbi5wcm90b3R5cGU7XG5cdFx0fVxuXHR9IGVsc2UgaWYgKG5hbWUgPT09ICclQXN5bmNJdGVyYXRvclByb3RvdHlwZSUnKSB7XG5cdFx0dmFyIGdlbiA9IGRvRXZhbCgnJUFzeW5jR2VuZXJhdG9yJScpO1xuXHRcdGlmIChnZW4pIHtcblx0XHRcdHZhbHVlID0gZ2V0UHJvdG8oZ2VuLnByb3RvdHlwZSk7XG5cdFx0fVxuXHR9XG5cblx0SU5UUklOU0lDU1tuYW1lXSA9IHZhbHVlO1xuXG5cdHJldHVybiB2YWx1ZTtcbn07XG5cbnZhciBMRUdBQ1lfQUxJQVNFUyA9IHtcblx0JyVBcnJheUJ1ZmZlclByb3RvdHlwZSUnOiBbJ0FycmF5QnVmZmVyJywgJ3Byb3RvdHlwZSddLFxuXHQnJUFycmF5UHJvdG90eXBlJSc6IFsnQXJyYXknLCAncHJvdG90eXBlJ10sXG5cdCclQXJyYXlQcm90b19lbnRyaWVzJSc6IFsnQXJyYXknLCAncHJvdG90eXBlJywgJ2VudHJpZXMnXSxcblx0JyVBcnJheVByb3RvX2ZvckVhY2glJzogWydBcnJheScsICdwcm90b3R5cGUnLCAnZm9yRWFjaCddLFxuXHQnJUFycmF5UHJvdG9fa2V5cyUnOiBbJ0FycmF5JywgJ3Byb3RvdHlwZScsICdrZXlzJ10sXG5cdCclQXJyYXlQcm90b192YWx1ZXMlJzogWydBcnJheScsICdwcm90b3R5cGUnLCAndmFsdWVzJ10sXG5cdCclQXN5bmNGdW5jdGlvblByb3RvdHlwZSUnOiBbJ0FzeW5jRnVuY3Rpb24nLCAncHJvdG90eXBlJ10sXG5cdCclQXN5bmNHZW5lcmF0b3IlJzogWydBc3luY0dlbmVyYXRvckZ1bmN0aW9uJywgJ3Byb3RvdHlwZSddLFxuXHQnJUFzeW5jR2VuZXJhdG9yUHJvdG90eXBlJSc6IFsnQXN5bmNHZW5lcmF0b3JGdW5jdGlvbicsICdwcm90b3R5cGUnLCAncHJvdG90eXBlJ10sXG5cdCclQm9vbGVhblByb3RvdHlwZSUnOiBbJ0Jvb2xlYW4nLCAncHJvdG90eXBlJ10sXG5cdCclRGF0YVZpZXdQcm90b3R5cGUlJzogWydEYXRhVmlldycsICdwcm90b3R5cGUnXSxcblx0JyVEYXRlUHJvdG90eXBlJSc6IFsnRGF0ZScsICdwcm90b3R5cGUnXSxcblx0JyVFcnJvclByb3RvdHlwZSUnOiBbJ0Vycm9yJywgJ3Byb3RvdHlwZSddLFxuXHQnJUV2YWxFcnJvclByb3RvdHlwZSUnOiBbJ0V2YWxFcnJvcicsICdwcm90b3R5cGUnXSxcblx0JyVGbG9hdDMyQXJyYXlQcm90b3R5cGUlJzogWydGbG9hdDMyQXJyYXknLCAncHJvdG90eXBlJ10sXG5cdCclRmxvYXQ2NEFycmF5UHJvdG90eXBlJSc6IFsnRmxvYXQ2NEFycmF5JywgJ3Byb3RvdHlwZSddLFxuXHQnJUZ1bmN0aW9uUHJvdG90eXBlJSc6IFsnRnVuY3Rpb24nLCAncHJvdG90eXBlJ10sXG5cdCclR2VuZXJhdG9yJSc6IFsnR2VuZXJhdG9yRnVuY3Rpb24nLCAncHJvdG90eXBlJ10sXG5cdCclR2VuZXJhdG9yUHJvdG90eXBlJSc6IFsnR2VuZXJhdG9yRnVuY3Rpb24nLCAncHJvdG90eXBlJywgJ3Byb3RvdHlwZSddLFxuXHQnJUludDhBcnJheVByb3RvdHlwZSUnOiBbJ0ludDhBcnJheScsICdwcm90b3R5cGUnXSxcblx0JyVJbnQxNkFycmF5UHJvdG90eXBlJSc6IFsnSW50MTZBcnJheScsICdwcm90b3R5cGUnXSxcblx0JyVJbnQzMkFycmF5UHJvdG90eXBlJSc6IFsnSW50MzJBcnJheScsICdwcm90b3R5cGUnXSxcblx0JyVKU09OUGFyc2UlJzogWydKU09OJywgJ3BhcnNlJ10sXG5cdCclSlNPTlN0cmluZ2lmeSUnOiBbJ0pTT04nLCAnc3RyaW5naWZ5J10sXG5cdCclTWFwUHJvdG90eXBlJSc6IFsnTWFwJywgJ3Byb3RvdHlwZSddLFxuXHQnJU51bWJlclByb3RvdHlwZSUnOiBbJ051bWJlcicsICdwcm90b3R5cGUnXSxcblx0JyVPYmplY3RQcm90b3R5cGUlJzogWydPYmplY3QnLCAncHJvdG90eXBlJ10sXG5cdCclT2JqUHJvdG9fdG9TdHJpbmclJzogWydPYmplY3QnLCAncHJvdG90eXBlJywgJ3RvU3RyaW5nJ10sXG5cdCclT2JqUHJvdG9fdmFsdWVPZiUnOiBbJ09iamVjdCcsICdwcm90b3R5cGUnLCAndmFsdWVPZiddLFxuXHQnJVByb21pc2VQcm90b3R5cGUlJzogWydQcm9taXNlJywgJ3Byb3RvdHlwZSddLFxuXHQnJVByb21pc2VQcm90b190aGVuJSc6IFsnUHJvbWlzZScsICdwcm90b3R5cGUnLCAndGhlbiddLFxuXHQnJVByb21pc2VfYWxsJSc6IFsnUHJvbWlzZScsICdhbGwnXSxcblx0JyVQcm9taXNlX3JlamVjdCUnOiBbJ1Byb21pc2UnLCAncmVqZWN0J10sXG5cdCclUHJvbWlzZV9yZXNvbHZlJSc6IFsnUHJvbWlzZScsICdyZXNvbHZlJ10sXG5cdCclUmFuZ2VFcnJvclByb3RvdHlwZSUnOiBbJ1JhbmdlRXJyb3InLCAncHJvdG90eXBlJ10sXG5cdCclUmVmZXJlbmNlRXJyb3JQcm90b3R5cGUlJzogWydSZWZlcmVuY2VFcnJvcicsICdwcm90b3R5cGUnXSxcblx0JyVSZWdFeHBQcm90b3R5cGUlJzogWydSZWdFeHAnLCAncHJvdG90eXBlJ10sXG5cdCclU2V0UHJvdG90eXBlJSc6IFsnU2V0JywgJ3Byb3RvdHlwZSddLFxuXHQnJVNoYXJlZEFycmF5QnVmZmVyUHJvdG90eXBlJSc6IFsnU2hhcmVkQXJyYXlCdWZmZXInLCAncHJvdG90eXBlJ10sXG5cdCclU3RyaW5nUHJvdG90eXBlJSc6IFsnU3RyaW5nJywgJ3Byb3RvdHlwZSddLFxuXHQnJVN5bWJvbFByb3RvdHlwZSUnOiBbJ1N5bWJvbCcsICdwcm90b3R5cGUnXSxcblx0JyVTeW50YXhFcnJvclByb3RvdHlwZSUnOiBbJ1N5bnRheEVycm9yJywgJ3Byb3RvdHlwZSddLFxuXHQnJVR5cGVkQXJyYXlQcm90b3R5cGUlJzogWydUeXBlZEFycmF5JywgJ3Byb3RvdHlwZSddLFxuXHQnJVR5cGVFcnJvclByb3RvdHlwZSUnOiBbJ1R5cGVFcnJvcicsICdwcm90b3R5cGUnXSxcblx0JyVVaW50OEFycmF5UHJvdG90eXBlJSc6IFsnVWludDhBcnJheScsICdwcm90b3R5cGUnXSxcblx0JyVVaW50OENsYW1wZWRBcnJheVByb3RvdHlwZSUnOiBbJ1VpbnQ4Q2xhbXBlZEFycmF5JywgJ3Byb3RvdHlwZSddLFxuXHQnJVVpbnQxNkFycmF5UHJvdG90eXBlJSc6IFsnVWludDE2QXJyYXknLCAncHJvdG90eXBlJ10sXG5cdCclVWludDMyQXJyYXlQcm90b3R5cGUlJzogWydVaW50MzJBcnJheScsICdwcm90b3R5cGUnXSxcblx0JyVVUklFcnJvclByb3RvdHlwZSUnOiBbJ1VSSUVycm9yJywgJ3Byb3RvdHlwZSddLFxuXHQnJVdlYWtNYXBQcm90b3R5cGUlJzogWydXZWFrTWFwJywgJ3Byb3RvdHlwZSddLFxuXHQnJVdlYWtTZXRQcm90b3R5cGUlJzogWydXZWFrU2V0JywgJ3Byb3RvdHlwZSddXG59O1xuXG52YXIgYmluZCA9IHJlcXVpcmUoJ2Z1bmN0aW9uLWJpbmQnKTtcbnZhciBoYXNPd24gPSByZXF1aXJlKCdoYXMnKTtcbnZhciAkY29uY2F0ID0gYmluZC5jYWxsKEZ1bmN0aW9uLmNhbGwsIEFycmF5LnByb3RvdHlwZS5jb25jYXQpO1xudmFyICRzcGxpY2VBcHBseSA9IGJpbmQuY2FsbChGdW5jdGlvbi5hcHBseSwgQXJyYXkucHJvdG90eXBlLnNwbGljZSk7XG52YXIgJHJlcGxhY2UgPSBiaW5kLmNhbGwoRnVuY3Rpb24uY2FsbCwgU3RyaW5nLnByb3RvdHlwZS5yZXBsYWNlKTtcbnZhciAkc3RyU2xpY2UgPSBiaW5kLmNhbGwoRnVuY3Rpb24uY2FsbCwgU3RyaW5nLnByb3RvdHlwZS5zbGljZSk7XG52YXIgJGV4ZWMgPSBiaW5kLmNhbGwoRnVuY3Rpb24uY2FsbCwgUmVnRXhwLnByb3RvdHlwZS5leGVjKTtcblxuLyogYWRhcHRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9sb2Rhc2gvbG9kYXNoL2Jsb2IvNC4xNy4xNS9kaXN0L2xvZGFzaC5qcyNMNjczNS1MNjc0NCAqL1xudmFyIHJlUHJvcE5hbWUgPSAvW14lLltcXF1dK3xcXFsoPzooLT9cXGQrKD86XFwuXFxkKyk/KXwoW1wiJ10pKCg/Oig/IVxcMilbXlxcXFxdfFxcXFwuKSo/KVxcMilcXF18KD89KD86XFwufFxcW1xcXSkoPzpcXC58XFxbXFxdfCUkKSkvZztcbnZhciByZUVzY2FwZUNoYXIgPSAvXFxcXChcXFxcKT8vZzsgLyoqIFVzZWQgdG8gbWF0Y2ggYmFja3NsYXNoZXMgaW4gcHJvcGVydHkgcGF0aHMuICovXG52YXIgc3RyaW5nVG9QYXRoID0gZnVuY3Rpb24gc3RyaW5nVG9QYXRoKHN0cmluZykge1xuXHR2YXIgZmlyc3QgPSAkc3RyU2xpY2Uoc3RyaW5nLCAwLCAxKTtcblx0dmFyIGxhc3QgPSAkc3RyU2xpY2Uoc3RyaW5nLCAtMSk7XG5cdGlmIChmaXJzdCA9PT0gJyUnICYmIGxhc3QgIT09ICclJykge1xuXHRcdHRocm93IG5ldyAkU3ludGF4RXJyb3IoJ2ludmFsaWQgaW50cmluc2ljIHN5bnRheCwgZXhwZWN0ZWQgY2xvc2luZyBgJWAnKTtcblx0fSBlbHNlIGlmIChsYXN0ID09PSAnJScgJiYgZmlyc3QgIT09ICclJykge1xuXHRcdHRocm93IG5ldyAkU3ludGF4RXJyb3IoJ2ludmFsaWQgaW50cmluc2ljIHN5bnRheCwgZXhwZWN0ZWQgb3BlbmluZyBgJWAnKTtcblx0fVxuXHR2YXIgcmVzdWx0ID0gW107XG5cdCRyZXBsYWNlKHN0cmluZywgcmVQcm9wTmFtZSwgZnVuY3Rpb24gKG1hdGNoLCBudW1iZXIsIHF1b3RlLCBzdWJTdHJpbmcpIHtcblx0XHRyZXN1bHRbcmVzdWx0Lmxlbmd0aF0gPSBxdW90ZSA/ICRyZXBsYWNlKHN1YlN0cmluZywgcmVFc2NhcGVDaGFyLCAnJDEnKSA6IG51bWJlciB8fCBtYXRjaDtcblx0fSk7XG5cdHJldHVybiByZXN1bHQ7XG59O1xuLyogZW5kIGFkYXB0YXRpb24gKi9cblxudmFyIGdldEJhc2VJbnRyaW5zaWMgPSBmdW5jdGlvbiBnZXRCYXNlSW50cmluc2ljKG5hbWUsIGFsbG93TWlzc2luZykge1xuXHR2YXIgaW50cmluc2ljTmFtZSA9IG5hbWU7XG5cdHZhciBhbGlhcztcblx0aWYgKGhhc093bihMRUdBQ1lfQUxJQVNFUywgaW50cmluc2ljTmFtZSkpIHtcblx0XHRhbGlhcyA9IExFR0FDWV9BTElBU0VTW2ludHJpbnNpY05hbWVdO1xuXHRcdGludHJpbnNpY05hbWUgPSAnJScgKyBhbGlhc1swXSArICclJztcblx0fVxuXG5cdGlmIChoYXNPd24oSU5UUklOU0lDUywgaW50cmluc2ljTmFtZSkpIHtcblx0XHR2YXIgdmFsdWUgPSBJTlRSSU5TSUNTW2ludHJpbnNpY05hbWVdO1xuXHRcdGlmICh2YWx1ZSA9PT0gbmVlZHNFdmFsKSB7XG5cdFx0XHR2YWx1ZSA9IGRvRXZhbChpbnRyaW5zaWNOYW1lKTtcblx0XHR9XG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcgJiYgIWFsbG93TWlzc2luZykge1xuXHRcdFx0dGhyb3cgbmV3ICRUeXBlRXJyb3IoJ2ludHJpbnNpYyAnICsgbmFtZSArICcgZXhpc3RzLCBidXQgaXMgbm90IGF2YWlsYWJsZS4gUGxlYXNlIGZpbGUgYW4gaXNzdWUhJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGFsaWFzOiBhbGlhcyxcblx0XHRcdG5hbWU6IGludHJpbnNpY05hbWUsXG5cdFx0XHR2YWx1ZTogdmFsdWVcblx0XHR9O1xuXHR9XG5cblx0dGhyb3cgbmV3ICRTeW50YXhFcnJvcignaW50cmluc2ljICcgKyBuYW1lICsgJyBkb2VzIG5vdCBleGlzdCEnKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gR2V0SW50cmluc2ljKG5hbWUsIGFsbG93TWlzc2luZykge1xuXHRpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnIHx8IG5hbWUubGVuZ3RoID09PSAwKSB7XG5cdFx0dGhyb3cgbmV3ICRUeXBlRXJyb3IoJ2ludHJpbnNpYyBuYW1lIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyk7XG5cdH1cblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIHR5cGVvZiBhbGxvd01pc3NpbmcgIT09ICdib29sZWFuJykge1xuXHRcdHRocm93IG5ldyAkVHlwZUVycm9yKCdcImFsbG93TWlzc2luZ1wiIGFyZ3VtZW50IG11c3QgYmUgYSBib29sZWFuJyk7XG5cdH1cblxuXHRpZiAoJGV4ZWMoL14lP1teJV0qJT8kLywgbmFtZSkgPT09IG51bGwpIHtcblx0XHR0aHJvdyBuZXcgJFN5bnRheEVycm9yKCdgJWAgbWF5IG5vdCBiZSBwcmVzZW50IGFueXdoZXJlIGJ1dCBhdCB0aGUgYmVnaW5uaW5nIGFuZCBlbmQgb2YgdGhlIGludHJpbnNpYyBuYW1lJyk7XG5cdH1cblx0dmFyIHBhcnRzID0gc3RyaW5nVG9QYXRoKG5hbWUpO1xuXHR2YXIgaW50cmluc2ljQmFzZU5hbWUgPSBwYXJ0cy5sZW5ndGggPiAwID8gcGFydHNbMF0gOiAnJztcblxuXHR2YXIgaW50cmluc2ljID0gZ2V0QmFzZUludHJpbnNpYygnJScgKyBpbnRyaW5zaWNCYXNlTmFtZSArICclJywgYWxsb3dNaXNzaW5nKTtcblx0dmFyIGludHJpbnNpY1JlYWxOYW1lID0gaW50cmluc2ljLm5hbWU7XG5cdHZhciB2YWx1ZSA9IGludHJpbnNpYy52YWx1ZTtcblx0dmFyIHNraXBGdXJ0aGVyQ2FjaGluZyA9IGZhbHNlO1xuXG5cdHZhciBhbGlhcyA9IGludHJpbnNpYy5hbGlhcztcblx0aWYgKGFsaWFzKSB7XG5cdFx0aW50cmluc2ljQmFzZU5hbWUgPSBhbGlhc1swXTtcblx0XHQkc3BsaWNlQXBwbHkocGFydHMsICRjb25jYXQoWzAsIDFdLCBhbGlhcykpO1xuXHR9XG5cblx0Zm9yICh2YXIgaSA9IDEsIGlzT3duID0gdHJ1ZTsgaSA8IHBhcnRzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0dmFyIHBhcnQgPSBwYXJ0c1tpXTtcblx0XHR2YXIgZmlyc3QgPSAkc3RyU2xpY2UocGFydCwgMCwgMSk7XG5cdFx0dmFyIGxhc3QgPSAkc3RyU2xpY2UocGFydCwgLTEpO1xuXHRcdGlmIChcblx0XHRcdChcblx0XHRcdFx0KGZpcnN0ID09PSAnXCInIHx8IGZpcnN0ID09PSBcIidcIiB8fCBmaXJzdCA9PT0gJ2AnKVxuXHRcdFx0XHR8fCAobGFzdCA9PT0gJ1wiJyB8fCBsYXN0ID09PSBcIidcIiB8fCBsYXN0ID09PSAnYCcpXG5cdFx0XHQpXG5cdFx0XHQmJiBmaXJzdCAhPT0gbGFzdFxuXHRcdCkge1xuXHRcdFx0dGhyb3cgbmV3ICRTeW50YXhFcnJvcigncHJvcGVydHkgbmFtZXMgd2l0aCBxdW90ZXMgbXVzdCBoYXZlIG1hdGNoaW5nIHF1b3RlcycpO1xuXHRcdH1cblx0XHRpZiAocGFydCA9PT0gJ2NvbnN0cnVjdG9yJyB8fCAhaXNPd24pIHtcblx0XHRcdHNraXBGdXJ0aGVyQ2FjaGluZyA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aW50cmluc2ljQmFzZU5hbWUgKz0gJy4nICsgcGFydDtcblx0XHRpbnRyaW5zaWNSZWFsTmFtZSA9ICclJyArIGludHJpbnNpY0Jhc2VOYW1lICsgJyUnO1xuXG5cdFx0aWYgKGhhc093bihJTlRSSU5TSUNTLCBpbnRyaW5zaWNSZWFsTmFtZSkpIHtcblx0XHRcdHZhbHVlID0gSU5UUklOU0lDU1tpbnRyaW5zaWNSZWFsTmFtZV07XG5cdFx0fSBlbHNlIGlmICh2YWx1ZSAhPSBudWxsKSB7XG5cdFx0XHRpZiAoIShwYXJ0IGluIHZhbHVlKSkge1xuXHRcdFx0XHRpZiAoIWFsbG93TWlzc2luZykge1xuXHRcdFx0XHRcdHRocm93IG5ldyAkVHlwZUVycm9yKCdiYXNlIGludHJpbnNpYyBmb3IgJyArIG5hbWUgKyAnIGV4aXN0cywgYnV0IHRoZSBwcm9wZXJ0eSBpcyBub3QgYXZhaWxhYmxlLicpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB2b2lkIHVuZGVmaW5lZDtcblx0XHRcdH1cblx0XHRcdGlmICgkZ09QRCAmJiAoaSArIDEpID49IHBhcnRzLmxlbmd0aCkge1xuXHRcdFx0XHR2YXIgZGVzYyA9ICRnT1BEKHZhbHVlLCBwYXJ0KTtcblx0XHRcdFx0aXNPd24gPSAhIWRlc2M7XG5cblx0XHRcdFx0Ly8gQnkgY29udmVudGlvbiwgd2hlbiBhIGRhdGEgcHJvcGVydHkgaXMgY29udmVydGVkIHRvIGFuIGFjY2Vzc29yXG5cdFx0XHRcdC8vIHByb3BlcnR5IHRvIGVtdWxhdGUgYSBkYXRhIHByb3BlcnR5IHRoYXQgZG9lcyBub3Qgc3VmZmVyIGZyb21cblx0XHRcdFx0Ly8gdGhlIG92ZXJyaWRlIG1pc3Rha2UsIHRoYXQgYWNjZXNzb3IncyBnZXR0ZXIgaXMgbWFya2VkIHdpdGhcblx0XHRcdFx0Ly8gYW4gYG9yaWdpbmFsVmFsdWVgIHByb3BlcnR5LiBIZXJlLCB3aGVuIHdlIGRldGVjdCB0aGlzLCB3ZVxuXHRcdFx0XHQvLyB1cGhvbGQgdGhlIGlsbHVzaW9uIGJ5IHByZXRlbmRpbmcgdG8gc2VlIHRoYXQgb3JpZ2luYWwgZGF0YVxuXHRcdFx0XHQvLyBwcm9wZXJ0eSwgaS5lLiwgcmV0dXJuaW5nIHRoZSB2YWx1ZSByYXRoZXIgdGhhbiB0aGUgZ2V0dGVyXG5cdFx0XHRcdC8vIGl0c2VsZi5cblx0XHRcdFx0aWYgKGlzT3duICYmICdnZXQnIGluIGRlc2MgJiYgISgnb3JpZ2luYWxWYWx1ZScgaW4gZGVzYy5nZXQpKSB7XG5cdFx0XHRcdFx0dmFsdWUgPSBkZXNjLmdldDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR2YWx1ZSA9IHZhbHVlW3BhcnRdO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpc093biA9IGhhc093bih2YWx1ZSwgcGFydCk7XG5cdFx0XHRcdHZhbHVlID0gdmFsdWVbcGFydF07XG5cdFx0XHR9XG5cblx0XHRcdGlmIChpc093biAmJiAhc2tpcEZ1cnRoZXJDYWNoaW5nKSB7XG5cdFx0XHRcdElOVFJJTlNJQ1NbaW50cmluc2ljUmVhbE5hbWVdID0gdmFsdWU7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdHJldHVybiB2YWx1ZTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBiaW5kID0gcmVxdWlyZSgnZnVuY3Rpb24tYmluZCcpO1xudmFyIEdldEludHJpbnNpYyA9IHJlcXVpcmUoJ2dldC1pbnRyaW5zaWMnKTtcblxudmFyICRhcHBseSA9IEdldEludHJpbnNpYygnJUZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseSUnKTtcbnZhciAkY2FsbCA9IEdldEludHJpbnNpYygnJUZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsJScpO1xudmFyICRyZWZsZWN0QXBwbHkgPSBHZXRJbnRyaW5zaWMoJyVSZWZsZWN0LmFwcGx5JScsIHRydWUpIHx8IGJpbmQuY2FsbCgkY2FsbCwgJGFwcGx5KTtcblxudmFyICRnT1BEID0gR2V0SW50cmluc2ljKCclT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciUnLCB0cnVlKTtcbnZhciAkZGVmaW5lUHJvcGVydHkgPSBHZXRJbnRyaW5zaWMoJyVPYmplY3QuZGVmaW5lUHJvcGVydHklJywgdHJ1ZSk7XG52YXIgJG1heCA9IEdldEludHJpbnNpYygnJU1hdGgubWF4JScpO1xuXG5pZiAoJGRlZmluZVByb3BlcnR5KSB7XG5cdHRyeSB7XG5cdFx0JGRlZmluZVByb3BlcnR5KHt9LCAnYScsIHsgdmFsdWU6IDEgfSk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHQvLyBJRSA4IGhhcyBhIGJyb2tlbiBkZWZpbmVQcm9wZXJ0eVxuXHRcdCRkZWZpbmVQcm9wZXJ0eSA9IG51bGw7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjYWxsQmluZChvcmlnaW5hbEZ1bmN0aW9uKSB7XG5cdHZhciBmdW5jID0gJHJlZmxlY3RBcHBseShiaW5kLCAkY2FsbCwgYXJndW1lbnRzKTtcblx0aWYgKCRnT1BEICYmICRkZWZpbmVQcm9wZXJ0eSkge1xuXHRcdHZhciBkZXNjID0gJGdPUEQoZnVuYywgJ2xlbmd0aCcpO1xuXHRcdGlmIChkZXNjLmNvbmZpZ3VyYWJsZSkge1xuXHRcdFx0Ly8gb3JpZ2luYWwgbGVuZ3RoLCBwbHVzIHRoZSByZWNlaXZlciwgbWludXMgYW55IGFkZGl0aW9uYWwgYXJndW1lbnRzIChhZnRlciB0aGUgcmVjZWl2ZXIpXG5cdFx0XHQkZGVmaW5lUHJvcGVydHkoXG5cdFx0XHRcdGZ1bmMsXG5cdFx0XHRcdCdsZW5ndGgnLFxuXHRcdFx0XHR7IHZhbHVlOiAxICsgJG1heCgwLCBvcmlnaW5hbEZ1bmN0aW9uLmxlbmd0aCAtIChhcmd1bWVudHMubGVuZ3RoIC0gMSkpIH1cblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBmdW5jO1xufTtcblxudmFyIGFwcGx5QmluZCA9IGZ1bmN0aW9uIGFwcGx5QmluZCgpIHtcblx0cmV0dXJuICRyZWZsZWN0QXBwbHkoYmluZCwgJGFwcGx5LCBhcmd1bWVudHMpO1xufTtcblxuaWYgKCRkZWZpbmVQcm9wZXJ0eSkge1xuXHQkZGVmaW5lUHJvcGVydHkobW9kdWxlLmV4cG9ydHMsICdhcHBseScsIHsgdmFsdWU6IGFwcGx5QmluZCB9KTtcbn0gZWxzZSB7XG5cdG1vZHVsZS5leHBvcnRzLmFwcGx5ID0gYXBwbHlCaW5kO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgR2V0SW50cmluc2ljID0gcmVxdWlyZSgnZ2V0LWludHJpbnNpYycpO1xuXG52YXIgY2FsbEJpbmQgPSByZXF1aXJlKCcuLycpO1xuXG52YXIgJGluZGV4T2YgPSBjYWxsQmluZChHZXRJbnRyaW5zaWMoJ1N0cmluZy5wcm90b3R5cGUuaW5kZXhPZicpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjYWxsQm91bmRJbnRyaW5zaWMobmFtZSwgYWxsb3dNaXNzaW5nKSB7XG5cdHZhciBpbnRyaW5zaWMgPSBHZXRJbnRyaW5zaWMobmFtZSwgISFhbGxvd01pc3NpbmcpO1xuXHRpZiAodHlwZW9mIGludHJpbnNpYyA9PT0gJ2Z1bmN0aW9uJyAmJiAkaW5kZXhPZihuYW1lLCAnLnByb3RvdHlwZS4nKSA+IC0xKSB7XG5cdFx0cmV0dXJuIGNhbGxCaW5kKGludHJpbnNpYyk7XG5cdH1cblx0cmV0dXJuIGludHJpbnNpYztcbn07XG4iLCJ2YXIgaGFzTWFwID0gdHlwZW9mIE1hcCA9PT0gJ2Z1bmN0aW9uJyAmJiBNYXAucHJvdG90eXBlO1xudmFyIG1hcFNpemVEZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciAmJiBoYXNNYXAgPyBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKE1hcC5wcm90b3R5cGUsICdzaXplJykgOiBudWxsO1xudmFyIG1hcFNpemUgPSBoYXNNYXAgJiYgbWFwU2l6ZURlc2NyaXB0b3IgJiYgdHlwZW9mIG1hcFNpemVEZXNjcmlwdG9yLmdldCA9PT0gJ2Z1bmN0aW9uJyA/IG1hcFNpemVEZXNjcmlwdG9yLmdldCA6IG51bGw7XG52YXIgbWFwRm9yRWFjaCA9IGhhc01hcCAmJiBNYXAucHJvdG90eXBlLmZvckVhY2g7XG52YXIgaGFzU2V0ID0gdHlwZW9mIFNldCA9PT0gJ2Z1bmN0aW9uJyAmJiBTZXQucHJvdG90eXBlO1xudmFyIHNldFNpemVEZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciAmJiBoYXNTZXQgPyBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKFNldC5wcm90b3R5cGUsICdzaXplJykgOiBudWxsO1xudmFyIHNldFNpemUgPSBoYXNTZXQgJiYgc2V0U2l6ZURlc2NyaXB0b3IgJiYgdHlwZW9mIHNldFNpemVEZXNjcmlwdG9yLmdldCA9PT0gJ2Z1bmN0aW9uJyA/IHNldFNpemVEZXNjcmlwdG9yLmdldCA6IG51bGw7XG52YXIgc2V0Rm9yRWFjaCA9IGhhc1NldCAmJiBTZXQucHJvdG90eXBlLmZvckVhY2g7XG52YXIgaGFzV2Vha01hcCA9IHR5cGVvZiBXZWFrTWFwID09PSAnZnVuY3Rpb24nICYmIFdlYWtNYXAucHJvdG90eXBlO1xudmFyIHdlYWtNYXBIYXMgPSBoYXNXZWFrTWFwID8gV2Vha01hcC5wcm90b3R5cGUuaGFzIDogbnVsbDtcbnZhciBoYXNXZWFrU2V0ID0gdHlwZW9mIFdlYWtTZXQgPT09ICdmdW5jdGlvbicgJiYgV2Vha1NldC5wcm90b3R5cGU7XG52YXIgd2Vha1NldEhhcyA9IGhhc1dlYWtTZXQgPyBXZWFrU2V0LnByb3RvdHlwZS5oYXMgOiBudWxsO1xudmFyIGhhc1dlYWtSZWYgPSB0eXBlb2YgV2Vha1JlZiA9PT0gJ2Z1bmN0aW9uJyAmJiBXZWFrUmVmLnByb3RvdHlwZTtcbnZhciB3ZWFrUmVmRGVyZWYgPSBoYXNXZWFrUmVmID8gV2Vha1JlZi5wcm90b3R5cGUuZGVyZWYgOiBudWxsO1xudmFyIGJvb2xlYW5WYWx1ZU9mID0gQm9vbGVhbi5wcm90b3R5cGUudmFsdWVPZjtcbnZhciBvYmplY3RUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgZnVuY3Rpb25Ub1N0cmluZyA9IEZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZztcbnZhciAkbWF0Y2ggPSBTdHJpbmcucHJvdG90eXBlLm1hdGNoO1xudmFyICRzbGljZSA9IFN0cmluZy5wcm90b3R5cGUuc2xpY2U7XG52YXIgJHJlcGxhY2UgPSBTdHJpbmcucHJvdG90eXBlLnJlcGxhY2U7XG52YXIgJHRvVXBwZXJDYXNlID0gU3RyaW5nLnByb3RvdHlwZS50b1VwcGVyQ2FzZTtcbnZhciAkdG9Mb3dlckNhc2UgPSBTdHJpbmcucHJvdG90eXBlLnRvTG93ZXJDYXNlO1xudmFyICR0ZXN0ID0gUmVnRXhwLnByb3RvdHlwZS50ZXN0O1xudmFyICRjb25jYXQgPSBBcnJheS5wcm90b3R5cGUuY29uY2F0O1xudmFyICRqb2luID0gQXJyYXkucHJvdG90eXBlLmpvaW47XG52YXIgJGFyclNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyICRmbG9vciA9IE1hdGguZmxvb3I7XG52YXIgYmlnSW50VmFsdWVPZiA9IHR5cGVvZiBCaWdJbnQgPT09ICdmdW5jdGlvbicgPyBCaWdJbnQucHJvdG90eXBlLnZhbHVlT2YgOiBudWxsO1xudmFyIGdPUFMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzO1xudmFyIHN5bVRvU3RyaW5nID0gdHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSAnc3ltYm9sJyA/IFN5bWJvbC5wcm90b3R5cGUudG9TdHJpbmcgOiBudWxsO1xudmFyIGhhc1NoYW1tZWRTeW1ib2xzID0gdHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSAnb2JqZWN0Jztcbi8vIGllLCBgaGFzLXRvc3RyaW5ndGFnL3NoYW1zXG52YXIgdG9TdHJpbmdUYWcgPSB0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nICYmIFN5bWJvbC50b1N0cmluZ1RhZyAmJiAodHlwZW9mIFN5bWJvbC50b1N0cmluZ1RhZyA9PT0gaGFzU2hhbW1lZFN5bWJvbHMgPyAnb2JqZWN0JyA6ICdzeW1ib2wnKVxuICAgID8gU3ltYm9sLnRvU3RyaW5nVGFnXG4gICAgOiBudWxsO1xudmFyIGlzRW51bWVyYWJsZSA9IE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGU7XG5cbnZhciBnUE8gPSAodHlwZW9mIFJlZmxlY3QgPT09ICdmdW5jdGlvbicgPyBSZWZsZWN0LmdldFByb3RvdHlwZU9mIDogT2JqZWN0LmdldFByb3RvdHlwZU9mKSB8fCAoXG4gICAgW10uX19wcm90b19fID09PSBBcnJheS5wcm90b3R5cGUgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wcm90b1xuICAgICAgICA/IGZ1bmN0aW9uIChPKSB7XG4gICAgICAgICAgICByZXR1cm4gTy5fX3Byb3RvX187IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcHJvdG9cbiAgICAgICAgfVxuICAgICAgICA6IG51bGxcbik7XG5cbmZ1bmN0aW9uIGFkZE51bWVyaWNTZXBhcmF0b3IobnVtLCBzdHIpIHtcbiAgICBpZiAoXG4gICAgICAgIG51bSA9PT0gSW5maW5pdHlcbiAgICAgICAgfHwgbnVtID09PSAtSW5maW5pdHlcbiAgICAgICAgfHwgbnVtICE9PSBudW1cbiAgICAgICAgfHwgKG51bSAmJiBudW0gPiAtMTAwMCAmJiBudW0gPCAxMDAwKVxuICAgICAgICB8fCAkdGVzdC5jYWxsKC9lLywgc3RyKVxuICAgICkge1xuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICB2YXIgc2VwUmVnZXggPSAvWzAtOV0oPz0oPzpbMC05XXszfSkrKD8hWzAtOV0pKS9nO1xuICAgIGlmICh0eXBlb2YgbnVtID09PSAnbnVtYmVyJykge1xuICAgICAgICB2YXIgaW50ID0gbnVtIDwgMCA/IC0kZmxvb3IoLW51bSkgOiAkZmxvb3IobnVtKTsgLy8gdHJ1bmMobnVtKVxuICAgICAgICBpZiAoaW50ICE9PSBudW0pIHtcbiAgICAgICAgICAgIHZhciBpbnRTdHIgPSBTdHJpbmcoaW50KTtcbiAgICAgICAgICAgIHZhciBkZWMgPSAkc2xpY2UuY2FsbChzdHIsIGludFN0ci5sZW5ndGggKyAxKTtcbiAgICAgICAgICAgIHJldHVybiAkcmVwbGFjZS5jYWxsKGludFN0ciwgc2VwUmVnZXgsICckJl8nKSArICcuJyArICRyZXBsYWNlLmNhbGwoJHJlcGxhY2UuY2FsbChkZWMsIC8oWzAtOV17M30pL2csICckJl8nKSwgL18kLywgJycpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiAkcmVwbGFjZS5jYWxsKHN0ciwgc2VwUmVnZXgsICckJl8nKTtcbn1cblxudmFyIHV0aWxJbnNwZWN0ID0gcmVxdWlyZSgnLi91dGlsLmluc3BlY3QnKTtcbnZhciBpbnNwZWN0Q3VzdG9tID0gdXRpbEluc3BlY3QuY3VzdG9tO1xudmFyIGluc3BlY3RTeW1ib2wgPSBpc1N5bWJvbChpbnNwZWN0Q3VzdG9tKSA/IGluc3BlY3RDdXN0b20gOiBudWxsO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluc3BlY3RfKG9iaiwgb3B0aW9ucywgZGVwdGgsIHNlZW4pIHtcbiAgICB2YXIgb3B0cyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBpZiAoaGFzKG9wdHMsICdxdW90ZVN0eWxlJykgJiYgKG9wdHMucXVvdGVTdHlsZSAhPT0gJ3NpbmdsZScgJiYgb3B0cy5xdW90ZVN0eWxlICE9PSAnZG91YmxlJykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9uIFwicXVvdGVTdHlsZVwiIG11c3QgYmUgXCJzaW5nbGVcIiBvciBcImRvdWJsZVwiJyk7XG4gICAgfVxuICAgIGlmIChcbiAgICAgICAgaGFzKG9wdHMsICdtYXhTdHJpbmdMZW5ndGgnKSAmJiAodHlwZW9mIG9wdHMubWF4U3RyaW5nTGVuZ3RoID09PSAnbnVtYmVyJ1xuICAgICAgICAgICAgPyBvcHRzLm1heFN0cmluZ0xlbmd0aCA8IDAgJiYgb3B0cy5tYXhTdHJpbmdMZW5ndGggIT09IEluZmluaXR5XG4gICAgICAgICAgICA6IG9wdHMubWF4U3RyaW5nTGVuZ3RoICE9PSBudWxsXG4gICAgICAgIClcbiAgICApIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb3B0aW9uIFwibWF4U3RyaW5nTGVuZ3RoXCIsIGlmIHByb3ZpZGVkLCBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlciwgSW5maW5pdHksIG9yIGBudWxsYCcpO1xuICAgIH1cbiAgICB2YXIgY3VzdG9tSW5zcGVjdCA9IGhhcyhvcHRzLCAnY3VzdG9tSW5zcGVjdCcpID8gb3B0cy5jdXN0b21JbnNwZWN0IDogdHJ1ZTtcbiAgICBpZiAodHlwZW9mIGN1c3RvbUluc3BlY3QgIT09ICdib29sZWFuJyAmJiBjdXN0b21JbnNwZWN0ICE9PSAnc3ltYm9sJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvcHRpb24gXCJjdXN0b21JbnNwZWN0XCIsIGlmIHByb3ZpZGVkLCBtdXN0IGJlIGB0cnVlYCwgYGZhbHNlYCwgb3IgYFxcJ3N5bWJvbFxcJ2AnKTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAgIGhhcyhvcHRzLCAnaW5kZW50JylcbiAgICAgICAgJiYgb3B0cy5pbmRlbnQgIT09IG51bGxcbiAgICAgICAgJiYgb3B0cy5pbmRlbnQgIT09ICdcXHQnXG4gICAgICAgICYmICEocGFyc2VJbnQob3B0cy5pbmRlbnQsIDEwKSA9PT0gb3B0cy5pbmRlbnQgJiYgb3B0cy5pbmRlbnQgPiAwKVxuICAgICkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvcHRpb24gXCJpbmRlbnRcIiBtdXN0IGJlIFwiXFxcXHRcIiwgYW4gaW50ZWdlciA+IDAsIG9yIGBudWxsYCcpO1xuICAgIH1cbiAgICBpZiAoaGFzKG9wdHMsICdudW1lcmljU2VwYXJhdG9yJykgJiYgdHlwZW9mIG9wdHMubnVtZXJpY1NlcGFyYXRvciAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ29wdGlvbiBcIm51bWVyaWNTZXBhcmF0b3JcIiwgaWYgcHJvdmlkZWQsIG11c3QgYmUgYHRydWVgIG9yIGBmYWxzZWAnKTtcbiAgICB9XG4gICAgdmFyIG51bWVyaWNTZXBhcmF0b3IgPSBvcHRzLm51bWVyaWNTZXBhcmF0b3I7XG5cbiAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuICd1bmRlZmluZWQnO1xuICAgIH1cbiAgICBpZiAob2JqID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiAnbnVsbCc7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygb2JqID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgcmV0dXJuIG9iaiA/ICd0cnVlJyA6ICdmYWxzZSc7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvYmogPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBpbnNwZWN0U3RyaW5nKG9iaiwgb3B0cyk7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygb2JqID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZiAob2JqID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gSW5maW5pdHkgLyBvYmogPiAwID8gJzAnIDogJy0wJztcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3RyID0gU3RyaW5nKG9iaik7XG4gICAgICAgIHJldHVybiBudW1lcmljU2VwYXJhdG9yID8gYWRkTnVtZXJpY1NlcGFyYXRvcihvYmosIHN0cikgOiBzdHI7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygb2JqID09PSAnYmlnaW50Jykge1xuICAgICAgICB2YXIgYmlnSW50U3RyID0gU3RyaW5nKG9iaikgKyAnbic7XG4gICAgICAgIHJldHVybiBudW1lcmljU2VwYXJhdG9yID8gYWRkTnVtZXJpY1NlcGFyYXRvcihvYmosIGJpZ0ludFN0cikgOiBiaWdJbnRTdHI7XG4gICAgfVxuXG4gICAgdmFyIG1heERlcHRoID0gdHlwZW9mIG9wdHMuZGVwdGggPT09ICd1bmRlZmluZWQnID8gNSA6IG9wdHMuZGVwdGg7XG4gICAgaWYgKHR5cGVvZiBkZXB0aCA9PT0gJ3VuZGVmaW5lZCcpIHsgZGVwdGggPSAwOyB9XG4gICAgaWYgKGRlcHRoID49IG1heERlcHRoICYmIG1heERlcHRoID4gMCAmJiB0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gaXNBcnJheShvYmopID8gJ1tBcnJheV0nIDogJ1tPYmplY3RdJztcbiAgICB9XG5cbiAgICB2YXIgaW5kZW50ID0gZ2V0SW5kZW50KG9wdHMsIGRlcHRoKTtcblxuICAgIGlmICh0eXBlb2Ygc2VlbiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgc2VlbiA9IFtdO1xuICAgIH0gZWxzZSBpZiAoaW5kZXhPZihzZWVuLCBvYmopID49IDApIHtcbiAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnNwZWN0KHZhbHVlLCBmcm9tLCBub0luZGVudCkge1xuICAgICAgICBpZiAoZnJvbSkge1xuICAgICAgICAgICAgc2VlbiA9ICRhcnJTbGljZS5jYWxsKHNlZW4pO1xuICAgICAgICAgICAgc2Vlbi5wdXNoKGZyb20pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub0luZGVudCkge1xuICAgICAgICAgICAgdmFyIG5ld09wdHMgPSB7XG4gICAgICAgICAgICAgICAgZGVwdGg6IG9wdHMuZGVwdGhcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoaGFzKG9wdHMsICdxdW90ZVN0eWxlJykpIHtcbiAgICAgICAgICAgICAgICBuZXdPcHRzLnF1b3RlU3R5bGUgPSBvcHRzLnF1b3RlU3R5bGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaW5zcGVjdF8odmFsdWUsIG5ld09wdHMsIGRlcHRoICsgMSwgc2Vlbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluc3BlY3RfKHZhbHVlLCBvcHRzLCBkZXB0aCArIDEsIHNlZW4pO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nICYmICFpc1JlZ0V4cChvYmopKSB7IC8vIGluIG9sZGVyIGVuZ2luZXMsIHJlZ2V4ZXMgYXJlIGNhbGxhYmxlXG4gICAgICAgIHZhciBuYW1lID0gbmFtZU9mKG9iaik7XG4gICAgICAgIHZhciBrZXlzID0gYXJyT2JqS2V5cyhvYmosIGluc3BlY3QpO1xuICAgICAgICByZXR1cm4gJ1tGdW5jdGlvbicgKyAobmFtZSA/ICc6ICcgKyBuYW1lIDogJyAoYW5vbnltb3VzKScpICsgJ10nICsgKGtleXMubGVuZ3RoID4gMCA/ICcgeyAnICsgJGpvaW4uY2FsbChrZXlzLCAnLCAnKSArICcgfScgOiAnJyk7XG4gICAgfVxuICAgIGlmIChpc1N5bWJvbChvYmopKSB7XG4gICAgICAgIHZhciBzeW1TdHJpbmcgPSBoYXNTaGFtbWVkU3ltYm9scyA/ICRyZXBsYWNlLmNhbGwoU3RyaW5nKG9iaiksIC9eKFN5bWJvbFxcKC4qXFwpKV9bXildKiQvLCAnJDEnKSA6IHN5bVRvU3RyaW5nLmNhbGwob2JqKTtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmICFoYXNTaGFtbWVkU3ltYm9scyA/IG1hcmtCb3hlZChzeW1TdHJpbmcpIDogc3ltU3RyaW5nO1xuICAgIH1cbiAgICBpZiAoaXNFbGVtZW50KG9iaikpIHtcbiAgICAgICAgdmFyIHMgPSAnPCcgKyAkdG9Mb3dlckNhc2UuY2FsbChTdHJpbmcob2JqLm5vZGVOYW1lKSk7XG4gICAgICAgIHZhciBhdHRycyA9IG9iai5hdHRyaWJ1dGVzIHx8IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzICs9ICcgJyArIGF0dHJzW2ldLm5hbWUgKyAnPScgKyB3cmFwUXVvdGVzKHF1b3RlKGF0dHJzW2ldLnZhbHVlKSwgJ2RvdWJsZScsIG9wdHMpO1xuICAgICAgICB9XG4gICAgICAgIHMgKz0gJz4nO1xuICAgICAgICBpZiAob2JqLmNoaWxkTm9kZXMgJiYgb2JqLmNoaWxkTm9kZXMubGVuZ3RoKSB7IHMgKz0gJy4uLic7IH1cbiAgICAgICAgcyArPSAnPC8nICsgJHRvTG93ZXJDYXNlLmNhbGwoU3RyaW5nKG9iai5ub2RlTmFtZSkpICsgJz4nO1xuICAgICAgICByZXR1cm4gcztcbiAgICB9XG4gICAgaWYgKGlzQXJyYXkob2JqKSkge1xuICAgICAgICBpZiAob2JqLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gJ1tdJzsgfVxuICAgICAgICB2YXIgeHMgPSBhcnJPYmpLZXlzKG9iaiwgaW5zcGVjdCk7XG4gICAgICAgIGlmIChpbmRlbnQgJiYgIXNpbmdsZUxpbmVWYWx1ZXMoeHMpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1snICsgaW5kZW50ZWRKb2luKHhzLCBpbmRlbnQpICsgJ10nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnWyAnICsgJGpvaW4uY2FsbCh4cywgJywgJykgKyAnIF0nO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcihvYmopKSB7XG4gICAgICAgIHZhciBwYXJ0cyA9IGFyck9iaktleXMob2JqLCBpbnNwZWN0KTtcbiAgICAgICAgaWYgKCEoJ2NhdXNlJyBpbiBFcnJvci5wcm90b3R5cGUpICYmICdjYXVzZScgaW4gb2JqICYmICFpc0VudW1lcmFibGUuY2FsbChvYmosICdjYXVzZScpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3sgWycgKyBTdHJpbmcob2JqKSArICddICcgKyAkam9pbi5jYWxsKCRjb25jYXQuY2FsbCgnW2NhdXNlXTogJyArIGluc3BlY3Qob2JqLmNhdXNlKSwgcGFydHMpLCAnLCAnKSArICcgfSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gJ1snICsgU3RyaW5nKG9iaikgKyAnXSc7IH1cbiAgICAgICAgcmV0dXJuICd7IFsnICsgU3RyaW5nKG9iaikgKyAnXSAnICsgJGpvaW4uY2FsbChwYXJ0cywgJywgJykgKyAnIH0nO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgY3VzdG9tSW5zcGVjdCkge1xuICAgICAgICBpZiAoaW5zcGVjdFN5bWJvbCAmJiB0eXBlb2Ygb2JqW2luc3BlY3RTeW1ib2xdID09PSAnZnVuY3Rpb24nICYmIHV0aWxJbnNwZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gdXRpbEluc3BlY3Qob2JqLCB7IGRlcHRoOiBtYXhEZXB0aCAtIGRlcHRoIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKGN1c3RvbUluc3BlY3QgIT09ICdzeW1ib2wnICYmIHR5cGVvZiBvYmouaW5zcGVjdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIG9iai5pbnNwZWN0KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzTWFwKG9iaikpIHtcbiAgICAgICAgdmFyIG1hcFBhcnRzID0gW107XG4gICAgICAgIGlmIChtYXBGb3JFYWNoKSB7XG4gICAgICAgICAgICBtYXBGb3JFYWNoLmNhbGwob2JqLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgICAgICAgICAgIG1hcFBhcnRzLnB1c2goaW5zcGVjdChrZXksIG9iaiwgdHJ1ZSkgKyAnID0+ICcgKyBpbnNwZWN0KHZhbHVlLCBvYmopKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb2xsZWN0aW9uT2YoJ01hcCcsIG1hcFNpemUuY2FsbChvYmopLCBtYXBQYXJ0cywgaW5kZW50KTtcbiAgICB9XG4gICAgaWYgKGlzU2V0KG9iaikpIHtcbiAgICAgICAgdmFyIHNldFBhcnRzID0gW107XG4gICAgICAgIGlmIChzZXRGb3JFYWNoKSB7XG4gICAgICAgICAgICBzZXRGb3JFYWNoLmNhbGwob2JqLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBzZXRQYXJ0cy5wdXNoKGluc3BlY3QodmFsdWUsIG9iaikpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25PZignU2V0Jywgc2V0U2l6ZS5jYWxsKG9iaiksIHNldFBhcnRzLCBpbmRlbnQpO1xuICAgIH1cbiAgICBpZiAoaXNXZWFrTWFwKG9iaikpIHtcbiAgICAgICAgcmV0dXJuIHdlYWtDb2xsZWN0aW9uT2YoJ1dlYWtNYXAnKTtcbiAgICB9XG4gICAgaWYgKGlzV2Vha1NldChvYmopKSB7XG4gICAgICAgIHJldHVybiB3ZWFrQ29sbGVjdGlvbk9mKCdXZWFrU2V0Jyk7XG4gICAgfVxuICAgIGlmIChpc1dlYWtSZWYob2JqKSkge1xuICAgICAgICByZXR1cm4gd2Vha0NvbGxlY3Rpb25PZignV2Vha1JlZicpO1xuICAgIH1cbiAgICBpZiAoaXNOdW1iZXIob2JqKSkge1xuICAgICAgICByZXR1cm4gbWFya0JveGVkKGluc3BlY3QoTnVtYmVyKG9iaikpKTtcbiAgICB9XG4gICAgaWYgKGlzQmlnSW50KG9iaikpIHtcbiAgICAgICAgcmV0dXJuIG1hcmtCb3hlZChpbnNwZWN0KGJpZ0ludFZhbHVlT2YuY2FsbChvYmopKSk7XG4gICAgfVxuICAgIGlmIChpc0Jvb2xlYW4ob2JqKSkge1xuICAgICAgICByZXR1cm4gbWFya0JveGVkKGJvb2xlYW5WYWx1ZU9mLmNhbGwob2JqKSk7XG4gICAgfVxuICAgIGlmIChpc1N0cmluZyhvYmopKSB7XG4gICAgICAgIHJldHVybiBtYXJrQm94ZWQoaW5zcGVjdChTdHJpbmcob2JqKSkpO1xuICAgIH1cbiAgICBpZiAoIWlzRGF0ZShvYmopICYmICFpc1JlZ0V4cChvYmopKSB7XG4gICAgICAgIHZhciB5cyA9IGFyck9iaktleXMob2JqLCBpbnNwZWN0KTtcbiAgICAgICAgdmFyIGlzUGxhaW5PYmplY3QgPSBnUE8gPyBnUE8ob2JqKSA9PT0gT2JqZWN0LnByb3RvdHlwZSA6IG9iaiBpbnN0YW5jZW9mIE9iamVjdCB8fCBvYmouY29uc3RydWN0b3IgPT09IE9iamVjdDtcbiAgICAgICAgdmFyIHByb3RvVGFnID0gb2JqIGluc3RhbmNlb2YgT2JqZWN0ID8gJycgOiAnbnVsbCBwcm90b3R5cGUnO1xuICAgICAgICB2YXIgc3RyaW5nVGFnID0gIWlzUGxhaW5PYmplY3QgJiYgdG9TdHJpbmdUYWcgJiYgT2JqZWN0KG9iaikgPT09IG9iaiAmJiB0b1N0cmluZ1RhZyBpbiBvYmogPyAkc2xpY2UuY2FsbCh0b1N0cihvYmopLCA4LCAtMSkgOiBwcm90b1RhZyA/ICdPYmplY3QnIDogJyc7XG4gICAgICAgIHZhciBjb25zdHJ1Y3RvclRhZyA9IGlzUGxhaW5PYmplY3QgfHwgdHlwZW9mIG9iai5jb25zdHJ1Y3RvciAhPT0gJ2Z1bmN0aW9uJyA/ICcnIDogb2JqLmNvbnN0cnVjdG9yLm5hbWUgPyBvYmouY29uc3RydWN0b3IubmFtZSArICcgJyA6ICcnO1xuICAgICAgICB2YXIgdGFnID0gY29uc3RydWN0b3JUYWcgKyAoc3RyaW5nVGFnIHx8IHByb3RvVGFnID8gJ1snICsgJGpvaW4uY2FsbCgkY29uY2F0LmNhbGwoW10sIHN0cmluZ1RhZyB8fCBbXSwgcHJvdG9UYWcgfHwgW10pLCAnOiAnKSArICddICcgOiAnJyk7XG4gICAgICAgIGlmICh5cy5sZW5ndGggPT09IDApIHsgcmV0dXJuIHRhZyArICd7fSc7IH1cbiAgICAgICAgaWYgKGluZGVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRhZyArICd7JyArIGluZGVudGVkSm9pbih5cywgaW5kZW50KSArICd9JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGFnICsgJ3sgJyArICRqb2luLmNhbGwoeXMsICcsICcpICsgJyB9JztcbiAgICB9XG4gICAgcmV0dXJuIFN0cmluZyhvYmopO1xufTtcblxuZnVuY3Rpb24gd3JhcFF1b3RlcyhzLCBkZWZhdWx0U3R5bGUsIG9wdHMpIHtcbiAgICB2YXIgcXVvdGVDaGFyID0gKG9wdHMucXVvdGVTdHlsZSB8fCBkZWZhdWx0U3R5bGUpID09PSAnZG91YmxlJyA/ICdcIicgOiBcIidcIjtcbiAgICByZXR1cm4gcXVvdGVDaGFyICsgcyArIHF1b3RlQ2hhcjtcbn1cblxuZnVuY3Rpb24gcXVvdGUocykge1xuICAgIHJldHVybiAkcmVwbGFjZS5jYWxsKFN0cmluZyhzKSwgL1wiL2csICcmcXVvdDsnKTtcbn1cblxuZnVuY3Rpb24gaXNBcnJheShvYmopIHsgcmV0dXJuIHRvU3RyKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XScgJiYgKCF0b1N0cmluZ1RhZyB8fCAhKHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmIHRvU3RyaW5nVGFnIGluIG9iaikpOyB9XG5mdW5jdGlvbiBpc0RhdGUob2JqKSB7IHJldHVybiB0b1N0cihvYmopID09PSAnW29iamVjdCBEYXRlXScgJiYgKCF0b1N0cmluZ1RhZyB8fCAhKHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmIHRvU3RyaW5nVGFnIGluIG9iaikpOyB9XG5mdW5jdGlvbiBpc1JlZ0V4cChvYmopIHsgcmV0dXJuIHRvU3RyKG9iaikgPT09ICdbb2JqZWN0IFJlZ0V4cF0nICYmICghdG9TdHJpbmdUYWcgfHwgISh0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiB0b1N0cmluZ1RhZyBpbiBvYmopKTsgfVxuZnVuY3Rpb24gaXNFcnJvcihvYmopIHsgcmV0dXJuIHRvU3RyKG9iaikgPT09ICdbb2JqZWN0IEVycm9yXScgJiYgKCF0b1N0cmluZ1RhZyB8fCAhKHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmIHRvU3RyaW5nVGFnIGluIG9iaikpOyB9XG5mdW5jdGlvbiBpc1N0cmluZyhvYmopIHsgcmV0dXJuIHRvU3RyKG9iaikgPT09ICdbb2JqZWN0IFN0cmluZ10nICYmICghdG9TdHJpbmdUYWcgfHwgISh0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiB0b1N0cmluZ1RhZyBpbiBvYmopKTsgfVxuZnVuY3Rpb24gaXNOdW1iZXIob2JqKSB7IHJldHVybiB0b1N0cihvYmopID09PSAnW29iamVjdCBOdW1iZXJdJyAmJiAoIXRvU3RyaW5nVGFnIHx8ICEodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgdG9TdHJpbmdUYWcgaW4gb2JqKSk7IH1cbmZ1bmN0aW9uIGlzQm9vbGVhbihvYmopIHsgcmV0dXJuIHRvU3RyKG9iaikgPT09ICdbb2JqZWN0IEJvb2xlYW5dJyAmJiAoIXRvU3RyaW5nVGFnIHx8ICEodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgdG9TdHJpbmdUYWcgaW4gb2JqKSk7IH1cblxuLy8gU3ltYm9sIGFuZCBCaWdJbnQgZG8gaGF2ZSBTeW1ib2wudG9TdHJpbmdUYWcgYnkgc3BlYywgc28gdGhhdCBjYW4ndCBiZSB1c2VkIHRvIGVsaW1pbmF0ZSBmYWxzZSBwb3NpdGl2ZXNcbmZ1bmN0aW9uIGlzU3ltYm9sKG9iaikge1xuICAgIGlmIChoYXNTaGFtbWVkU3ltYm9scykge1xuICAgICAgICByZXR1cm4gb2JqICYmIHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmIG9iaiBpbnN0YW5jZW9mIFN5bWJvbDtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBvYmogPT09ICdzeW1ib2wnKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoIW9iaiB8fCB0eXBlb2Ygb2JqICE9PSAnb2JqZWN0JyB8fCAhc3ltVG9TdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBzeW1Ub1N0cmluZy5jYWxsKG9iaik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc0JpZ0ludChvYmopIHtcbiAgICBpZiAoIW9iaiB8fCB0eXBlb2Ygb2JqICE9PSAnb2JqZWN0JyB8fCAhYmlnSW50VmFsdWVPZikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGJpZ0ludFZhbHVlT2YuY2FsbChvYmopO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7fVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkgfHwgZnVuY3Rpb24gKGtleSkgeyByZXR1cm4ga2V5IGluIHRoaXM7IH07XG5mdW5jdGlvbiBoYXMob2JqLCBrZXkpIHtcbiAgICByZXR1cm4gaGFzT3duLmNhbGwob2JqLCBrZXkpO1xufVxuXG5mdW5jdGlvbiB0b1N0cihvYmopIHtcbiAgICByZXR1cm4gb2JqZWN0VG9TdHJpbmcuY2FsbChvYmopO1xufVxuXG5mdW5jdGlvbiBuYW1lT2YoZikge1xuICAgIGlmIChmLm5hbWUpIHsgcmV0dXJuIGYubmFtZTsgfVxuICAgIHZhciBtID0gJG1hdGNoLmNhbGwoZnVuY3Rpb25Ub1N0cmluZy5jYWxsKGYpLCAvXmZ1bmN0aW9uXFxzKihbXFx3JF0rKS8pO1xuICAgIGlmIChtKSB7IHJldHVybiBtWzFdOyB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGluZGV4T2YoeHMsIHgpIHtcbiAgICBpZiAoeHMuaW5kZXhPZikgeyByZXR1cm4geHMuaW5kZXhPZih4KTsgfVxuICAgIGZvciAodmFyIGkgPSAwLCBsID0geHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmICh4c1tpXSA9PT0geCkgeyByZXR1cm4gaTsgfVxuICAgIH1cbiAgICByZXR1cm4gLTE7XG59XG5cbmZ1bmN0aW9uIGlzTWFwKHgpIHtcbiAgICBpZiAoIW1hcFNpemUgfHwgIXggfHwgdHlwZW9mIHggIT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgbWFwU2l6ZS5jYWxsKHgpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc2V0U2l6ZS5jYWxsKHgpO1xuICAgICAgICB9IGNhdGNoIChzKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geCBpbnN0YW5jZW9mIE1hcDsgLy8gY29yZS1qcyB3b3JrYXJvdW5kLCBwcmUtdjIuNS4wXG4gICAgfSBjYXRjaCAoZSkge31cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzV2Vha01hcCh4KSB7XG4gICAgaWYgKCF3ZWFrTWFwSGFzIHx8ICF4IHx8IHR5cGVvZiB4ICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIHdlYWtNYXBIYXMuY2FsbCh4LCB3ZWFrTWFwSGFzKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHdlYWtTZXRIYXMuY2FsbCh4LCB3ZWFrU2V0SGFzKTtcbiAgICAgICAgfSBjYXRjaCAocykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHggaW5zdGFuY2VvZiBXZWFrTWFwOyAvLyBjb3JlLWpzIHdvcmthcm91bmQsIHByZS12Mi41LjBcbiAgICB9IGNhdGNoIChlKSB7fVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNXZWFrUmVmKHgpIHtcbiAgICBpZiAoIXdlYWtSZWZEZXJlZiB8fCAheCB8fCB0eXBlb2YgeCAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICB3ZWFrUmVmRGVyZWYuY2FsbCh4KTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge31cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzU2V0KHgpIHtcbiAgICBpZiAoIXNldFNpemUgfHwgIXggfHwgdHlwZW9mIHggIT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgc2V0U2l6ZS5jYWxsKHgpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbWFwU2l6ZS5jYWxsKHgpO1xuICAgICAgICB9IGNhdGNoIChtKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geCBpbnN0YW5jZW9mIFNldDsgLy8gY29yZS1qcyB3b3JrYXJvdW5kLCBwcmUtdjIuNS4wXG4gICAgfSBjYXRjaCAoZSkge31cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzV2Vha1NldCh4KSB7XG4gICAgaWYgKCF3ZWFrU2V0SGFzIHx8ICF4IHx8IHR5cGVvZiB4ICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIHdlYWtTZXRIYXMuY2FsbCh4LCB3ZWFrU2V0SGFzKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHdlYWtNYXBIYXMuY2FsbCh4LCB3ZWFrTWFwSGFzKTtcbiAgICAgICAgfSBjYXRjaCAocykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHggaW5zdGFuY2VvZiBXZWFrU2V0OyAvLyBjb3JlLWpzIHdvcmthcm91bmQsIHByZS12Mi41LjBcbiAgICB9IGNhdGNoIChlKSB7fVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNFbGVtZW50KHgpIHtcbiAgICBpZiAoIXggfHwgdHlwZW9mIHggIT09ICdvYmplY3QnKSB7IHJldHVybiBmYWxzZTsgfVxuICAgIGlmICh0eXBlb2YgSFRNTEVsZW1lbnQgIT09ICd1bmRlZmluZWQnICYmIHggaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHR5cGVvZiB4Lm5vZGVOYW1lID09PSAnc3RyaW5nJyAmJiB0eXBlb2YgeC5nZXRBdHRyaWJ1dGUgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGluc3BlY3RTdHJpbmcoc3RyLCBvcHRzKSB7XG4gICAgaWYgKHN0ci5sZW5ndGggPiBvcHRzLm1heFN0cmluZ0xlbmd0aCkge1xuICAgICAgICB2YXIgcmVtYWluaW5nID0gc3RyLmxlbmd0aCAtIG9wdHMubWF4U3RyaW5nTGVuZ3RoO1xuICAgICAgICB2YXIgdHJhaWxlciA9ICcuLi4gJyArIHJlbWFpbmluZyArICcgbW9yZSBjaGFyYWN0ZXInICsgKHJlbWFpbmluZyA+IDEgPyAncycgOiAnJyk7XG4gICAgICAgIHJldHVybiBpbnNwZWN0U3RyaW5nKCRzbGljZS5jYWxsKHN0ciwgMCwgb3B0cy5tYXhTdHJpbmdMZW5ndGgpLCBvcHRzKSArIHRyYWlsZXI7XG4gICAgfVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb250cm9sLXJlZ2V4XG4gICAgdmFyIHMgPSAkcmVwbGFjZS5jYWxsKCRyZXBsYWNlLmNhbGwoc3RyLCAvKFsnXFxcXF0pL2csICdcXFxcJDEnKSwgL1tcXHgwMC1cXHgxZl0vZywgbG93Ynl0ZSk7XG4gICAgcmV0dXJuIHdyYXBRdW90ZXMocywgJ3NpbmdsZScsIG9wdHMpO1xufVxuXG5mdW5jdGlvbiBsb3dieXRlKGMpIHtcbiAgICB2YXIgbiA9IGMuY2hhckNvZGVBdCgwKTtcbiAgICB2YXIgeCA9IHtcbiAgICAgICAgODogJ2InLFxuICAgICAgICA5OiAndCcsXG4gICAgICAgIDEwOiAnbicsXG4gICAgICAgIDEyOiAnZicsXG4gICAgICAgIDEzOiAncidcbiAgICB9W25dO1xuICAgIGlmICh4KSB7IHJldHVybiAnXFxcXCcgKyB4OyB9XG4gICAgcmV0dXJuICdcXFxceCcgKyAobiA8IDB4MTAgPyAnMCcgOiAnJykgKyAkdG9VcHBlckNhc2UuY2FsbChuLnRvU3RyaW5nKDE2KSk7XG59XG5cbmZ1bmN0aW9uIG1hcmtCb3hlZChzdHIpIHtcbiAgICByZXR1cm4gJ09iamVjdCgnICsgc3RyICsgJyknO1xufVxuXG5mdW5jdGlvbiB3ZWFrQ29sbGVjdGlvbk9mKHR5cGUpIHtcbiAgICByZXR1cm4gdHlwZSArICcgeyA/IH0nO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0aW9uT2YodHlwZSwgc2l6ZSwgZW50cmllcywgaW5kZW50KSB7XG4gICAgdmFyIGpvaW5lZEVudHJpZXMgPSBpbmRlbnQgPyBpbmRlbnRlZEpvaW4oZW50cmllcywgaW5kZW50KSA6ICRqb2luLmNhbGwoZW50cmllcywgJywgJyk7XG4gICAgcmV0dXJuIHR5cGUgKyAnICgnICsgc2l6ZSArICcpIHsnICsgam9pbmVkRW50cmllcyArICd9Jztcbn1cblxuZnVuY3Rpb24gc2luZ2xlTGluZVZhbHVlcyh4cykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGluZGV4T2YoeHNbaV0sICdcXG4nKSA+PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGdldEluZGVudChvcHRzLCBkZXB0aCkge1xuICAgIHZhciBiYXNlSW5kZW50O1xuICAgIGlmIChvcHRzLmluZGVudCA9PT0gJ1xcdCcpIHtcbiAgICAgICAgYmFzZUluZGVudCA9ICdcXHQnO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG9wdHMuaW5kZW50ID09PSAnbnVtYmVyJyAmJiBvcHRzLmluZGVudCA+IDApIHtcbiAgICAgICAgYmFzZUluZGVudCA9ICRqb2luLmNhbGwoQXJyYXkob3B0cy5pbmRlbnQgKyAxKSwgJyAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYmFzZTogYmFzZUluZGVudCxcbiAgICAgICAgcHJldjogJGpvaW4uY2FsbChBcnJheShkZXB0aCArIDEpLCBiYXNlSW5kZW50KVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGluZGVudGVkSm9pbih4cywgaW5kZW50KSB7XG4gICAgaWYgKHhzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gJyc7IH1cbiAgICB2YXIgbGluZUpvaW5lciA9ICdcXG4nICsgaW5kZW50LnByZXYgKyBpbmRlbnQuYmFzZTtcbiAgICByZXR1cm4gbGluZUpvaW5lciArICRqb2luLmNhbGwoeHMsICcsJyArIGxpbmVKb2luZXIpICsgJ1xcbicgKyBpbmRlbnQucHJldjtcbn1cblxuZnVuY3Rpb24gYXJyT2JqS2V5cyhvYmosIGluc3BlY3QpIHtcbiAgICB2YXIgaXNBcnIgPSBpc0FycmF5KG9iaik7XG4gICAgdmFyIHhzID0gW107XG4gICAgaWYgKGlzQXJyKSB7XG4gICAgICAgIHhzLmxlbmd0aCA9IG9iai5sZW5ndGg7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB4c1tpXSA9IGhhcyhvYmosIGkpID8gaW5zcGVjdChvYmpbaV0sIG9iaikgOiAnJztcbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgc3ltcyA9IHR5cGVvZiBnT1BTID09PSAnZnVuY3Rpb24nID8gZ09QUyhvYmopIDogW107XG4gICAgdmFyIHN5bU1hcDtcbiAgICBpZiAoaGFzU2hhbW1lZFN5bWJvbHMpIHtcbiAgICAgICAgc3ltTWFwID0ge307XG4gICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgc3ltcy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgc3ltTWFwWyckJyArIHN5bXNba11dID0gc3ltc1trXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1yZXN0cmljdGVkLXN5bnRheFxuICAgICAgICBpZiAoIWhhcyhvYmosIGtleSkpIHsgY29udGludWU7IH0gLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1yZXN0cmljdGVkLXN5bnRheCwgbm8tY29udGludWVcbiAgICAgICAgaWYgKGlzQXJyICYmIFN0cmluZyhOdW1iZXIoa2V5KSkgPT09IGtleSAmJiBrZXkgPCBvYmoubGVuZ3RoKSB7IGNvbnRpbnVlOyB9IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcmVzdHJpY3RlZC1zeW50YXgsIG5vLWNvbnRpbnVlXG4gICAgICAgIGlmIChoYXNTaGFtbWVkU3ltYm9scyAmJiBzeW1NYXBbJyQnICsga2V5XSBpbnN0YW5jZW9mIFN5bWJvbCkge1xuICAgICAgICAgICAgLy8gdGhpcyBpcyB0byBwcmV2ZW50IHNoYW1tZWQgU3ltYm9scywgd2hpY2ggYXJlIHN0b3JlZCBhcyBzdHJpbmdzLCBmcm9tIGJlaW5nIGluY2x1ZGVkIGluIHRoZSBzdHJpbmcga2V5IHNlY3Rpb25cbiAgICAgICAgICAgIGNvbnRpbnVlOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXJlc3RyaWN0ZWQtc3ludGF4LCBuby1jb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKCR0ZXN0LmNhbGwoL1teXFx3JF0vLCBrZXkpKSB7XG4gICAgICAgICAgICB4cy5wdXNoKGluc3BlY3Qoa2V5LCBvYmopICsgJzogJyArIGluc3BlY3Qob2JqW2tleV0sIG9iaikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgeHMucHVzaChrZXkgKyAnOiAnICsgaW5zcGVjdChvYmpba2V5XSwgb2JqKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHR5cGVvZiBnT1BTID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgc3ltcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgaWYgKGlzRW51bWVyYWJsZS5jYWxsKG9iaiwgc3ltc1tqXSkpIHtcbiAgICAgICAgICAgICAgICB4cy5wdXNoKCdbJyArIGluc3BlY3Qoc3ltc1tqXSkgKyAnXTogJyArIGluc3BlY3Qob2JqW3N5bXNbal1dLCBvYmopKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geHM7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBHZXRJbnRyaW5zaWMgPSByZXF1aXJlKCdnZXQtaW50cmluc2ljJyk7XG52YXIgY2FsbEJvdW5kID0gcmVxdWlyZSgnY2FsbC1iaW5kL2NhbGxCb3VuZCcpO1xudmFyIGluc3BlY3QgPSByZXF1aXJlKCdvYmplY3QtaW5zcGVjdCcpO1xuXG52YXIgJFR5cGVFcnJvciA9IEdldEludHJpbnNpYygnJVR5cGVFcnJvciUnKTtcbnZhciAkV2Vha01hcCA9IEdldEludHJpbnNpYygnJVdlYWtNYXAlJywgdHJ1ZSk7XG52YXIgJE1hcCA9IEdldEludHJpbnNpYygnJU1hcCUnLCB0cnVlKTtcblxudmFyICR3ZWFrTWFwR2V0ID0gY2FsbEJvdW5kKCdXZWFrTWFwLnByb3RvdHlwZS5nZXQnLCB0cnVlKTtcbnZhciAkd2Vha01hcFNldCA9IGNhbGxCb3VuZCgnV2Vha01hcC5wcm90b3R5cGUuc2V0JywgdHJ1ZSk7XG52YXIgJHdlYWtNYXBIYXMgPSBjYWxsQm91bmQoJ1dlYWtNYXAucHJvdG90eXBlLmhhcycsIHRydWUpO1xudmFyICRtYXBHZXQgPSBjYWxsQm91bmQoJ01hcC5wcm90b3R5cGUuZ2V0JywgdHJ1ZSk7XG52YXIgJG1hcFNldCA9IGNhbGxCb3VuZCgnTWFwLnByb3RvdHlwZS5zZXQnLCB0cnVlKTtcbnZhciAkbWFwSGFzID0gY2FsbEJvdW5kKCdNYXAucHJvdG90eXBlLmhhcycsIHRydWUpO1xuXG4vKlxuICogVGhpcyBmdW5jdGlvbiB0cmF2ZXJzZXMgdGhlIGxpc3QgcmV0dXJuaW5nIHRoZSBub2RlIGNvcnJlc3BvbmRpbmcgdG8gdGhlXG4gKiBnaXZlbiBrZXkuXG4gKlxuICogVGhhdCBub2RlIGlzIGFsc28gbW92ZWQgdG8gdGhlIGhlYWQgb2YgdGhlIGxpc3QsIHNvIHRoYXQgaWYgaXQncyBhY2Nlc3NlZFxuICogYWdhaW4gd2UgZG9uJ3QgbmVlZCB0byB0cmF2ZXJzZSB0aGUgd2hvbGUgbGlzdC4gQnkgZG9pbmcgc28sIGFsbCB0aGUgcmVjZW50bHlcbiAqIHVzZWQgbm9kZXMgY2FuIGJlIGFjY2Vzc2VkIHJlbGF0aXZlbHkgcXVpY2tseS5cbiAqL1xudmFyIGxpc3RHZXROb2RlID0gZnVuY3Rpb24gKGxpc3QsIGtleSkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbnNpc3RlbnQtcmV0dXJuXG5cdGZvciAodmFyIHByZXYgPSBsaXN0LCBjdXJyOyAoY3VyciA9IHByZXYubmV4dCkgIT09IG51bGw7IHByZXYgPSBjdXJyKSB7XG5cdFx0aWYgKGN1cnIua2V5ID09PSBrZXkpIHtcblx0XHRcdHByZXYubmV4dCA9IGN1cnIubmV4dDtcblx0XHRcdGN1cnIubmV4dCA9IGxpc3QubmV4dDtcblx0XHRcdGxpc3QubmV4dCA9IGN1cnI7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cblx0XHRcdHJldHVybiBjdXJyO1xuXHRcdH1cblx0fVxufTtcblxudmFyIGxpc3RHZXQgPSBmdW5jdGlvbiAob2JqZWN0cywga2V5KSB7XG5cdHZhciBub2RlID0gbGlzdEdldE5vZGUob2JqZWN0cywga2V5KTtcblx0cmV0dXJuIG5vZGUgJiYgbm9kZS52YWx1ZTtcbn07XG52YXIgbGlzdFNldCA9IGZ1bmN0aW9uIChvYmplY3RzLCBrZXksIHZhbHVlKSB7XG5cdHZhciBub2RlID0gbGlzdEdldE5vZGUob2JqZWN0cywga2V5KTtcblx0aWYgKG5vZGUpIHtcblx0XHRub2RlLnZhbHVlID0gdmFsdWU7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gUHJlcGVuZCB0aGUgbmV3IG5vZGUgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgbGlzdFxuXHRcdG9iamVjdHMubmV4dCA9IHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuXHRcdFx0a2V5OiBrZXksXG5cdFx0XHRuZXh0OiBvYmplY3RzLm5leHQsXG5cdFx0XHR2YWx1ZTogdmFsdWVcblx0XHR9O1xuXHR9XG59O1xudmFyIGxpc3RIYXMgPSBmdW5jdGlvbiAob2JqZWN0cywga2V5KSB7XG5cdHJldHVybiAhIWxpc3RHZXROb2RlKG9iamVjdHMsIGtleSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldFNpZGVDaGFubmVsKCkge1xuXHR2YXIgJHdtO1xuXHR2YXIgJG07XG5cdHZhciAkbztcblx0dmFyIGNoYW5uZWwgPSB7XG5cdFx0YXNzZXJ0OiBmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHRpZiAoIWNoYW5uZWwuaGFzKGtleSkpIHtcblx0XHRcdFx0dGhyb3cgbmV3ICRUeXBlRXJyb3IoJ1NpZGUgY2hhbm5lbCBkb2VzIG5vdCBjb250YWluICcgKyBpbnNwZWN0KGtleSkpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Z2V0OiBmdW5jdGlvbiAoa2V5KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29uc2lzdGVudC1yZXR1cm5cblx0XHRcdGlmICgkV2Vha01hcCAmJiBrZXkgJiYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnIHx8IHR5cGVvZiBrZXkgPT09ICdmdW5jdGlvbicpKSB7XG5cdFx0XHRcdGlmICgkd20pIHtcblx0XHRcdFx0XHRyZXR1cm4gJHdlYWtNYXBHZXQoJHdtLCBrZXkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKCRNYXApIHtcblx0XHRcdFx0aWYgKCRtKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRtYXBHZXQoJG0sIGtleSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICgkbykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxvbmVseS1pZlxuXHRcdFx0XHRcdHJldHVybiBsaXN0R2V0KCRvLCBrZXkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRoYXM6IGZ1bmN0aW9uIChrZXkpIHtcblx0XHRcdGlmICgkV2Vha01hcCAmJiBrZXkgJiYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnIHx8IHR5cGVvZiBrZXkgPT09ICdmdW5jdGlvbicpKSB7XG5cdFx0XHRcdGlmICgkd20pIHtcblx0XHRcdFx0XHRyZXR1cm4gJHdlYWtNYXBIYXMoJHdtLCBrZXkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKCRNYXApIHtcblx0XHRcdFx0aWYgKCRtKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRtYXBIYXMoJG0sIGtleSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICgkbykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxvbmVseS1pZlxuXHRcdFx0XHRcdHJldHVybiBsaXN0SGFzKCRvLCBrZXkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fSxcblx0XHRzZXQ6IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG5cdFx0XHRpZiAoJFdlYWtNYXAgJiYga2V5ICYmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0JyB8fCB0eXBlb2Yga2V5ID09PSAnZnVuY3Rpb24nKSkge1xuXHRcdFx0XHRpZiAoISR3bSkge1xuXHRcdFx0XHRcdCR3bSA9IG5ldyAkV2Vha01hcCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdCR3ZWFrTWFwU2V0KCR3bSwga2V5LCB2YWx1ZSk7XG5cdFx0XHR9IGVsc2UgaWYgKCRNYXApIHtcblx0XHRcdFx0aWYgKCEkbSkge1xuXHRcdFx0XHRcdCRtID0gbmV3ICRNYXAoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQkbWFwU2V0KCRtLCBrZXksIHZhbHVlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICghJG8pIHtcblx0XHRcdFx0XHQvKlxuXHRcdFx0XHRcdCAqIEluaXRpYWxpemUgdGhlIGxpbmtlZCBsaXN0IGFzIGFuIGVtcHR5IG5vZGUsIHNvIHRoYXQgd2UgZG9uJ3QgaGF2ZVxuXHRcdFx0XHRcdCAqIHRvIHNwZWNpYWwtY2FzZSBoYW5kbGluZyBvZiB0aGUgZmlyc3Qgbm9kZTogd2UgY2FuIGFsd2F5cyByZWZlciB0b1xuXHRcdFx0XHRcdCAqIGl0IGFzIChwcmV2aW91cyBub2RlKS5uZXh0LCBpbnN0ZWFkIG9mIHNvbWV0aGluZyBsaWtlIChsaXN0KS5oZWFkXG5cdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0JG8gPSB7IGtleToge30sIG5leHQ6IG51bGwgfTtcblx0XHRcdFx0fVxuXHRcdFx0XHRsaXN0U2V0KCRvLCBrZXksIHZhbHVlKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cdHJldHVybiBjaGFubmVsO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHJlcGxhY2UgPSBTdHJpbmcucHJvdG90eXBlLnJlcGxhY2U7XG52YXIgcGVyY2VudFR3ZW50aWVzID0gLyUyMC9nO1xuXG52YXIgRm9ybWF0ID0ge1xuICAgIFJGQzE3Mzg6ICdSRkMxNzM4JyxcbiAgICBSRkMzOTg2OiAnUkZDMzk4Nidcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgICdkZWZhdWx0JzogRm9ybWF0LlJGQzM5ODYsXG4gICAgZm9ybWF0dGVyczoge1xuICAgICAgICBSRkMxNzM4OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiByZXBsYWNlLmNhbGwodmFsdWUsIHBlcmNlbnRUd2VudGllcywgJysnKTtcbiAgICAgICAgfSxcbiAgICAgICAgUkZDMzk4NjogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgUkZDMTczODogRm9ybWF0LlJGQzE3MzgsXG4gICAgUkZDMzk4NjogRm9ybWF0LlJGQzM5ODZcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBmb3JtYXRzID0gcmVxdWlyZSgnLi9mb3JtYXRzJyk7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuXG52YXIgaGV4VGFibGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBhcnJheSA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjU2OyArK2kpIHtcbiAgICAgICAgYXJyYXkucHVzaCgnJScgKyAoKGkgPCAxNiA/ICcwJyA6ICcnKSArIGkudG9TdHJpbmcoMTYpKS50b1VwcGVyQ2FzZSgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXJyYXk7XG59KCkpO1xuXG52YXIgY29tcGFjdFF1ZXVlID0gZnVuY3Rpb24gY29tcGFjdFF1ZXVlKHF1ZXVlKSB7XG4gICAgd2hpbGUgKHF1ZXVlLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBxdWV1ZS5wb3AoKTtcbiAgICAgICAgdmFyIG9iaiA9IGl0ZW0ub2JqW2l0ZW0ucHJvcF07XG5cbiAgICAgICAgaWYgKGlzQXJyYXkob2JqKSkge1xuICAgICAgICAgICAgdmFyIGNvbXBhY3RlZCA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG9iai5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqW2pdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICBjb21wYWN0ZWQucHVzaChvYmpbal0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaXRlbS5vYmpbaXRlbS5wcm9wXSA9IGNvbXBhY3RlZDtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbnZhciBhcnJheVRvT2JqZWN0ID0gZnVuY3Rpb24gYXJyYXlUb09iamVjdChzb3VyY2UsIG9wdGlvbnMpIHtcbiAgICB2YXIgb2JqID0gb3B0aW9ucyAmJiBvcHRpb25zLnBsYWluT2JqZWN0cyA/IE9iamVjdC5jcmVhdGUobnVsbCkgOiB7fTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvdXJjZS5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAodHlwZW9mIHNvdXJjZVtpXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIG9ialtpXSA9IHNvdXJjZVtpXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvYmo7XG59O1xuXG52YXIgbWVyZ2UgPSBmdW5jdGlvbiBtZXJnZSh0YXJnZXQsIHNvdXJjZSwgb3B0aW9ucykge1xuICAgIC8qIGVzbGludCBuby1wYXJhbS1yZWFzc2lnbjogMCAqL1xuICAgIGlmICghc291cmNlKSB7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBzb3VyY2UgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIGlmIChpc0FycmF5KHRhcmdldCkpIHtcbiAgICAgICAgICAgIHRhcmdldC5wdXNoKHNvdXJjZSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0ICYmIHR5cGVvZiB0YXJnZXQgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBpZiAoKG9wdGlvbnMgJiYgKG9wdGlvbnMucGxhaW5PYmplY3RzIHx8IG9wdGlvbnMuYWxsb3dQcm90b3R5cGVzKSkgfHwgIWhhcy5jYWxsKE9iamVjdC5wcm90b3R5cGUsIHNvdXJjZSkpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRbc291cmNlXSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gW3RhcmdldCwgc291cmNlXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuXG4gICAgaWYgKCF0YXJnZXQgfHwgdHlwZW9mIHRhcmdldCAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIFt0YXJnZXRdLmNvbmNhdChzb3VyY2UpO1xuICAgIH1cblxuICAgIHZhciBtZXJnZVRhcmdldCA9IHRhcmdldDtcbiAgICBpZiAoaXNBcnJheSh0YXJnZXQpICYmICFpc0FycmF5KHNvdXJjZSkpIHtcbiAgICAgICAgbWVyZ2VUYXJnZXQgPSBhcnJheVRvT2JqZWN0KHRhcmdldCwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgaWYgKGlzQXJyYXkodGFyZ2V0KSAmJiBpc0FycmF5KHNvdXJjZSkpIHtcbiAgICAgICAgc291cmNlLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0sIGkpIHtcbiAgICAgICAgICAgIGlmIChoYXMuY2FsbCh0YXJnZXQsIGkpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldEl0ZW0gPSB0YXJnZXRbaV07XG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldEl0ZW0gJiYgdHlwZW9mIHRhcmdldEl0ZW0gPT09ICdvYmplY3QnICYmIGl0ZW0gJiYgdHlwZW9mIGl0ZW0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldFtpXSA9IG1lcmdlKHRhcmdldEl0ZW0sIGl0ZW0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0W2ldID0gaXRlbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHNvdXJjZSkucmVkdWNlKGZ1bmN0aW9uIChhY2MsIGtleSkge1xuICAgICAgICB2YXIgdmFsdWUgPSBzb3VyY2Vba2V5XTtcblxuICAgICAgICBpZiAoaGFzLmNhbGwoYWNjLCBrZXkpKSB7XG4gICAgICAgICAgICBhY2Nba2V5XSA9IG1lcmdlKGFjY1trZXldLCB2YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhY2Nba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgfSwgbWVyZ2VUYXJnZXQpO1xufTtcblxudmFyIGFzc2lnbiA9IGZ1bmN0aW9uIGFzc2lnblNpbmdsZVNvdXJjZSh0YXJnZXQsIHNvdXJjZSkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhzb3VyY2UpLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBrZXkpIHtcbiAgICAgICAgYWNjW2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCB0YXJnZXQpO1xufTtcblxudmFyIGRlY29kZSA9IGZ1bmN0aW9uIChzdHIsIGRlY29kZXIsIGNoYXJzZXQpIHtcbiAgICB2YXIgc3RyV2l0aG91dFBsdXMgPSBzdHIucmVwbGFjZSgvXFwrL2csICcgJyk7XG4gICAgaWYgKGNoYXJzZXQgPT09ICdpc28tODg1OS0xJykge1xuICAgICAgICAvLyB1bmVzY2FwZSBuZXZlciB0aHJvd3MsIG5vIHRyeS4uLmNhdGNoIG5lZWRlZDpcbiAgICAgICAgcmV0dXJuIHN0cldpdGhvdXRQbHVzLnJlcGxhY2UoLyVbMC05YS1mXXsyfS9naSwgdW5lc2NhcGUpO1xuICAgIH1cbiAgICAvLyB1dGYtOFxuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoc3RyV2l0aG91dFBsdXMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIHN0cldpdGhvdXRQbHVzO1xuICAgIH1cbn07XG5cbnZhciBlbmNvZGUgPSBmdW5jdGlvbiBlbmNvZGUoc3RyLCBkZWZhdWx0RW5jb2RlciwgY2hhcnNldCwga2luZCwgZm9ybWF0KSB7XG4gICAgLy8gVGhpcyBjb2RlIHdhcyBvcmlnaW5hbGx5IHdyaXR0ZW4gYnkgQnJpYW4gV2hpdGUgKG1zY2RleCkgZm9yIHRoZSBpby5qcyBjb3JlIHF1ZXJ5c3RyaW5nIGxpYnJhcnkuXG4gICAgLy8gSXQgaGFzIGJlZW4gYWRhcHRlZCBoZXJlIGZvciBzdHJpY3RlciBhZGhlcmVuY2UgdG8gUkZDIDM5ODZcbiAgICBpZiAoc3RyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH1cblxuICAgIHZhciBzdHJpbmcgPSBzdHI7XG4gICAgaWYgKHR5cGVvZiBzdHIgPT09ICdzeW1ib2wnKSB7XG4gICAgICAgIHN0cmluZyA9IFN5bWJvbC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChzdHIpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgc3RyaW5nID0gU3RyaW5nKHN0cik7XG4gICAgfVxuXG4gICAgaWYgKGNoYXJzZXQgPT09ICdpc28tODg1OS0xJykge1xuICAgICAgICByZXR1cm4gZXNjYXBlKHN0cmluZykucmVwbGFjZSgvJXVbMC05YS1mXXs0fS9naSwgZnVuY3Rpb24gKCQwKSB7XG4gICAgICAgICAgICByZXR1cm4gJyUyNiUyMycgKyBwYXJzZUludCgkMC5zbGljZSgyKSwgMTYpICsgJyUzQic7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBvdXQgPSAnJztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmluZy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgYyA9IHN0cmluZy5jaGFyQ29kZUF0KGkpO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIGMgPT09IDB4MkQgLy8gLVxuICAgICAgICAgICAgfHwgYyA9PT0gMHgyRSAvLyAuXG4gICAgICAgICAgICB8fCBjID09PSAweDVGIC8vIF9cbiAgICAgICAgICAgIHx8IGMgPT09IDB4N0UgLy8gflxuICAgICAgICAgICAgfHwgKGMgPj0gMHgzMCAmJiBjIDw9IDB4MzkpIC8vIDAtOVxuICAgICAgICAgICAgfHwgKGMgPj0gMHg0MSAmJiBjIDw9IDB4NUEpIC8vIGEtelxuICAgICAgICAgICAgfHwgKGMgPj0gMHg2MSAmJiBjIDw9IDB4N0EpIC8vIEEtWlxuICAgICAgICAgICAgfHwgKGZvcm1hdCA9PT0gZm9ybWF0cy5SRkMxNzM4ICYmIChjID09PSAweDI4IHx8IGMgPT09IDB4MjkpKSAvLyAoIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBvdXQgKz0gc3RyaW5nLmNoYXJBdChpKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGMgPCAweDgwKSB7XG4gICAgICAgICAgICBvdXQgPSBvdXQgKyBoZXhUYWJsZVtjXTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGMgPCAweDgwMCkge1xuICAgICAgICAgICAgb3V0ID0gb3V0ICsgKGhleFRhYmxlWzB4QzAgfCAoYyA+PiA2KV0gKyBoZXhUYWJsZVsweDgwIHwgKGMgJiAweDNGKV0pO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYyA8IDB4RDgwMCB8fCBjID49IDB4RTAwMCkge1xuICAgICAgICAgICAgb3V0ID0gb3V0ICsgKGhleFRhYmxlWzB4RTAgfCAoYyA+PiAxMildICsgaGV4VGFibGVbMHg4MCB8ICgoYyA+PiA2KSAmIDB4M0YpXSArIGhleFRhYmxlWzB4ODAgfCAoYyAmIDB4M0YpXSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGkgKz0gMTtcbiAgICAgICAgYyA9IDB4MTAwMDAgKyAoKChjICYgMHgzRkYpIDw8IDEwKSB8IChzdHJpbmcuY2hhckNvZGVBdChpKSAmIDB4M0ZGKSk7XG4gICAgICAgIC8qIGVzbGludCBvcGVyYXRvci1saW5lYnJlYWs6IFsyLCBcImJlZm9yZVwiXSAqL1xuICAgICAgICBvdXQgKz0gaGV4VGFibGVbMHhGMCB8IChjID4+IDE4KV1cbiAgICAgICAgICAgICsgaGV4VGFibGVbMHg4MCB8ICgoYyA+PiAxMikgJiAweDNGKV1cbiAgICAgICAgICAgICsgaGV4VGFibGVbMHg4MCB8ICgoYyA+PiA2KSAmIDB4M0YpXVxuICAgICAgICAgICAgKyBoZXhUYWJsZVsweDgwIHwgKGMgJiAweDNGKV07XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbnZhciBjb21wYWN0ID0gZnVuY3Rpb24gY29tcGFjdCh2YWx1ZSkge1xuICAgIHZhciBxdWV1ZSA9IFt7IG9iajogeyBvOiB2YWx1ZSB9LCBwcm9wOiAnbycgfV07XG4gICAgdmFyIHJlZnMgPSBbXTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBxdWV1ZVtpXTtcbiAgICAgICAgdmFyIG9iaiA9IGl0ZW0ub2JqW2l0ZW0ucHJvcF07XG5cbiAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGtleXMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBrZXlzW2pdO1xuICAgICAgICAgICAgdmFyIHZhbCA9IG9ialtrZXldO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09ICdvYmplY3QnICYmIHZhbCAhPT0gbnVsbCAmJiByZWZzLmluZGV4T2YodmFsKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBxdWV1ZS5wdXNoKHsgb2JqOiBvYmosIHByb3A6IGtleSB9KTtcbiAgICAgICAgICAgICAgICByZWZzLnB1c2godmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbXBhY3RRdWV1ZShxdWV1ZSk7XG5cbiAgICByZXR1cm4gdmFsdWU7XG59O1xuXG52YXIgaXNSZWdFeHAgPSBmdW5jdGlvbiBpc1JlZ0V4cChvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufTtcblxudmFyIGlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIob2JqKSB7XG4gICAgaWYgKCFvYmogfHwgdHlwZW9mIG9iaiAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiAhIShvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyICYmIG9iai5jb25zdHJ1Y3Rvci5pc0J1ZmZlcihvYmopKTtcbn07XG5cbnZhciBjb21iaW5lID0gZnVuY3Rpb24gY29tYmluZShhLCBiKSB7XG4gICAgcmV0dXJuIFtdLmNvbmNhdChhLCBiKTtcbn07XG5cbnZhciBtYXliZU1hcCA9IGZ1bmN0aW9uIG1heWJlTWFwKHZhbCwgZm4pIHtcbiAgICBpZiAoaXNBcnJheSh2YWwpKSB7XG4gICAgICAgIHZhciBtYXBwZWQgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIG1hcHBlZC5wdXNoKGZuKHZhbFtpXSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXBwZWQ7XG4gICAgfVxuICAgIHJldHVybiBmbih2YWwpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYXJyYXlUb09iamVjdDogYXJyYXlUb09iamVjdCxcbiAgICBhc3NpZ246IGFzc2lnbixcbiAgICBjb21iaW5lOiBjb21iaW5lLFxuICAgIGNvbXBhY3Q6IGNvbXBhY3QsXG4gICAgZGVjb2RlOiBkZWNvZGUsXG4gICAgZW5jb2RlOiBlbmNvZGUsXG4gICAgaXNCdWZmZXI6IGlzQnVmZmVyLFxuICAgIGlzUmVnRXhwOiBpc1JlZ0V4cCxcbiAgICBtYXliZU1hcDogbWF5YmVNYXAsXG4gICAgbWVyZ2U6IG1lcmdlXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZ2V0U2lkZUNoYW5uZWwgPSByZXF1aXJlKCdzaWRlLWNoYW5uZWwnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBmb3JtYXRzID0gcmVxdWlyZSgnLi9mb3JtYXRzJyk7XG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxudmFyIGFycmF5UHJlZml4R2VuZXJhdG9ycyA9IHtcbiAgICBicmFja2V0czogZnVuY3Rpb24gYnJhY2tldHMocHJlZml4KSB7XG4gICAgICAgIHJldHVybiBwcmVmaXggKyAnW10nO1xuICAgIH0sXG4gICAgY29tbWE6ICdjb21tYScsXG4gICAgaW5kaWNlczogZnVuY3Rpb24gaW5kaWNlcyhwcmVmaXgsIGtleSkge1xuICAgICAgICByZXR1cm4gcHJlZml4ICsgJ1snICsga2V5ICsgJ10nO1xuICAgIH0sXG4gICAgcmVwZWF0OiBmdW5jdGlvbiByZXBlYXQocHJlZml4KSB7XG4gICAgICAgIHJldHVybiBwcmVmaXg7XG4gICAgfVxufTtcblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xudmFyIHNwbGl0ID0gU3RyaW5nLnByb3RvdHlwZS5zcGxpdDtcbnZhciBwdXNoID0gQXJyYXkucHJvdG90eXBlLnB1c2g7XG52YXIgcHVzaFRvQXJyYXkgPSBmdW5jdGlvbiAoYXJyLCB2YWx1ZU9yQXJyYXkpIHtcbiAgICBwdXNoLmFwcGx5KGFyciwgaXNBcnJheSh2YWx1ZU9yQXJyYXkpID8gdmFsdWVPckFycmF5IDogW3ZhbHVlT3JBcnJheV0pO1xufTtcblxudmFyIHRvSVNPID0gRGF0ZS5wcm90b3R5cGUudG9JU09TdHJpbmc7XG5cbnZhciBkZWZhdWx0Rm9ybWF0ID0gZm9ybWF0c1snZGVmYXVsdCddO1xudmFyIGRlZmF1bHRzID0ge1xuICAgIGFkZFF1ZXJ5UHJlZml4OiBmYWxzZSxcbiAgICBhbGxvd0RvdHM6IGZhbHNlLFxuICAgIGNoYXJzZXQ6ICd1dGYtOCcsXG4gICAgY2hhcnNldFNlbnRpbmVsOiBmYWxzZSxcbiAgICBkZWxpbWl0ZXI6ICcmJyxcbiAgICBlbmNvZGU6IHRydWUsXG4gICAgZW5jb2RlcjogdXRpbHMuZW5jb2RlLFxuICAgIGVuY29kZVZhbHVlc09ubHk6IGZhbHNlLFxuICAgIGZvcm1hdDogZGVmYXVsdEZvcm1hdCxcbiAgICBmb3JtYXR0ZXI6IGZvcm1hdHMuZm9ybWF0dGVyc1tkZWZhdWx0Rm9ybWF0XSxcbiAgICAvLyBkZXByZWNhdGVkXG4gICAgaW5kaWNlczogZmFsc2UsXG4gICAgc2VyaWFsaXplRGF0ZTogZnVuY3Rpb24gc2VyaWFsaXplRGF0ZShkYXRlKSB7XG4gICAgICAgIHJldHVybiB0b0lTTy5jYWxsKGRhdGUpO1xuICAgIH0sXG4gICAgc2tpcE51bGxzOiBmYWxzZSxcbiAgICBzdHJpY3ROdWxsSGFuZGxpbmc6IGZhbHNlXG59O1xuXG52YXIgaXNOb25OdWxsaXNoUHJpbWl0aXZlID0gZnVuY3Rpb24gaXNOb25OdWxsaXNoUHJpbWl0aXZlKHYpIHtcbiAgICByZXR1cm4gdHlwZW9mIHYgPT09ICdzdHJpbmcnXG4gICAgICAgIHx8IHR5cGVvZiB2ID09PSAnbnVtYmVyJ1xuICAgICAgICB8fCB0eXBlb2YgdiA9PT0gJ2Jvb2xlYW4nXG4gICAgICAgIHx8IHR5cGVvZiB2ID09PSAnc3ltYm9sJ1xuICAgICAgICB8fCB0eXBlb2YgdiA9PT0gJ2JpZ2ludCc7XG59O1xuXG52YXIgc2VudGluZWwgPSB7fTtcblxudmFyIHN0cmluZ2lmeSA9IGZ1bmN0aW9uIHN0cmluZ2lmeShcbiAgICBvYmplY3QsXG4gICAgcHJlZml4LFxuICAgIGdlbmVyYXRlQXJyYXlQcmVmaXgsXG4gICAgY29tbWFSb3VuZFRyaXAsXG4gICAgc3RyaWN0TnVsbEhhbmRsaW5nLFxuICAgIHNraXBOdWxscyxcbiAgICBlbmNvZGVyLFxuICAgIGZpbHRlcixcbiAgICBzb3J0LFxuICAgIGFsbG93RG90cyxcbiAgICBzZXJpYWxpemVEYXRlLFxuICAgIGZvcm1hdCxcbiAgICBmb3JtYXR0ZXIsXG4gICAgZW5jb2RlVmFsdWVzT25seSxcbiAgICBjaGFyc2V0LFxuICAgIHNpZGVDaGFubmVsXG4pIHtcbiAgICB2YXIgb2JqID0gb2JqZWN0O1xuXG4gICAgdmFyIHRtcFNjID0gc2lkZUNoYW5uZWw7XG4gICAgdmFyIHN0ZXAgPSAwO1xuICAgIHZhciBmaW5kRmxhZyA9IGZhbHNlO1xuICAgIHdoaWxlICgodG1wU2MgPSB0bXBTYy5nZXQoc2VudGluZWwpKSAhPT0gdm9pZCB1bmRlZmluZWQgJiYgIWZpbmRGbGFnKSB7XG4gICAgICAgIC8vIFdoZXJlIG9iamVjdCBsYXN0IGFwcGVhcmVkIGluIHRoZSByZWYgdHJlZVxuICAgICAgICB2YXIgcG9zID0gdG1wU2MuZ2V0KG9iamVjdCk7XG4gICAgICAgIHN0ZXAgKz0gMTtcbiAgICAgICAgaWYgKHR5cGVvZiBwb3MgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZiAocG9zID09PSBzdGVwKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0N5Y2xpYyBvYmplY3QgdmFsdWUnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmluZEZsYWcgPSB0cnVlOyAvLyBCcmVhayB3aGlsZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdG1wU2MuZ2V0KHNlbnRpbmVsKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHN0ZXAgPSAwO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBmaWx0ZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgb2JqID0gZmlsdGVyKHByZWZpeCwgb2JqKTtcbiAgICB9IGVsc2UgaWYgKG9iaiBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgb2JqID0gc2VyaWFsaXplRGF0ZShvYmopO1xuICAgIH0gZWxzZSBpZiAoZ2VuZXJhdGVBcnJheVByZWZpeCA9PT0gJ2NvbW1hJyAmJiBpc0FycmF5KG9iaikpIHtcbiAgICAgICAgb2JqID0gdXRpbHMubWF5YmVNYXAob2JqLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VyaWFsaXplRGF0ZSh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChvYmogPT09IG51bGwpIHtcbiAgICAgICAgaWYgKHN0cmljdE51bGxIYW5kbGluZykge1xuICAgICAgICAgICAgcmV0dXJuIGVuY29kZXIgJiYgIWVuY29kZVZhbHVlc09ubHkgPyBlbmNvZGVyKHByZWZpeCwgZGVmYXVsdHMuZW5jb2RlciwgY2hhcnNldCwgJ2tleScsIGZvcm1hdCkgOiBwcmVmaXg7XG4gICAgICAgIH1cblxuICAgICAgICBvYmogPSAnJztcbiAgICB9XG5cbiAgICBpZiAoaXNOb25OdWxsaXNoUHJpbWl0aXZlKG9iaikgfHwgdXRpbHMuaXNCdWZmZXIob2JqKSkge1xuICAgICAgICBpZiAoZW5jb2Rlcikge1xuICAgICAgICAgICAgdmFyIGtleVZhbHVlID0gZW5jb2RlVmFsdWVzT25seSA/IHByZWZpeCA6IGVuY29kZXIocHJlZml4LCBkZWZhdWx0cy5lbmNvZGVyLCBjaGFyc2V0LCAna2V5JywgZm9ybWF0KTtcbiAgICAgICAgICAgIGlmIChnZW5lcmF0ZUFycmF5UHJlZml4ID09PSAnY29tbWEnICYmIGVuY29kZVZhbHVlc09ubHkpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWVzQXJyYXkgPSBzcGxpdC5jYWxsKFN0cmluZyhvYmopLCAnLCcpO1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZXNKb2luZWQgPSAnJztcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlc0FycmF5Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlc0pvaW5lZCArPSAoaSA9PT0gMCA/ICcnIDogJywnKSArIGZvcm1hdHRlcihlbmNvZGVyKHZhbHVlc0FycmF5W2ldLCBkZWZhdWx0cy5lbmNvZGVyLCBjaGFyc2V0LCAndmFsdWUnLCBmb3JtYXQpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtmb3JtYXR0ZXIoa2V5VmFsdWUpICsgKGNvbW1hUm91bmRUcmlwICYmIGlzQXJyYXkob2JqKSAmJiB2YWx1ZXNBcnJheS5sZW5ndGggPT09IDEgPyAnW10nIDogJycpICsgJz0nICsgdmFsdWVzSm9pbmVkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBbZm9ybWF0dGVyKGtleVZhbHVlKSArICc9JyArIGZvcm1hdHRlcihlbmNvZGVyKG9iaiwgZGVmYXVsdHMuZW5jb2RlciwgY2hhcnNldCwgJ3ZhbHVlJywgZm9ybWF0KSldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbZm9ybWF0dGVyKHByZWZpeCkgKyAnPScgKyBmb3JtYXR0ZXIoU3RyaW5nKG9iaikpXTtcbiAgICB9XG5cbiAgICB2YXIgdmFsdWVzID0gW107XG5cbiAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9XG5cbiAgICB2YXIgb2JqS2V5cztcbiAgICBpZiAoZ2VuZXJhdGVBcnJheVByZWZpeCA9PT0gJ2NvbW1hJyAmJiBpc0FycmF5KG9iaikpIHtcbiAgICAgICAgLy8gd2UgbmVlZCB0byBqb2luIGVsZW1lbnRzIGluXG4gICAgICAgIG9iaktleXMgPSBbeyB2YWx1ZTogb2JqLmxlbmd0aCA+IDAgPyBvYmouam9pbignLCcpIHx8IG51bGwgOiB2b2lkIHVuZGVmaW5lZCB9XTtcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkoZmlsdGVyKSkge1xuICAgICAgICBvYmpLZXlzID0gZmlsdGVyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMob2JqKTtcbiAgICAgICAgb2JqS2V5cyA9IHNvcnQgPyBrZXlzLnNvcnQoc29ydCkgOiBrZXlzO1xuICAgIH1cblxuICAgIHZhciBhZGp1c3RlZFByZWZpeCA9IGNvbW1hUm91bmRUcmlwICYmIGlzQXJyYXkob2JqKSAmJiBvYmoubGVuZ3RoID09PSAxID8gcHJlZml4ICsgJ1tdJyA6IHByZWZpeDtcblxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgb2JqS2V5cy5sZW5ndGg7ICsraikge1xuICAgICAgICB2YXIga2V5ID0gb2JqS2V5c1tqXTtcbiAgICAgICAgdmFyIHZhbHVlID0gdHlwZW9mIGtleSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIGtleS52YWx1ZSAhPT0gJ3VuZGVmaW5lZCcgPyBrZXkudmFsdWUgOiBvYmpba2V5XTtcblxuICAgICAgICBpZiAoc2tpcE51bGxzICYmIHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBrZXlQcmVmaXggPSBpc0FycmF5KG9iailcbiAgICAgICAgICAgID8gdHlwZW9mIGdlbmVyYXRlQXJyYXlQcmVmaXggPT09ICdmdW5jdGlvbicgPyBnZW5lcmF0ZUFycmF5UHJlZml4KGFkanVzdGVkUHJlZml4LCBrZXkpIDogYWRqdXN0ZWRQcmVmaXhcbiAgICAgICAgICAgIDogYWRqdXN0ZWRQcmVmaXggKyAoYWxsb3dEb3RzID8gJy4nICsga2V5IDogJ1snICsga2V5ICsgJ10nKTtcblxuICAgICAgICBzaWRlQ2hhbm5lbC5zZXQob2JqZWN0LCBzdGVwKTtcbiAgICAgICAgdmFyIHZhbHVlU2lkZUNoYW5uZWwgPSBnZXRTaWRlQ2hhbm5lbCgpO1xuICAgICAgICB2YWx1ZVNpZGVDaGFubmVsLnNldChzZW50aW5lbCwgc2lkZUNoYW5uZWwpO1xuICAgICAgICBwdXNoVG9BcnJheSh2YWx1ZXMsIHN0cmluZ2lmeShcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAga2V5UHJlZml4LFxuICAgICAgICAgICAgZ2VuZXJhdGVBcnJheVByZWZpeCxcbiAgICAgICAgICAgIGNvbW1hUm91bmRUcmlwLFxuICAgICAgICAgICAgc3RyaWN0TnVsbEhhbmRsaW5nLFxuICAgICAgICAgICAgc2tpcE51bGxzLFxuICAgICAgICAgICAgZW5jb2RlcixcbiAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgIHNvcnQsXG4gICAgICAgICAgICBhbGxvd0RvdHMsXG4gICAgICAgICAgICBzZXJpYWxpemVEYXRlLFxuICAgICAgICAgICAgZm9ybWF0LFxuICAgICAgICAgICAgZm9ybWF0dGVyLFxuICAgICAgICAgICAgZW5jb2RlVmFsdWVzT25seSxcbiAgICAgICAgICAgIGNoYXJzZXQsXG4gICAgICAgICAgICB2YWx1ZVNpZGVDaGFubmVsXG4gICAgICAgICkpO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZXM7XG59O1xuXG52YXIgbm9ybWFsaXplU3RyaW5naWZ5T3B0aW9ucyA9IGZ1bmN0aW9uIG5vcm1hbGl6ZVN0cmluZ2lmeU9wdGlvbnMob3B0cykge1xuICAgIGlmICghb3B0cykge1xuICAgICAgICByZXR1cm4gZGVmYXVsdHM7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMuZW5jb2RlciAhPT0gbnVsbCAmJiB0eXBlb2Ygb3B0cy5lbmNvZGVyICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygb3B0cy5lbmNvZGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0VuY29kZXIgaGFzIHRvIGJlIGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuXG4gICAgdmFyIGNoYXJzZXQgPSBvcHRzLmNoYXJzZXQgfHwgZGVmYXVsdHMuY2hhcnNldDtcbiAgICBpZiAodHlwZW9mIG9wdHMuY2hhcnNldCAhPT0gJ3VuZGVmaW5lZCcgJiYgb3B0cy5jaGFyc2V0ICE9PSAndXRmLTgnICYmIG9wdHMuY2hhcnNldCAhPT0gJ2lzby04ODU5LTEnKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBjaGFyc2V0IG9wdGlvbiBtdXN0IGJlIGVpdGhlciB1dGYtOCwgaXNvLTg4NTktMSwgb3IgdW5kZWZpbmVkJyk7XG4gICAgfVxuXG4gICAgdmFyIGZvcm1hdCA9IGZvcm1hdHNbJ2RlZmF1bHQnXTtcbiAgICBpZiAodHlwZW9mIG9wdHMuZm9ybWF0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAoIWhhcy5jYWxsKGZvcm1hdHMuZm9ybWF0dGVycywgb3B0cy5mb3JtYXQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGZvcm1hdCBvcHRpb24gcHJvdmlkZWQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgZm9ybWF0ID0gb3B0cy5mb3JtYXQ7XG4gICAgfVxuICAgIHZhciBmb3JtYXR0ZXIgPSBmb3JtYXRzLmZvcm1hdHRlcnNbZm9ybWF0XTtcblxuICAgIHZhciBmaWx0ZXIgPSBkZWZhdWx0cy5maWx0ZXI7XG4gICAgaWYgKHR5cGVvZiBvcHRzLmZpbHRlciA9PT0gJ2Z1bmN0aW9uJyB8fCBpc0FycmF5KG9wdHMuZmlsdGVyKSkge1xuICAgICAgICBmaWx0ZXIgPSBvcHRzLmZpbHRlcjtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBhZGRRdWVyeVByZWZpeDogdHlwZW9mIG9wdHMuYWRkUXVlcnlQcmVmaXggPT09ICdib29sZWFuJyA/IG9wdHMuYWRkUXVlcnlQcmVmaXggOiBkZWZhdWx0cy5hZGRRdWVyeVByZWZpeCxcbiAgICAgICAgYWxsb3dEb3RzOiB0eXBlb2Ygb3B0cy5hbGxvd0RvdHMgPT09ICd1bmRlZmluZWQnID8gZGVmYXVsdHMuYWxsb3dEb3RzIDogISFvcHRzLmFsbG93RG90cyxcbiAgICAgICAgY2hhcnNldDogY2hhcnNldCxcbiAgICAgICAgY2hhcnNldFNlbnRpbmVsOiB0eXBlb2Ygb3B0cy5jaGFyc2V0U2VudGluZWwgPT09ICdib29sZWFuJyA/IG9wdHMuY2hhcnNldFNlbnRpbmVsIDogZGVmYXVsdHMuY2hhcnNldFNlbnRpbmVsLFxuICAgICAgICBkZWxpbWl0ZXI6IHR5cGVvZiBvcHRzLmRlbGltaXRlciA9PT0gJ3VuZGVmaW5lZCcgPyBkZWZhdWx0cy5kZWxpbWl0ZXIgOiBvcHRzLmRlbGltaXRlcixcbiAgICAgICAgZW5jb2RlOiB0eXBlb2Ygb3B0cy5lbmNvZGUgPT09ICdib29sZWFuJyA/IG9wdHMuZW5jb2RlIDogZGVmYXVsdHMuZW5jb2RlLFxuICAgICAgICBlbmNvZGVyOiB0eXBlb2Ygb3B0cy5lbmNvZGVyID09PSAnZnVuY3Rpb24nID8gb3B0cy5lbmNvZGVyIDogZGVmYXVsdHMuZW5jb2RlcixcbiAgICAgICAgZW5jb2RlVmFsdWVzT25seTogdHlwZW9mIG9wdHMuZW5jb2RlVmFsdWVzT25seSA9PT0gJ2Jvb2xlYW4nID8gb3B0cy5lbmNvZGVWYWx1ZXNPbmx5IDogZGVmYXVsdHMuZW5jb2RlVmFsdWVzT25seSxcbiAgICAgICAgZmlsdGVyOiBmaWx0ZXIsXG4gICAgICAgIGZvcm1hdDogZm9ybWF0LFxuICAgICAgICBmb3JtYXR0ZXI6IGZvcm1hdHRlcixcbiAgICAgICAgc2VyaWFsaXplRGF0ZTogdHlwZW9mIG9wdHMuc2VyaWFsaXplRGF0ZSA9PT0gJ2Z1bmN0aW9uJyA/IG9wdHMuc2VyaWFsaXplRGF0ZSA6IGRlZmF1bHRzLnNlcmlhbGl6ZURhdGUsXG4gICAgICAgIHNraXBOdWxsczogdHlwZW9mIG9wdHMuc2tpcE51bGxzID09PSAnYm9vbGVhbicgPyBvcHRzLnNraXBOdWxscyA6IGRlZmF1bHRzLnNraXBOdWxscyxcbiAgICAgICAgc29ydDogdHlwZW9mIG9wdHMuc29ydCA9PT0gJ2Z1bmN0aW9uJyA/IG9wdHMuc29ydCA6IG51bGwsXG4gICAgICAgIHN0cmljdE51bGxIYW5kbGluZzogdHlwZW9mIG9wdHMuc3RyaWN0TnVsbEhhbmRsaW5nID09PSAnYm9vbGVhbicgPyBvcHRzLnN0cmljdE51bGxIYW5kbGluZyA6IGRlZmF1bHRzLnN0cmljdE51bGxIYW5kbGluZ1xuICAgIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmplY3QsIG9wdHMpIHtcbiAgICB2YXIgb2JqID0gb2JqZWN0O1xuICAgIHZhciBvcHRpb25zID0gbm9ybWFsaXplU3RyaW5naWZ5T3B0aW9ucyhvcHRzKTtcblxuICAgIHZhciBvYmpLZXlzO1xuICAgIHZhciBmaWx0ZXI7XG5cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMuZmlsdGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGZpbHRlciA9IG9wdGlvbnMuZmlsdGVyO1xuICAgICAgICBvYmogPSBmaWx0ZXIoJycsIG9iaik7XG4gICAgfSBlbHNlIGlmIChpc0FycmF5KG9wdGlvbnMuZmlsdGVyKSkge1xuICAgICAgICBmaWx0ZXIgPSBvcHRpb25zLmZpbHRlcjtcbiAgICAgICAgb2JqS2V5cyA9IGZpbHRlcjtcbiAgICB9XG5cbiAgICB2YXIga2V5cyA9IFtdO1xuXG4gICAgaWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnIHx8IG9iaiA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgdmFyIGFycmF5Rm9ybWF0O1xuICAgIGlmIChvcHRzICYmIG9wdHMuYXJyYXlGb3JtYXQgaW4gYXJyYXlQcmVmaXhHZW5lcmF0b3JzKSB7XG4gICAgICAgIGFycmF5Rm9ybWF0ID0gb3B0cy5hcnJheUZvcm1hdDtcbiAgICB9IGVsc2UgaWYgKG9wdHMgJiYgJ2luZGljZXMnIGluIG9wdHMpIHtcbiAgICAgICAgYXJyYXlGb3JtYXQgPSBvcHRzLmluZGljZXMgPyAnaW5kaWNlcycgOiAncmVwZWF0JztcbiAgICB9IGVsc2Uge1xuICAgICAgICBhcnJheUZvcm1hdCA9ICdpbmRpY2VzJztcbiAgICB9XG5cbiAgICB2YXIgZ2VuZXJhdGVBcnJheVByZWZpeCA9IGFycmF5UHJlZml4R2VuZXJhdG9yc1thcnJheUZvcm1hdF07XG4gICAgaWYgKG9wdHMgJiYgJ2NvbW1hUm91bmRUcmlwJyBpbiBvcHRzICYmIHR5cGVvZiBvcHRzLmNvbW1hUm91bmRUcmlwICE9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignYGNvbW1hUm91bmRUcmlwYCBtdXN0IGJlIGEgYm9vbGVhbiwgb3IgYWJzZW50Jyk7XG4gICAgfVxuICAgIHZhciBjb21tYVJvdW5kVHJpcCA9IGdlbmVyYXRlQXJyYXlQcmVmaXggPT09ICdjb21tYScgJiYgb3B0cyAmJiBvcHRzLmNvbW1hUm91bmRUcmlwO1xuXG4gICAgaWYgKCFvYmpLZXlzKSB7XG4gICAgICAgIG9iaktleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnNvcnQpIHtcbiAgICAgICAgb2JqS2V5cy5zb3J0KG9wdGlvbnMuc29ydCk7XG4gICAgfVxuXG4gICAgdmFyIHNpZGVDaGFubmVsID0gZ2V0U2lkZUNoYW5uZWwoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9iaktleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGtleSA9IG9iaktleXNbaV07XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuc2tpcE51bGxzICYmIG9ialtrZXldID09PSBudWxsKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBwdXNoVG9BcnJheShrZXlzLCBzdHJpbmdpZnkoXG4gICAgICAgICAgICBvYmpba2V5XSxcbiAgICAgICAgICAgIGtleSxcbiAgICAgICAgICAgIGdlbmVyYXRlQXJyYXlQcmVmaXgsXG4gICAgICAgICAgICBjb21tYVJvdW5kVHJpcCxcbiAgICAgICAgICAgIG9wdGlvbnMuc3RyaWN0TnVsbEhhbmRsaW5nLFxuICAgICAgICAgICAgb3B0aW9ucy5za2lwTnVsbHMsXG4gICAgICAgICAgICBvcHRpb25zLmVuY29kZSA/IG9wdGlvbnMuZW5jb2RlciA6IG51bGwsXG4gICAgICAgICAgICBvcHRpb25zLmZpbHRlcixcbiAgICAgICAgICAgIG9wdGlvbnMuc29ydCxcbiAgICAgICAgICAgIG9wdGlvbnMuYWxsb3dEb3RzLFxuICAgICAgICAgICAgb3B0aW9ucy5zZXJpYWxpemVEYXRlLFxuICAgICAgICAgICAgb3B0aW9ucy5mb3JtYXQsXG4gICAgICAgICAgICBvcHRpb25zLmZvcm1hdHRlcixcbiAgICAgICAgICAgIG9wdGlvbnMuZW5jb2RlVmFsdWVzT25seSxcbiAgICAgICAgICAgIG9wdGlvbnMuY2hhcnNldCxcbiAgICAgICAgICAgIHNpZGVDaGFubmVsXG4gICAgICAgICkpO1xuICAgIH1cblxuICAgIHZhciBqb2luZWQgPSBrZXlzLmpvaW4ob3B0aW9ucy5kZWxpbWl0ZXIpO1xuICAgIHZhciBwcmVmaXggPSBvcHRpb25zLmFkZFF1ZXJ5UHJlZml4ID09PSB0cnVlID8gJz8nIDogJyc7XG5cbiAgICBpZiAob3B0aW9ucy5jaGFyc2V0U2VudGluZWwpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuY2hhcnNldCA9PT0gJ2lzby04ODU5LTEnKSB7XG4gICAgICAgICAgICAvLyBlbmNvZGVVUklDb21wb25lbnQoJyYjMTAwMDM7JyksIHRoZSBcIm51bWVyaWMgZW50aXR5XCIgcmVwcmVzZW50YXRpb24gb2YgYSBjaGVja21hcmtcbiAgICAgICAgICAgIHByZWZpeCArPSAndXRmOD0lMjYlMjMxMDAwMyUzQiYnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gZW5jb2RlVVJJQ29tcG9uZW50KCfinJMnKVxuICAgICAgICAgICAgcHJlZml4ICs9ICd1dGY4PSVFMiU5QyU5MyYnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGpvaW5lZC5sZW5ndGggPiAwID8gcHJlZml4ICsgam9pbmVkIDogJyc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgYWxsb3dEb3RzOiBmYWxzZSxcbiAgICBhbGxvd1Byb3RvdHlwZXM6IGZhbHNlLFxuICAgIGFsbG93U3BhcnNlOiBmYWxzZSxcbiAgICBhcnJheUxpbWl0OiAyMCxcbiAgICBjaGFyc2V0OiAndXRmLTgnLFxuICAgIGNoYXJzZXRTZW50aW5lbDogZmFsc2UsXG4gICAgY29tbWE6IGZhbHNlLFxuICAgIGRlY29kZXI6IHV0aWxzLmRlY29kZSxcbiAgICBkZWxpbWl0ZXI6ICcmJyxcbiAgICBkZXB0aDogNSxcbiAgICBpZ25vcmVRdWVyeVByZWZpeDogZmFsc2UsXG4gICAgaW50ZXJwcmV0TnVtZXJpY0VudGl0aWVzOiBmYWxzZSxcbiAgICBwYXJhbWV0ZXJMaW1pdDogMTAwMCxcbiAgICBwYXJzZUFycmF5czogdHJ1ZSxcbiAgICBwbGFpbk9iamVjdHM6IGZhbHNlLFxuICAgIHN0cmljdE51bGxIYW5kbGluZzogZmFsc2Vcbn07XG5cbnZhciBpbnRlcnByZXROdW1lcmljRW50aXRpZXMgPSBmdW5jdGlvbiAoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8mIyhcXGQrKTsvZywgZnVuY3Rpb24gKCQwLCBudW1iZXJTdHIpIHtcbiAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUocGFyc2VJbnQobnVtYmVyU3RyLCAxMCkpO1xuICAgIH0pO1xufTtcblxudmFyIHBhcnNlQXJyYXlWYWx1ZSA9IGZ1bmN0aW9uICh2YWwsIG9wdGlvbnMpIHtcbiAgICBpZiAodmFsICYmIHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnICYmIG9wdGlvbnMuY29tbWEgJiYgdmFsLmluZGV4T2YoJywnKSA+IC0xKSB7XG4gICAgICAgIHJldHVybiB2YWwuc3BsaXQoJywnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsO1xufTtcblxuLy8gVGhpcyBpcyB3aGF0IGJyb3dzZXJzIHdpbGwgc3VibWl0IHdoZW4gdGhlIOKckyBjaGFyYWN0ZXIgb2NjdXJzIGluIGFuXG4vLyBhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQgYm9keSBhbmQgdGhlIGVuY29kaW5nIG9mIHRoZSBwYWdlIGNvbnRhaW5pbmdcbi8vIHRoZSBmb3JtIGlzIGlzby04ODU5LTEsIG9yIHdoZW4gdGhlIHN1Ym1pdHRlZCBmb3JtIGhhcyBhbiBhY2NlcHQtY2hhcnNldFxuLy8gYXR0cmlidXRlIG9mIGlzby04ODU5LTEuIFByZXN1bWFibHkgYWxzbyB3aXRoIG90aGVyIGNoYXJzZXRzIHRoYXQgZG8gbm90IGNvbnRhaW5cbi8vIHRoZSDinJMgY2hhcmFjdGVyLCBzdWNoIGFzIHVzLWFzY2lpLlxudmFyIGlzb1NlbnRpbmVsID0gJ3V0Zjg9JTI2JTIzMTAwMDMlM0InOyAvLyBlbmNvZGVVUklDb21wb25lbnQoJyYjMTAwMDM7JylcblxuLy8gVGhlc2UgYXJlIHRoZSBwZXJjZW50LWVuY29kZWQgdXRmLTggb2N0ZXRzIHJlcHJlc2VudGluZyBhIGNoZWNrbWFyaywgaW5kaWNhdGluZyB0aGF0IHRoZSByZXF1ZXN0IGFjdHVhbGx5IGlzIHV0Zi04IGVuY29kZWQuXG52YXIgY2hhcnNldFNlbnRpbmVsID0gJ3V0Zjg9JUUyJTlDJTkzJzsgLy8gZW5jb2RlVVJJQ29tcG9uZW50KCfinJMnKVxuXG52YXIgcGFyc2VWYWx1ZXMgPSBmdW5jdGlvbiBwYXJzZVF1ZXJ5U3RyaW5nVmFsdWVzKHN0ciwgb3B0aW9ucykge1xuICAgIHZhciBvYmogPSB7fTtcbiAgICB2YXIgY2xlYW5TdHIgPSBvcHRpb25zLmlnbm9yZVF1ZXJ5UHJlZml4ID8gc3RyLnJlcGxhY2UoL15cXD8vLCAnJykgOiBzdHI7XG4gICAgdmFyIGxpbWl0ID0gb3B0aW9ucy5wYXJhbWV0ZXJMaW1pdCA9PT0gSW5maW5pdHkgPyB1bmRlZmluZWQgOiBvcHRpb25zLnBhcmFtZXRlckxpbWl0O1xuICAgIHZhciBwYXJ0cyA9IGNsZWFuU3RyLnNwbGl0KG9wdGlvbnMuZGVsaW1pdGVyLCBsaW1pdCk7XG4gICAgdmFyIHNraXBJbmRleCA9IC0xOyAvLyBLZWVwIHRyYWNrIG9mIHdoZXJlIHRoZSB1dGY4IHNlbnRpbmVsIHdhcyBmb3VuZFxuICAgIHZhciBpO1xuXG4gICAgdmFyIGNoYXJzZXQgPSBvcHRpb25zLmNoYXJzZXQ7XG4gICAgaWYgKG9wdGlvbnMuY2hhcnNldFNlbnRpbmVsKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKHBhcnRzW2ldLmluZGV4T2YoJ3V0Zjg9JykgPT09IDApIHtcbiAgICAgICAgICAgICAgICBpZiAocGFydHNbaV0gPT09IGNoYXJzZXRTZW50aW5lbCkge1xuICAgICAgICAgICAgICAgICAgICBjaGFyc2V0ID0gJ3V0Zi04JztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHBhcnRzW2ldID09PSBpc29TZW50aW5lbCkge1xuICAgICAgICAgICAgICAgICAgICBjaGFyc2V0ID0gJ2lzby04ODU5LTEnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBza2lwSW5kZXggPSBpO1xuICAgICAgICAgICAgICAgIGkgPSBwYXJ0cy5sZW5ndGg7IC8vIFRoZSBlc2xpbnQgc2V0dGluZ3MgZG8gbm90IGFsbG93IGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChpID09PSBza2lwSW5kZXgpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYXJ0ID0gcGFydHNbaV07XG5cbiAgICAgICAgdmFyIGJyYWNrZXRFcXVhbHNQb3MgPSBwYXJ0LmluZGV4T2YoJ109Jyk7XG4gICAgICAgIHZhciBwb3MgPSBicmFja2V0RXF1YWxzUG9zID09PSAtMSA/IHBhcnQuaW5kZXhPZignPScpIDogYnJhY2tldEVxdWFsc1BvcyArIDE7XG5cbiAgICAgICAgdmFyIGtleSwgdmFsO1xuICAgICAgICBpZiAocG9zID09PSAtMSkge1xuICAgICAgICAgICAga2V5ID0gb3B0aW9ucy5kZWNvZGVyKHBhcnQsIGRlZmF1bHRzLmRlY29kZXIsIGNoYXJzZXQsICdrZXknKTtcbiAgICAgICAgICAgIHZhbCA9IG9wdGlvbnMuc3RyaWN0TnVsbEhhbmRsaW5nID8gbnVsbCA6ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAga2V5ID0gb3B0aW9ucy5kZWNvZGVyKHBhcnQuc2xpY2UoMCwgcG9zKSwgZGVmYXVsdHMuZGVjb2RlciwgY2hhcnNldCwgJ2tleScpO1xuICAgICAgICAgICAgdmFsID0gdXRpbHMubWF5YmVNYXAoXG4gICAgICAgICAgICAgICAgcGFyc2VBcnJheVZhbHVlKHBhcnQuc2xpY2UocG9zICsgMSksIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChlbmNvZGVkVmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmRlY29kZXIoZW5jb2RlZFZhbCwgZGVmYXVsdHMuZGVjb2RlciwgY2hhcnNldCwgJ3ZhbHVlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWwgJiYgb3B0aW9ucy5pbnRlcnByZXROdW1lcmljRW50aXRpZXMgJiYgY2hhcnNldCA9PT0gJ2lzby04ODU5LTEnKSB7XG4gICAgICAgICAgICB2YWwgPSBpbnRlcnByZXROdW1lcmljRW50aXRpZXModmFsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYXJ0LmluZGV4T2YoJ1tdPScpID4gLTEpIHtcbiAgICAgICAgICAgIHZhbCA9IGlzQXJyYXkodmFsKSA/IFt2YWxdIDogdmFsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhcy5jYWxsKG9iaiwga2V5KSkge1xuICAgICAgICAgICAgb2JqW2tleV0gPSB1dGlscy5jb21iaW5lKG9ialtrZXldLCB2YWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb2JqW2tleV0gPSB2YWw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gb2JqO1xufTtcblxudmFyIHBhcnNlT2JqZWN0ID0gZnVuY3Rpb24gKGNoYWluLCB2YWwsIG9wdGlvbnMsIHZhbHVlc1BhcnNlZCkge1xuICAgIHZhciBsZWFmID0gdmFsdWVzUGFyc2VkID8gdmFsIDogcGFyc2VBcnJheVZhbHVlKHZhbCwgb3B0aW9ucyk7XG5cbiAgICBmb3IgKHZhciBpID0gY2hhaW4ubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgdmFyIG9iajtcbiAgICAgICAgdmFyIHJvb3QgPSBjaGFpbltpXTtcblxuICAgICAgICBpZiAocm9vdCA9PT0gJ1tdJyAmJiBvcHRpb25zLnBhcnNlQXJyYXlzKSB7XG4gICAgICAgICAgICBvYmogPSBbXS5jb25jYXQobGVhZik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvYmogPSBvcHRpb25zLnBsYWluT2JqZWN0cyA/IE9iamVjdC5jcmVhdGUobnVsbCkgOiB7fTtcbiAgICAgICAgICAgIHZhciBjbGVhblJvb3QgPSByb290LmNoYXJBdCgwKSA9PT0gJ1snICYmIHJvb3QuY2hhckF0KHJvb3QubGVuZ3RoIC0gMSkgPT09ICddJyA/IHJvb3Quc2xpY2UoMSwgLTEpIDogcm9vdDtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHBhcnNlSW50KGNsZWFuUm9vdCwgMTApO1xuICAgICAgICAgICAgaWYgKCFvcHRpb25zLnBhcnNlQXJyYXlzICYmIGNsZWFuUm9vdCA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICBvYmogPSB7IDA6IGxlYWYgfTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgIWlzTmFOKGluZGV4KVxuICAgICAgICAgICAgICAgICYmIHJvb3QgIT09IGNsZWFuUm9vdFxuICAgICAgICAgICAgICAgICYmIFN0cmluZyhpbmRleCkgPT09IGNsZWFuUm9vdFxuICAgICAgICAgICAgICAgICYmIGluZGV4ID49IDBcbiAgICAgICAgICAgICAgICAmJiAob3B0aW9ucy5wYXJzZUFycmF5cyAmJiBpbmRleCA8PSBvcHRpb25zLmFycmF5TGltaXQpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBvYmogPSBbXTtcbiAgICAgICAgICAgICAgICBvYmpbaW5kZXhdID0gbGVhZjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2xlYW5Sb290ICE9PSAnX19wcm90b19fJykge1xuICAgICAgICAgICAgICAgIG9ialtjbGVhblJvb3RdID0gbGVhZjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxlYWYgPSBvYmo7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxlYWY7XG59O1xuXG52YXIgcGFyc2VLZXlzID0gZnVuY3Rpb24gcGFyc2VRdWVyeVN0cmluZ0tleXMoZ2l2ZW5LZXksIHZhbCwgb3B0aW9ucywgdmFsdWVzUGFyc2VkKSB7XG4gICAgaWYgKCFnaXZlbktleSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVHJhbnNmb3JtIGRvdCBub3RhdGlvbiB0byBicmFja2V0IG5vdGF0aW9uXG4gICAgdmFyIGtleSA9IG9wdGlvbnMuYWxsb3dEb3RzID8gZ2l2ZW5LZXkucmVwbGFjZSgvXFwuKFteLltdKykvZywgJ1skMV0nKSA6IGdpdmVuS2V5O1xuXG4gICAgLy8gVGhlIHJlZ2V4IGNodW5rc1xuXG4gICAgdmFyIGJyYWNrZXRzID0gLyhcXFtbXltcXF1dKl0pLztcbiAgICB2YXIgY2hpbGQgPSAvKFxcW1teW1xcXV0qXSkvZztcblxuICAgIC8vIEdldCB0aGUgcGFyZW50XG5cbiAgICB2YXIgc2VnbWVudCA9IG9wdGlvbnMuZGVwdGggPiAwICYmIGJyYWNrZXRzLmV4ZWMoa2V5KTtcbiAgICB2YXIgcGFyZW50ID0gc2VnbWVudCA/IGtleS5zbGljZSgwLCBzZWdtZW50LmluZGV4KSA6IGtleTtcblxuICAgIC8vIFN0YXNoIHRoZSBwYXJlbnQgaWYgaXQgZXhpc3RzXG5cbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgLy8gSWYgd2UgYXJlbid0IHVzaW5nIHBsYWluIG9iamVjdHMsIG9wdGlvbmFsbHkgcHJlZml4IGtleXMgdGhhdCB3b3VsZCBvdmVyd3JpdGUgb2JqZWN0IHByb3RvdHlwZSBwcm9wZXJ0aWVzXG4gICAgICAgIGlmICghb3B0aW9ucy5wbGFpbk9iamVjdHMgJiYgaGFzLmNhbGwoT2JqZWN0LnByb3RvdHlwZSwgcGFyZW50KSkge1xuICAgICAgICAgICAgaWYgKCFvcHRpb25zLmFsbG93UHJvdG90eXBlcykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGtleXMucHVzaChwYXJlbnQpO1xuICAgIH1cblxuICAgIC8vIExvb3AgdGhyb3VnaCBjaGlsZHJlbiBhcHBlbmRpbmcgdG8gdGhlIGFycmF5IHVudGlsIHdlIGhpdCBkZXB0aFxuXG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChvcHRpb25zLmRlcHRoID4gMCAmJiAoc2VnbWVudCA9IGNoaWxkLmV4ZWMoa2V5KSkgIT09IG51bGwgJiYgaSA8IG9wdGlvbnMuZGVwdGgpIHtcbiAgICAgICAgaSArPSAxO1xuICAgICAgICBpZiAoIW9wdGlvbnMucGxhaW5PYmplY3RzICYmIGhhcy5jYWxsKE9iamVjdC5wcm90b3R5cGUsIHNlZ21lbnRbMV0uc2xpY2UoMSwgLTEpKSkge1xuICAgICAgICAgICAgaWYgKCFvcHRpb25zLmFsbG93UHJvdG90eXBlcykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBrZXlzLnB1c2goc2VnbWVudFsxXSk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUncyBhIHJlbWFpbmRlciwganVzdCBhZGQgd2hhdGV2ZXIgaXMgbGVmdFxuXG4gICAgaWYgKHNlZ21lbnQpIHtcbiAgICAgICAga2V5cy5wdXNoKCdbJyArIGtleS5zbGljZShzZWdtZW50LmluZGV4KSArICddJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcnNlT2JqZWN0KGtleXMsIHZhbCwgb3B0aW9ucywgdmFsdWVzUGFyc2VkKTtcbn07XG5cbnZhciBub3JtYWxpemVQYXJzZU9wdGlvbnMgPSBmdW5jdGlvbiBub3JtYWxpemVQYXJzZU9wdGlvbnMob3B0cykge1xuICAgIGlmICghb3B0cykge1xuICAgICAgICByZXR1cm4gZGVmYXVsdHM7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMuZGVjb2RlciAhPT0gbnVsbCAmJiBvcHRzLmRlY29kZXIgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb3B0cy5kZWNvZGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0RlY29kZXIgaGFzIHRvIGJlIGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvcHRzLmNoYXJzZXQgIT09ICd1bmRlZmluZWQnICYmIG9wdHMuY2hhcnNldCAhPT0gJ3V0Zi04JyAmJiBvcHRzLmNoYXJzZXQgIT09ICdpc28tODg1OS0xJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgY2hhcnNldCBvcHRpb24gbXVzdCBiZSBlaXRoZXIgdXRmLTgsIGlzby04ODU5LTEsIG9yIHVuZGVmaW5lZCcpO1xuICAgIH1cbiAgICB2YXIgY2hhcnNldCA9IHR5cGVvZiBvcHRzLmNoYXJzZXQgPT09ICd1bmRlZmluZWQnID8gZGVmYXVsdHMuY2hhcnNldCA6IG9wdHMuY2hhcnNldDtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGFsbG93RG90czogdHlwZW9mIG9wdHMuYWxsb3dEb3RzID09PSAndW5kZWZpbmVkJyA/IGRlZmF1bHRzLmFsbG93RG90cyA6ICEhb3B0cy5hbGxvd0RvdHMsXG4gICAgICAgIGFsbG93UHJvdG90eXBlczogdHlwZW9mIG9wdHMuYWxsb3dQcm90b3R5cGVzID09PSAnYm9vbGVhbicgPyBvcHRzLmFsbG93UHJvdG90eXBlcyA6IGRlZmF1bHRzLmFsbG93UHJvdG90eXBlcyxcbiAgICAgICAgYWxsb3dTcGFyc2U6IHR5cGVvZiBvcHRzLmFsbG93U3BhcnNlID09PSAnYm9vbGVhbicgPyBvcHRzLmFsbG93U3BhcnNlIDogZGVmYXVsdHMuYWxsb3dTcGFyc2UsXG4gICAgICAgIGFycmF5TGltaXQ6IHR5cGVvZiBvcHRzLmFycmF5TGltaXQgPT09ICdudW1iZXInID8gb3B0cy5hcnJheUxpbWl0IDogZGVmYXVsdHMuYXJyYXlMaW1pdCxcbiAgICAgICAgY2hhcnNldDogY2hhcnNldCxcbiAgICAgICAgY2hhcnNldFNlbnRpbmVsOiB0eXBlb2Ygb3B0cy5jaGFyc2V0U2VudGluZWwgPT09ICdib29sZWFuJyA/IG9wdHMuY2hhcnNldFNlbnRpbmVsIDogZGVmYXVsdHMuY2hhcnNldFNlbnRpbmVsLFxuICAgICAgICBjb21tYTogdHlwZW9mIG9wdHMuY29tbWEgPT09ICdib29sZWFuJyA/IG9wdHMuY29tbWEgOiBkZWZhdWx0cy5jb21tYSxcbiAgICAgICAgZGVjb2RlcjogdHlwZW9mIG9wdHMuZGVjb2RlciA9PT0gJ2Z1bmN0aW9uJyA/IG9wdHMuZGVjb2RlciA6IGRlZmF1bHRzLmRlY29kZXIsXG4gICAgICAgIGRlbGltaXRlcjogdHlwZW9mIG9wdHMuZGVsaW1pdGVyID09PSAnc3RyaW5nJyB8fCB1dGlscy5pc1JlZ0V4cChvcHRzLmRlbGltaXRlcikgPyBvcHRzLmRlbGltaXRlciA6IGRlZmF1bHRzLmRlbGltaXRlcixcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWltcGxpY2l0LWNvZXJjaW9uLCBuby1leHRyYS1wYXJlbnNcbiAgICAgICAgZGVwdGg6ICh0eXBlb2Ygb3B0cy5kZXB0aCA9PT0gJ251bWJlcicgfHwgb3B0cy5kZXB0aCA9PT0gZmFsc2UpID8gK29wdHMuZGVwdGggOiBkZWZhdWx0cy5kZXB0aCxcbiAgICAgICAgaWdub3JlUXVlcnlQcmVmaXg6IG9wdHMuaWdub3JlUXVlcnlQcmVmaXggPT09IHRydWUsXG4gICAgICAgIGludGVycHJldE51bWVyaWNFbnRpdGllczogdHlwZW9mIG9wdHMuaW50ZXJwcmV0TnVtZXJpY0VudGl0aWVzID09PSAnYm9vbGVhbicgPyBvcHRzLmludGVycHJldE51bWVyaWNFbnRpdGllcyA6IGRlZmF1bHRzLmludGVycHJldE51bWVyaWNFbnRpdGllcyxcbiAgICAgICAgcGFyYW1ldGVyTGltaXQ6IHR5cGVvZiBvcHRzLnBhcmFtZXRlckxpbWl0ID09PSAnbnVtYmVyJyA/IG9wdHMucGFyYW1ldGVyTGltaXQgOiBkZWZhdWx0cy5wYXJhbWV0ZXJMaW1pdCxcbiAgICAgICAgcGFyc2VBcnJheXM6IG9wdHMucGFyc2VBcnJheXMgIT09IGZhbHNlLFxuICAgICAgICBwbGFpbk9iamVjdHM6IHR5cGVvZiBvcHRzLnBsYWluT2JqZWN0cyA9PT0gJ2Jvb2xlYW4nID8gb3B0cy5wbGFpbk9iamVjdHMgOiBkZWZhdWx0cy5wbGFpbk9iamVjdHMsXG4gICAgICAgIHN0cmljdE51bGxIYW5kbGluZzogdHlwZW9mIG9wdHMuc3RyaWN0TnVsbEhhbmRsaW5nID09PSAnYm9vbGVhbicgPyBvcHRzLnN0cmljdE51bGxIYW5kbGluZyA6IGRlZmF1bHRzLnN0cmljdE51bGxIYW5kbGluZ1xuICAgIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzdHIsIG9wdHMpIHtcbiAgICB2YXIgb3B0aW9ucyA9IG5vcm1hbGl6ZVBhcnNlT3B0aW9ucyhvcHRzKTtcblxuICAgIGlmIChzdHIgPT09ICcnIHx8IHN0ciA9PT0gbnVsbCB8fCB0eXBlb2Ygc3RyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5wbGFpbk9iamVjdHMgPyBPYmplY3QuY3JlYXRlKG51bGwpIDoge307XG4gICAgfVxuXG4gICAgdmFyIHRlbXBPYmogPSB0eXBlb2Ygc3RyID09PSAnc3RyaW5nJyA/IHBhcnNlVmFsdWVzKHN0ciwgb3B0aW9ucykgOiBzdHI7XG4gICAgdmFyIG9iaiA9IG9wdGlvbnMucGxhaW5PYmplY3RzID8gT2JqZWN0LmNyZWF0ZShudWxsKSA6IHt9O1xuXG4gICAgLy8gSXRlcmF0ZSBvdmVyIHRoZSBrZXlzIGFuZCBzZXR1cCB0aGUgbmV3IG9iamVjdFxuXG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh0ZW1wT2JqKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICAgIHZhciBuZXdPYmogPSBwYXJzZUtleXMoa2V5LCB0ZW1wT2JqW2tleV0sIG9wdGlvbnMsIHR5cGVvZiBzdHIgPT09ICdzdHJpbmcnKTtcbiAgICAgICAgb2JqID0gdXRpbHMubWVyZ2Uob2JqLCBuZXdPYmosIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLmFsbG93U3BhcnNlID09PSB0cnVlKSB7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuXG4gICAgcmV0dXJuIHV0aWxzLmNvbXBhY3Qob2JqKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzdHJpbmdpZnkgPSByZXF1aXJlKCcuL3N0cmluZ2lmeScpO1xudmFyIHBhcnNlID0gcmVxdWlyZSgnLi9wYXJzZScpO1xudmFyIGZvcm1hdHMgPSByZXF1aXJlKCcuL2Zvcm1hdHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZm9ybWF0czogZm9ybWF0cyxcbiAgICBwYXJzZTogcGFyc2UsXG4gICAgc3RyaW5naWZ5OiBzdHJpbmdpZnlcbn07XG4iLCJpbXBvcnQgd2luZG93SGFuZGxlciBmcm9tICcuLi8uLi9zcmMvaGVscGVyL3dpbmRvdyc7XG5pbXBvcnQgcXMgZnJvbSAncXMnO1xuaW1wb3J0IHVybGpvaW4gZnJvbSAndXJsLWpvaW4nO1xuXG5mdW5jdGlvbiBQb3B1cEhhbmRsZXIod2ViQXV0aCkge1xuICB0aGlzLndlYkF1dGggPSB3ZWJBdXRoO1xuICB0aGlzLl9jdXJyZW50X3BvcHVwID0gbnVsbDtcbiAgdGhpcy5vcHRpb25zID0gbnVsbDtcbn1cblxuUG9wdXBIYW5kbGVyLnByb3RvdHlwZS5wcmVsb2FkID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgX3RoaXMgPSB0aGlzO1xuICB2YXIgX3dpbmRvdyA9IHdpbmRvd0hhbmRsZXIuZ2V0V2luZG93KCk7XG5cbiAgdmFyIHVybCA9IG9wdGlvbnMudXJsIHx8ICdhYm91dDpibGFuayc7XG4gIHZhciBwb3B1cE9wdGlvbnMgPSBvcHRpb25zLnBvcHVwT3B0aW9ucyB8fCB7fTtcblxuICBwb3B1cE9wdGlvbnMubG9jYXRpb24gPSAneWVzJztcbiAgZGVsZXRlIHBvcHVwT3B0aW9ucy53aWR0aDtcbiAgZGVsZXRlIHBvcHVwT3B0aW9ucy5oZWlnaHQ7XG5cbiAgdmFyIHdpbmRvd0ZlYXR1cmVzID0gcXMuc3RyaW5naWZ5KHBvcHVwT3B0aW9ucywge1xuICAgIGVuY29kZTogZmFsc2UsXG4gICAgZGVsaW1pdGVyOiAnLCdcbiAgfSk7XG5cbiAgaWYgKHRoaXMuX2N1cnJlbnRfcG9wdXAgJiYgIXRoaXMuX2N1cnJlbnRfcG9wdXAuY2xvc2VkKSB7XG4gICAgcmV0dXJuIHRoaXMuX2N1cnJlbnRfcG9wdXA7XG4gIH1cblxuICB0aGlzLl9jdXJyZW50X3BvcHVwID0gX3dpbmRvdy5vcGVuKHVybCwgJ19ibGFuaycsIHdpbmRvd0ZlYXR1cmVzKTtcblxuICB0aGlzLl9jdXJyZW50X3BvcHVwLmtpbGwgPSBmdW5jdGlvbihzdWNjZXNzKSB7XG4gICAgX3RoaXMuX2N1cnJlbnRfcG9wdXAuc3VjY2VzcyA9IHN1Y2Nlc3M7XG4gICAgdGhpcy5jbG9zZSgpO1xuICAgIF90aGlzLl9jdXJyZW50X3BvcHVwID0gbnVsbDtcbiAgfTtcblxuICByZXR1cm4gdGhpcy5fY3VycmVudF9wb3B1cDtcbn07XG5cblBvcHVwSGFuZGxlci5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uKHVybCwgXywgb3B0aW9ucywgY2IpIHtcbiAgdmFyIF90aGlzID0gdGhpcztcbiAgdGhpcy51cmwgPSB1cmw7XG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gIGlmICghdGhpcy5fY3VycmVudF9wb3B1cCkge1xuICAgIG9wdGlvbnMudXJsID0gdXJsO1xuICAgIHRoaXMucHJlbG9hZChvcHRpb25zKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLl9jdXJyZW50X3BvcHVwLmxvY2F0aW9uLmhyZWYgPSB1cmw7XG4gIH1cblxuICB0aGlzLnRyYW5zaWVudEVycm9ySGFuZGxlciA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgX3RoaXMuZXJyb3JIYW5kbGVyKGV2ZW50LCBjYik7XG4gIH07XG5cbiAgdGhpcy50cmFuc2llbnRTdGFydEhhbmRsZXIgPSBmdW5jdGlvbihldmVudCkge1xuICAgIF90aGlzLnN0YXJ0SGFuZGxlcihldmVudCwgY2IpO1xuICB9O1xuXG4gIHRoaXMudHJhbnNpZW50RXhpdEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICBfdGhpcy5leGl0SGFuZGxlcihjYik7XG4gIH07XG5cbiAgdGhpcy5fY3VycmVudF9wb3B1cC5hZGRFdmVudExpc3RlbmVyKCdsb2FkZXJyb3InLCB0aGlzLnRyYW5zaWVudEVycm9ySGFuZGxlcik7XG4gIHRoaXMuX2N1cnJlbnRfcG9wdXAuYWRkRXZlbnRMaXN0ZW5lcignbG9hZHN0YXJ0JywgdGhpcy50cmFuc2llbnRTdGFydEhhbmRsZXIpO1xuICB0aGlzLl9jdXJyZW50X3BvcHVwLmFkZEV2ZW50TGlzdGVuZXIoJ2V4aXQnLCB0aGlzLnRyYW5zaWVudEV4aXRIYW5kbGVyKTtcbn07XG5cblBvcHVwSGFuZGxlci5wcm90b3R5cGUuZXJyb3JIYW5kbGVyID0gZnVuY3Rpb24oZXZlbnQsIGNiKSB7XG4gIGlmICghdGhpcy5fY3VycmVudF9wb3B1cCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMuX2N1cnJlbnRfcG9wdXAua2lsbCh0cnVlKTtcblxuICBjYih7IGVycm9yOiAnd2luZG93X2Vycm9yJywgZXJyb3JEZXNjcmlwdGlvbjogZXZlbnQubWVzc2FnZSB9KTtcbn07XG5cblBvcHVwSGFuZGxlci5wcm90b3R5cGUudW5ob29rID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2N1cnJlbnRfcG9wdXAucmVtb3ZlRXZlbnRMaXN0ZW5lcihcbiAgICAnbG9hZGVycm9yJyxcbiAgICB0aGlzLnRyYW5zaWVudEVycm9ySGFuZGxlclxuICApO1xuICB0aGlzLl9jdXJyZW50X3BvcHVwLnJlbW92ZUV2ZW50TGlzdGVuZXIoXG4gICAgJ2xvYWRzdGFydCcsXG4gICAgdGhpcy50cmFuc2llbnRTdGFydEhhbmRsZXJcbiAgKTtcbiAgdGhpcy5fY3VycmVudF9wb3B1cC5yZW1vdmVFdmVudExpc3RlbmVyKCdleGl0JywgdGhpcy50cmFuc2llbnRFeGl0SGFuZGxlcik7XG59O1xuXG5Qb3B1cEhhbmRsZXIucHJvdG90eXBlLmV4aXRIYW5kbGVyID0gZnVuY3Rpb24oY2IpIHtcbiAgaWYgKCF0aGlzLl9jdXJyZW50X3BvcHVwKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gd2hlbiB0aGUgbW9kYWwgaXMgY2xvc2VkLCB0aGlzIGV2ZW50IGlzIGNhbGxlZCB3aGljaCBlbmRzIHVwIHJlbW92aW5nIHRoZVxuICAvLyBldmVudCBsaXN0ZW5lcnMuIElmIHlvdSBtb3ZlIHRoaXMgYmVmb3JlIGNsb3NpbmcgdGhlIG1vZGFsLCBpdCB3aWxsIGFkZCB+MSBzZWNcbiAgLy8gZGVsYXkgYmV0d2VlbiB0aGUgdXNlciBiZWluZyByZWRpcmVjdGVkIHRvIHRoZSBjYWxsYmFjayBhbmQgdGhlIHBvcHVwIGdldHMgY2xvc2VkLlxuICB0aGlzLnVuaG9vaygpO1xuXG4gIGlmICghdGhpcy5fY3VycmVudF9wb3B1cC5zdWNjZXNzKSB7XG4gICAgY2IoeyBlcnJvcjogJ3dpbmRvd19jbG9zZWQnLCBlcnJvckRlc2NyaXB0aW9uOiAnQnJvd3NlciB3aW5kb3cgY2xvc2VkJyB9KTtcbiAgfVxufTtcblxuUG9wdXBIYW5kbGVyLnByb3RvdHlwZS5zdGFydEhhbmRsZXIgPSBmdW5jdGlvbihldmVudCwgY2IpIHtcbiAgdmFyIF90aGlzID0gdGhpcztcblxuICBpZiAoIXRoaXMuX2N1cnJlbnRfcG9wdXApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgY2FsbGJhY2tVcmwgPSB1cmxqb2luKFxuICAgICdodHRwczonLFxuICAgIHRoaXMud2ViQXV0aC5iYXNlT3B0aW9ucy5kb21haW4sXG4gICAgJy9tb2JpbGUnXG4gICk7XG5cbiAgaWYgKGV2ZW50LnVybCAmJiAhKGV2ZW50LnVybC5pbmRleE9mKGNhbGxiYWNrVXJsICsgJyMnKSA9PT0gMCkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgcGFydHMgPSBldmVudC51cmwuc3BsaXQoJyMnKTtcblxuICBpZiAocGFydHMubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIG9wdHMgPSB7IGhhc2g6IHBhcnRzLnBvcCgpIH07XG5cbiAgaWYgKHRoaXMub3B0aW9ucy5ub25jZSkge1xuICAgIG9wdHMubm9uY2UgPSB0aGlzLm9wdGlvbnMubm9uY2U7XG4gIH1cblxuICB0aGlzLndlYkF1dGgucGFyc2VIYXNoKG9wdHMsIGZ1bmN0aW9uKGVycm9yLCByZXN1bHQpIHtcbiAgICBpZiAoZXJyb3IgfHwgcmVzdWx0KSB7XG4gICAgICBfdGhpcy5fY3VycmVudF9wb3B1cC5raWxsKHRydWUpO1xuICAgICAgY2IoZXJyb3IsIHJlc3VsdCk7XG4gICAgfVxuICB9KTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFBvcHVwSGFuZGxlcjtcbiIsImltcG9ydCB1cmxqb2luIGZyb20gJ3VybC1qb2luJztcbmltcG9ydCBQb3B1cEhhbmRsZXIgZnJvbSAnLi9wb3B1cC1oYW5kbGVyJztcblxuZnVuY3Rpb24gUGx1Z2luSGFuZGxlcih3ZWJBdXRoKSB7XG4gIHRoaXMud2ViQXV0aCA9IHdlYkF1dGg7XG59XG5cblBsdWdpbkhhbmRsZXIucHJvdG90eXBlLnByb2Nlc3NQYXJhbXMgPSBmdW5jdGlvbihwYXJhbXMpIHtcbiAgcGFyYW1zLnJlZGlyZWN0VXJpID0gdXJsam9pbignaHR0cHM6Ly8nICsgcGFyYW1zLmRvbWFpbiwgJ21vYmlsZScpO1xuICBkZWxldGUgcGFyYW1zLm93cDtcbiAgcmV0dXJuIHBhcmFtcztcbn07XG5cblBsdWdpbkhhbmRsZXIucHJvdG90eXBlLmdldFBvcHVwSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFBvcHVwSGFuZGxlcih0aGlzLndlYkF1dGgpO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgUGx1Z2luSGFuZGxlcjtcbiIsImltcG9ydCB2ZXJzaW9uIGZyb20gJy4uLy4uL3NyYy92ZXJzaW9uJztcbmltcG9ydCB3aW5kb3dIYW5kbGVyIGZyb20gJy4uLy4uL3NyYy9oZWxwZXIvd2luZG93JztcbmltcG9ydCBQbHVnaW5IYW5kbGVyIGZyb20gJy4vcGx1Z2luLWhhbmRsZXInO1xuXG5mdW5jdGlvbiBDb3Jkb3ZhUGx1Z2luKCkge1xuICB0aGlzLndlYkF1dGggPSBudWxsO1xuICB0aGlzLnZlcnNpb24gPSB2ZXJzaW9uLnJhdztcbiAgdGhpcy5leHRlbnNpYmlsaXR5UG9pbnRzID0gWydwb3B1cC5hdXRob3JpemUnLCAncG9wdXAuZ2V0UG9wdXBIYW5kbGVyJ107XG59XG5cbkNvcmRvdmFQbHVnaW4ucHJvdG90eXBlLnNldFdlYkF1dGggPSBmdW5jdGlvbih3ZWJBdXRoKSB7XG4gIHRoaXMud2ViQXV0aCA9IHdlYkF1dGg7XG59O1xuXG5Db3Jkb3ZhUGx1Z2luLnByb3RvdHlwZS5zdXBwb3J0cyA9IGZ1bmN0aW9uKGV4dGVuc2liaWxpdHlQb2ludCkge1xuICB2YXIgX3dpbmRvdyA9IHdpbmRvd0hhbmRsZXIuZ2V0V2luZG93KCk7XG4gIHJldHVybiAoXG4gICAgKCEhX3dpbmRvdy5jb3Jkb3ZhIHx8ICEhX3dpbmRvdy5lbGVjdHJvbikgJiZcbiAgICB0aGlzLmV4dGVuc2liaWxpdHlQb2ludHMuaW5kZXhPZihleHRlbnNpYmlsaXR5UG9pbnQpID4gLTFcbiAgKTtcbn07XG5cbkNvcmRvdmFQbHVnaW4ucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBQbHVnaW5IYW5kbGVyKHRoaXMud2ViQXV0aCk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBDb3Jkb3ZhUGx1Z2luO1xuIl0sIm5hbWVzIjpbInRoaXMiLCJoYXNTeW1ib2xTaGFtIiwiYmluZCIsInVuZGVmaW5lZCIsImhhc1N5bWJvbHMiLCJyZXF1aXJlJCQwIiwiaGFzT3duIiwiR2V0SW50cmluc2ljIiwiJHJlcGxhY2UiLCIkY29uY2F0IiwiaXNBcnJheSIsInRvU3RyIiwiJFR5cGVFcnJvciIsImluc3BlY3QiLCJoYXMiLCJtZXJnZSIsImlzUmVnRXhwIiwic2lkZUNoYW5uZWwiLCJnZXRTaWRlQ2hhbm5lbCIsImRlZmF1bHRzIiwic3RyaW5naWZ5IiwicXMiLCJ1cmxqb2luIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0VBQUEsV0FBYyxHQUFHLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRTs7RUNBbEMsSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7QUFDekM7RUFDQSxTQUFTLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7RUFDeEMsRUFBRSxJQUFJLEdBQUcsSUFBSSxLQUFLLE9BQU8sR0FBRyxRQUFRLEdBQUcsSUFBSSxDQUFDO0VBQzVDLEVBQUUsSUFBSSxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFO0VBQ3BDLElBQUksTUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUMxQixHQUFHO0VBQ0gsQ0FBQztBQUNEO0VBQ0EsU0FBUyxRQUFRLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7RUFDakMsRUFBRSxJQUFJLE9BQU8sQ0FBQyxLQUFLLElBQUksRUFBRTtFQUN6QixJQUFJLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDMUIsR0FBRztFQUNILENBQUM7QUFDRDtFQUNBLFNBQVMsS0FBSyxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO0VBQ2hDLEVBQUUsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO0VBQ2hDLElBQUksTUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUMxQixHQUFHO0VBQ0gsQ0FBQztBQUNEO0VBQ0EsU0FBUyxLQUFLLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUU7RUFDdEMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsSUFBSSxDQUFDLEVBQUU7RUFDN0IsSUFBSSxRQUFRLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0VBQzdDLEdBQUc7RUFDSCxFQUFFLElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksVUFBVSxFQUFFO0VBQzlDLElBQUksSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN2QztFQUNBLElBQUksS0FBSyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7RUFDdEQsTUFBTSxJQUFJ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
