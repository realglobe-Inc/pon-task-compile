/**
 * Pon task to compile file
 * @module pon-task-compile
 * @version 4.0.0
 */

'use strict'

const define = require('./define')
const byPattern = require('./by_pattern')

let lib = define.bind(this)

Object.assign(lib, define, {
  define,
  byPattern
})

module.exports = lib
