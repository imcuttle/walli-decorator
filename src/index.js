/**
 * @file index
 * @author imcuttle
 * @description
 */
import { Verifiable } from 'walli'

function makeSymbol(name) {
  return typeof Symbol === 'function' ? Symbol(name) : name
}

const WALLI_COLLECTION_NAME = makeSymbol('[[walli]]')

export function getWalliCollection(target) {
  if (!target) {
    return null
  }

  return target[WALLI_COLLECTION_NAME]
}

function isValidWalli(walliInstance) {
  return walliInstance instanceof Verifiable
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
export function check(
  target,
  {
    abortWhenFail = false,
    excludes = [],
    includes = [],
    order,
    ignoreValIsUndefined = true,
    ignoreNotHasVal = true,
    recursive = false,
    returnWalliResult = false
  } = {}
) {
  let collection = getWalliCollection(target)
  if (!collection && !recursive) {
    return null
  }

  let checkNameList = !includes || !includes.length ? Object.keys(recursive ? target : collection) : includes
  if (excludes && !!excludes.length) {
    checkNameList = checkNameList.filter(name => !excludes.includes(name))
  }
  if (order && !!order.length) {
    checkNameList = checkNameList.sort((nameA, nameB) => order.indexOf(nameA) - order.indexOf(nameB))
  }

  let failMap = {}
  for (let i = 0; i < checkNameList.length; i++) {
    const name = checkNameList[i]
    const mayWalli = collection && collection[name]

    if (!mayWalli && recursive) {
      const memberChecked = check.apply(this, [target[name]].concat([...arguments].slice(1)))
      if (memberChecked) {
        failMap[name] = memberChecked
        if (abortWhenFail) {
          break
        }
      }
    } else {
      if (process.env.NODE_ENV !== 'production' && !isValidWalli(mayWalli)) {
        console.error(`walli-decorator: The walli instance of "${name}" is not an valid walli, instead of ${mayWalli}`)
        continue
      }

      if (
        (ignoreNotHasVal && !(name in target)) ||
        (ignoreValIsUndefined && typeof target[name] === 'undefined')
      ) {
        continue
      }

      let result = mayWalli.check(target[name])
      if (result && !result.ok) {
        failMap[name] = !returnWalliResult ? result.toString() : result

        if (abortWhenFail) {
          break
        }
      }
    }
  }

  if (!Object.keys(failMap).length) {
    return null
  }
  Object.defineProperty(failMap, 'toString', {
    value: function() {
      let nameList = Object.keys(this)

      nameList.forEach(name => {
        this[name].toString()
      })
    },
    enumerable: false
  })
  return failMap
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
    throw new TypeError('walli-decorator: walliInstance requires the instanceof walli.Verifiable. but ' + walliInstance)
  }

  return function walliDecoratorInner(target, key, descriptor) {
    // Firstly!
    if (typeof target[WALLI_COLLECTION_NAME] === 'undefined') {
      Object.defineProperty(target, WALLI_COLLECTION_NAME, {
        value: {},
        enumerable: false,
        configurable: true
      })
    }
    // inheritance
    else {
      // set to Prototype
      Object.defineProperty(target, WALLI_COLLECTION_NAME, {
        value: { ...target[WALLI_COLLECTION_NAME] },
        enumerable: false,
        configurable: true
      })
    }

    let walliCollection = target[WALLI_COLLECTION_NAME]
    walliCollection[key] = walliInstance

    return descriptor
  }
}

export default walliDecorator
