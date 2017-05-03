/**
 * Define compile task by pattern
 * @function byPattern
 * @param {string} srcDir - Source directory name
 * @param {string} destDir - Destination directory name
 * @param {function} compiler - Compiler function
 * @param {Object} [options={}] - Optional settings
 * @param {string|string[]} [options.pattern] - File name pattern
 * @param {number} [options.watchDelay=100] - Delay after watch
 * @param {string[]} [options.watchTargets=[]] - Additional watch target filenames
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
    watchDelay = 100,
    watchTargets = [],
    stream = false
  } = options

  const resolvePaths = (filename) => ({
    src: path.resolve(srcDir, filename),
    dest: path.resolve(destDir, namer(filename))
  })

  function task (ctx) {
    return co(function * () {
      let filenames = yield aglob(pattern, { cwd: srcDir })
      let results = yield Promise.all(
        filenames.map((filename) => {
          const { src, dest } = resolvePaths(filename)
          return define(src, dest, compiler, { stream })(ctx)
        })
      )
      return results
    })
  }

  return Object.assign(task,
    {
      watch: (ctx) => co(function * () {
        let targets = [].concat(
          watchTargets,
          [].concat(pattern).map((pattern) => path.join(srcDir, pattern))
        ).filter((filename, i, arr) => arr.indexOf(filename) === i)
        return watch(
          targets,
          (event, changed) => {
            let filename = path.relative(srcDir, changed)
            const { src, dest } = resolvePaths(filename)
            define(src, dest, compiler, { stream })(ctx)
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
