/**
 * Define compile task by pattern
 * @function byPattern
 * @param {string} srcDir - Source directory name
 * @param {string} destDir - Destination directory name
 * @param {function} compiler - Compiler function
 * @param {Object} [options={}] - Optional settings
 * @param {string|string[]} [options.pattern] - File name pattern
 * @param {number} [options.watchDelay=100] - Delay after watch
 * @param {function} [options.namer] - Filename convert function
 */
'use strict'

const co = require('co')
const path = require('path')
const aglob = require('aglob')
const watch = require('pon-task-watch')
const define = require('./define')

/** @lends byPattern */
function byPattern (srcDir, destDir, compiler, options = {}) {
  let {
    pattern = '**/*.*',
    namer = (filename) => filename,
    watchDelay = 100
  } = options

  const resolvePaths = (filename) => ({
    src: path.resolve(srcDir, filename),
    dest: path.resolve(destDir, namer(filename))
  })

  function task (ctx) {
    return co(function * () {
      let filenames = yield aglob(pattern, { cwd: srcDir })
      let results = []
      for (let filename of filenames) {
        const { src, dest } = resolvePaths(filename)
        let result = yield define(src, dest, compiler)(ctx)
        results.push(result)
      }
      return results
    })
  }

  return Object.assign(task,
    {
      watch: (ctx) => co(function * () {
        return watch(
          [].concat(pattern).map((pattern) => path.join(srcDir, pattern)),
          (event, changed) => {
            let filename = path.relative(srcDir, changed)
            const { src, dest } = resolvePaths(filename)
            define(src, dest, compiler)(ctx)
          },
          {
            delay: watchDelay
          }
        )(ctx)
      })
    }
  )
}

module.exports = byPattern
