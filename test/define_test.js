/**
 * Test case for define.
 * Runs with mocha.
 */
'use strict'

const define = require('../lib/define.js')
const ponContext = require('pon-context')
const {ok} = require('assert')
const co = require('co')

describe('define', function () {
  this.timeout(3000)

  before(() => co(function * () {

  }))

  after(() => co(function * () {

  }))

  it('Define', async () => {
    let ctx = ponContext()
    let task = define(
      __filename,
      `${__dirname}/../tmp/testing-compiled`,
      (content) => String(content).split('').reverse().join(''),
      {}
    )
    ok(task)

    let results = await Promise.resolve(task(ctx))
    ok(results)
  })
})

/* global describe, before, after, it */
