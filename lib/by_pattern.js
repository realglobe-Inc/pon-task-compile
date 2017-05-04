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
const minimatch = require('minimatch')
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
        let srcPattern = [].concat(pattern).filter(Boolean).map((pattern) => path.join(srcDir, pattern))
        let targets = [].concat(
          watchTargets,
          srcPattern
        ).filter((filename, i, arr) => arr.indexOf(filename) === i)
        return watch(
          targets,
          (event, changed) => co(function * () {
            let isSrc = srcPattern.some((srcPattern) => minimatch(changed, srcPattern))
            let filenames = [].concat(isSrc ? changed : (yield aglob(srcPattern))).filter(Boolean)
            for (let filename of filenames) {
              const { src, dest } = resolvePaths(path.relative(srcDir, filename))
              define(src, dest, compiler, { stream })(ctx)
            }
          }).catch((err) => console.error(err)),
          {
            delay: watchDelay
          }
        )(ctx)
      })
    }
  )
}

module.exports = byPattern
