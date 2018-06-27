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

const path = require('path')
const minimatch = require('minimatch')
const aglob = require('aglob')
const watch = require('pon-task-watch')
const define = require('./define')

/** @lends byPattern */
function byPattern (srcDir, destDir, compiler, options = {}) {
  const {
    pattern = '**/*.*',
    namer = (filename) => filename,
    watchDelay = 100,
    watchTargets = [],
    stream = false,
    ...otherOptions
  } = options

  const resolvePaths = (filename) => ({
    src: path.resolve(srcDir, filename),
    dest: path.resolve(destDir, namer(filename))
  })

  async function task (ctx) {
    const filenames = await aglob(pattern, {cwd: srcDir})
    const results = await Promise.all(
      filenames.map((filename) => {
        const {src, dest} = resolvePaths(filename)
        return define(src, dest, compiler, {stream, ...otherOptions})(ctx)
      })
    )
    return results
  }

  return Object.assign(task,
    {
      watch: async (ctx) => {
        const srcPattern = [].concat(pattern).filter(Boolean).map((pattern) => path.join(srcDir, pattern))
        const targets = [].concat(
          watchTargets,
          srcPattern
        ).filter((filename, i, arr) => arr.indexOf(filename) === i)
        return watch(
          targets,
          async (event, changed) => {
            const isSrc = srcPattern.some((srcPattern) => minimatch(changed, srcPattern))
            const filenames = [].concat(isSrc ? changed : (await aglob(srcPattern))).filter(Boolean)
            for (const filename of filenames) {
              const {src, dest} = resolvePaths(path.relative(srcDir, filename))
              try {
                define(src, dest, compiler, {stream, watching: true, ...otherOptions})(ctx)
              } catch (err) {
                console.error(err)
              }
            }
          },
          {
            delay: watchDelay
          }
        )(ctx)
      }
    }
  )
}

module.exports = byPattern
