'use strict';

exports.__esModule = true;

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

exports.getWalliCollection = getWalliCollection;
exports.check = check;

var _walli = require('walli');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function makeSymbol(name) {
  return typeof Symbol === 'function' ? Symbol(name) : name;
} /**
   * @file index
   * @author imcuttle
   * @description
   */


var WALLI_COLLECTION_NAME = makeSymbol('[[walli]]');

function getWalliCollection(target) {
  if (!target) {
    return null;
  }

  return target[WALLI_COLLECTION_NAME];
}

function isValidWalli(walliInstance) {
  return walliInstance instanceof _walli.Verifiable;
}

/**
 * Check the target
 * @param target {any}
 * @param options {{}}
 * @param [options.abortWhenFail=false] {boolean} - Whether aborting the check flow when illegal value has been found.
 * @param [options.excludes=[]] {string[]} - The excluding field name list.
 * @param [options.includes=[]] {string[]} - The including field name list.
 * @param [options.order=[]] {string[]} - The order of field name list.
 * @param [options.ignoreValIsUndefined=true] - Whether ignoring the check flow when value is undefined.
 * @param [options.ignoreNotHasVal=true] - Whether ignoring the check flow when the target has not value.
 * @param [options.recursive=false] - Whether checking the target recursively.
 * @param [options.returnWalliResult=false] - Whether returning walli check's result.
 * @return {null | object}
 */
function check(target) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$abortWhenFail = _ref.abortWhenFail,
      abortWhenFail = _ref$abortWhenFail === undefined ? false : _ref$abortWhenFail,
      _ref$excludes = _ref.excludes,
      excludes = _ref$excludes === undefined ? [] : _ref$excludes,
      _ref$includes = _ref.includes,
      includes = _ref$includes === undefined ? [] : _ref$includes,
      order = _ref.order,
      _ref$ignoreValIsUndef = _ref.ignoreValIsUndefined,
      ignoreValIsUndefined = _ref$ignoreValIsUndef === undefined ? true : _ref$ignoreValIsUndef,
      _ref$ignoreNotHasVal = _ref.ignoreNotHasVal,
      ignoreNotHasVal = _ref$ignoreNotHasVal === undefined ? true : _ref$ignoreNotHasVal,
      _ref$recursive = _ref.recursive,
      recursive = _ref$recursive === undefined ? false : _ref$recursive,
      _ref$returnWalliResul = _ref.returnWalliResult,
      returnWalliResult = _ref$returnWalliResul === undefined ? false : _ref$returnWalliResul;

  var collection = getWalliCollection(target);
  if (!collection && !recursive) {
    return null;
  }

  var checkNameList = !includes || !includes.length ? Object.keys(recursive ? target : collection) : includes;
  if (excludes && !!excludes.length) {
    checkNameList = checkNameList.filter(function (name) {
      return !excludes.includes(name);
    });
  }
  if (order && !!order.length) {
    checkNameList = checkNameList.sort(function (nameA, nameB) {
      return order.indexOf(nameA) - order.indexOf(nameB);
    });
  }

  var failMap = {};
  for (var i = 0; i < checkNameList.length; i++) {
    var name = checkNameList[i];
    var mayWalli = collection && collection[name];

    if (!mayWalli && recursive) {
      var memberChecked = check.apply(this, [target[name]].concat([].concat(Array.prototype.slice.call(arguments)).slice(1)));
      if (memberChecked) {
        failMap[name] = memberChecked;
        if (abortWhenFail) {
          break;
        }
      }
    } else {
      if (process.env.NODE_ENV !== 'production' && !isValidWalli(mayWalli)) {
        console.error('walli-decorator: The walli instance of "' + name + '" is not an valid walli, instead of ' + mayWalli);
        continue;
      }

      if (ignoreNotHasVal && !(name in target) || ignoreValIsUndefined && typeof target[name] === 'undefined') {
        continue;
      }

      var result = mayWalli.check(target[name]);
      if (result && !result.ok) {
        failMap[name] = !returnWalliResult ? result.toString() : result;

        if (abortWhenFail) {
          break;
        }
      }
    }
  }

  if (!Object.keys(failMap).length) {
    return null;
  }
  Object.defineProperty(failMap, 'toString', {
    value: function value() {
      var _this = this;

      var nameList = Object.keys(this);

      nameList.forEach(function (name) {
        _this[name].toString();
      });
    },
    enumerable: false
  });
  return failMap;
}

/**
 *
 * @param walliInstance
 * @return {function(*=, *, *): *}
 * @example
 * import walliDecorator, { check } from 'walli-decorator'
 * import * as w from 'walli'
 * class A {
 *   \@walliDecorator(w.string)
 *   abc = 123
 * }
 *
 * check(new A()) // { abc: 'expected type: string, actual type: number.' }
 *
 * // The usage of options.recursive
 * class B {
 *   a = new A()
 * }
 *
 * check(new B()) // null
 * check(new B(), { recursive: true }) // { a: { abc: 'expected type: string, actual type: number.' } }
 */
function walliDecorator(walliInstance) {
  if (!isValidWalli(walliInstance)) {
    throw new TypeError('walli-decorator: walliInstance requires the instanceof walli.Verifiable. but ' + walliInstance);
  }

  return function walliDecoratorInner(target, key, descriptor) {
    // Firstly!
    if (typeof target[WALLI_COLLECTION_NAME] === 'undefined') {
      Object.defineProperty(target, WALLI_COLLECTION_NAME, {
        value: {},
        enumerable: false,
        configurable: true
      });
    }
    // inheritance
    else {
        // set to Prototype
        Object.defineProperty(target, WALLI_COLLECTION_NAME, {
          value: (0, _extends3.default)({}, target[WALLI_COLLECTION_NAME]),
          enumerable: false,
          configurable: true
        });
      }

    var walliCollection = target[WALLI_COLLECTION_NAME];
    walliCollection[key] = walliInstance;

    return descriptor;
  };
}

exports.default = walliDecorator;