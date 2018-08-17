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

it('should be executed recursively', function () {

  class Person {
    @walli(w.string) name = 'imcuttle'
    @walli(w.number) age = 19
    @walli(w.oneOf(['M', 'F']))w
    gender = 'X'
  }

  class Family {
    son = new Person()
  }
  // TODO
  console.log(check(new Family()))
})

