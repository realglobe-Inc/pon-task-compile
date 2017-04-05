/**
 * Test case for byPattern.
 * Runs with mocha.
 */
'use strict'

const byPattern = require('../lib/by_pattern.js')
const ponContext = require('pon-context')
const { ok } = require('assert')
const co = require('co')

describe('by-pattern', function () {
  this.timeout(3000)

  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('By pattern', () => co(function * () {
    let ctx = ponContext()
    let task = byPattern(
      __dirname,
      `${__dirname}/../tmp/testing-compiled-by-pattern`,
      (content) => String(content).split('').reverse().join(''),
      {
        pattern: '*.js'
      }
    )
    ok(task)

    let results = yield Promise.resolve(task(ctx))
    ok(results)
  }))
})

/* global describe, before, after, it */
