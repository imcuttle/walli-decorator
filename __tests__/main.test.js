/**
 * @file main
 * @author imcuttle
 * @date 2018/4/4
 */
const { default: walli, check } = require('../src')
const w = require('walli')
const decorate = require('decorate-properties')

it('should normal passed', function() {
  class Person {
    @walli(w.string) name = 'imcuttle'
    @walli(w.number) age = 19
    @walli(w.oneOf(['M', 'F']))
    gender = 'X'
  }

  const person = new Person()
  expect(check(person)).toEqual({ gender: "expected: oneOf(['M', 'F']), actual: 'X'." })

  person.age = 's123'
  expect(check(person)).toEqual({
    age: 'expected type: number, actual type: string.',
    gender: "expected: oneOf(['M', 'F']), actual: 'X'."
  })

  class MyPerson extends Person {
    @walli(w.string) age = 'abc'
  }
  // without side effect
  expect(check(person)).toEqual({
    age: 'expected type: number, actual type: string.',
    gender: "expected: oneOf(['M', 'F']), actual: 'X'."
  })

  expect(check(new MyPerson())).toEqual({
    gender: "expected: oneOf(['M', 'F']), actual: 'X'."
  })
})

it('should be executed recursively', function() {
  class Person {
    @walli(w.string) name = 'imcuttle'
    @walli(w.number) age = 19
    @walli(w.oneOf(['M', 'F']))
    gender = 'X'
  }

  class Family {
    constructor(headCount) {
      headCount && (this.headCount = headCount)
    }

    @walli(w.strictNumber) headCount = '123'

    son = new Person()
  }

  expect(check(new Family(), { recursive: false })).toEqual({
    headCount: 'expected type: StrictNumber, actual type: string.'
  })

  expect(check(new Family(12), { recursive: true })).toEqual({
    son: { gender: "expected: oneOf(['M', 'F']), actual: 'X'." }
  })
})

// error handle
it('should thrown error when @wall nothing', function() {
  expect(() => {
    const decorator = walli()
  }).toThrow(new TypeError('walli-decorator: walliInstance requires the instanceof walli.Verifiable. but undefined'))

  expect(() => {
    const decorator = walli({})
  }).toThrow(
    new TypeError('walli-decorator: walliInstance requires the instanceof walli.Verifiable. but [object Object]')
  )
})

// check handle
it('check: abortWhenFail', function() {
  class Person {
    constructor({ son, ...props } = {}) {
      Object.assign(this, props)
      son && (this.son = new Person(son))
    }

    @walli(w.string) name = 'imcuttle'
    @walli(w.strictNumber) age = 19
    @walli(w.oneOf(['M', 'F']))
    gender = 'X'
  }

  expect(check(new Person({ age: '12', name: 123 }), { abortWhenFail: true })).toEqual({
    name: 'expected type: string, actual type: number.'
  })

  expect(check(new Person({ son: {} }), { abortWhenFail: true })).toEqual({
    gender: "expected: oneOf(['M', 'F']), actual: 'X'."
  })

  expect(check(new Person({ gender: 'M', son: { age: '' } }), { abortWhenFail: true, recursive: true })).toEqual({
    son: {
      age: 'expected type: StrictNumber, actual type: string.'
    }
  })

  expect(check(new Person({ gender: 'M', son: { age: '' } }), { abortWhenFail: false, recursive: true })).toEqual({
    // gender: "expected: oneOf(['M', 'F']), actual: 'X'.",
    son: {
      age: 'expected type: StrictNumber, actual type: string.',
      gender: "expected: oneOf(['M', 'F']), actual: 'X'."
    }
  })
})

it('check: excludes', function() {
  const obj = decorate(
    {
      number: '',
      string: '',
      abc: ''
    },
    {
      number: walli(w.strictNumber),
      string: walli(w.string),
      abc: walli(w.oneOf(['a', 'b', 'c']))
    }
  )

  expect(Object.keys(check(obj, { excludes: [] }))).toEqual(['number', 'abc'])
  expect(Object.keys(check(obj, { excludes: ['number'] }))).toEqual(['abc'])
})

it('check: includes', function() {
  const obj = decorate(
    {
      number: '',
      string: '',
      abc: ''
    },
    {
      number: walli(w.strictNumber),
      string: walli(w.string),
      abc: walli(w.oneOf(['a', 'b', 'c']))
    }
  )

  expect(Object.keys(check(obj, { includes: [] }))).toEqual(['number', 'abc'])
  expect(Object.keys(check(obj, { includes: ['number'] }))).toEqual(['number'])
})

it('check: order', function() {
  const obj = decorate(
    {
      number: '',
      string: '',
      abc: ''
    },
    {
      number: walli(w.strictNumber),
      string: walli(w.string),
      abc: walli(w.oneOf(['a', 'b', 'c']))
    }
  )

  expect(Object.keys(check(obj, { order: ['abc', 'number'] }))).toEqual(['abc', 'number'])
})

it('check: returnWalliResult', function() {
  const obj = decorate(
    {
      number: '',
      string: '',
      abc: ''
    },
    {
      number: walli(w.strictNumber),
      string: walli(w.string),
      abc: walli(w.oneOf(['a', 'b', 'c']))
    }
  )

  expect(check(obj, { returnWalliResult: true })).toMatchSnapshot()
})

it('check: ignoreValIsUndefined', function() {
  const obj = decorate(
    {
      number: '',
      string: '',
      abc: void 0
    },
    {
      number: walli(w.strictNumber),
      string: walli(w.string),
      abc: walli(w.oneOf(['a', 'b', 'c']))
    }
  )

  expect(Object.keys(check(obj, { ignoreValIsUndefined: true }))).toEqual(['number'])
  expect(Object.keys(check(obj, { ignoreValIsUndefined: false }))).toEqual(['number', 'abc'])
})

it('check: ignoreNotHasVal', function() {
  const obj = decorate(
    {
      number: '',
      string: '',
      abc: void 0
    },
    {
      number: walli(w.strictNumber),
      string: walli(w.string),
      abc: walli(w.oneOf(['a', 'b', 'c']))
    }
  )

  expect(Object.keys(check(obj, { ignoreNotHasVal: true, ignoreValIsUndefined: false }))).toEqual(['number', 'abc'])
  expect(Object.keys(check(obj, { ignoreNotHasVal: false, ignoreValIsUndefined: false }))).toEqual(['number', 'abc'])

  delete obj.abc
  expect(Object.keys(check(obj, { ignoreNotHasVal: true }))).toEqual(['number'])
  expect(Object.keys(check(obj, { ignoreNotHasVal: false, ignoreValIsUndefined: false }))).toEqual(['number', 'abc'])
})

