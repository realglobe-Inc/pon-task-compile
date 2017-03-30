/**
 * Define task
 * @function define
 * @param {string} src - Source filename
 * @param {string} dest - Destination filename
 * @param {function} compiler - Compiler function
 * @param {Object} [options={}] - Optional settings
 * @returns {function} Defined task
 */
'use strict'

const co = require('co')
const path = require('path')
const { readFileAsync, existsAsync } = require('asfs')

/** @lends define */
function define (src, dest, compiler, options = {}) {
  function task (ctx) {
    const {
      logger,
      writer,
      mapExt = '.map',
      cwd = process.cwd()
    } = ctx

    const read = (filename) => co(function * () {
      let exists = yield existsAsync(filename)
      if (!exists) {
        return null
      }
      try {
        return readFileAsync(filename)
      } catch (e) {
        console.log(e)
        return null
      }
    })

    const write = (filename, content) => co(function * () {
      if (!content) {
        return
      }
      let written = yield writer.write(filename, content, {
        skipIfIdentical: true,
        mkdirp: true
      })
      if (written.skipped) {
        return null
      }
      logger.debug('File generated:', written.filename)
      return written.filename
    })

    return co(function * () {
      let content = yield read(src)
      let inMap = yield read(src + mapExt)
      let [ compiled, outMap ] = [].concat(yield Promise.resolve(compiler(content, inMap, { src, dest })))
      return [
        yield write(dest, compiled),
        yield write(dest + mapExt, outMap)
      ]
        .filter(Boolean)
        .map((filename) => path.relative(cwd, filename))
    })
  }

  return Object.assign(task,
    // Define sub tasks here
    {}
  )
}

module.exports = define


