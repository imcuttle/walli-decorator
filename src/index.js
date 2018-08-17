/**
 * @file index
 * @author imcuttle
 * @description
 */
import { Verifiable, UnlawfulnessList, Unlawfulness } from 'walli'

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
    returnFailString = true
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
        console.error(`walliDecorator: the walli instance of "${name}" is not an valid walli, instead of ${mayWalli}`)
        continue
      }

      if (
        (ignoreNotHasVal && !(name in target)) ||
        (ignoreValIsUndefined && typeof ignoreValIsUndefined === 'undefined')
      ) {
        continue
      }

      let result = mayWalli.check(target[name])
      if (result && !result.ok) {
        failMap[name] = returnFailString ? result.toString() : result

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
