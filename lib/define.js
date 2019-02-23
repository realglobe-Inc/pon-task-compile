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

const fs = require('fs')
const path = require('path')
const { readFileAsync, existsAsync, statAsync } = require('asfs')

/** @lends define */
function define(src, dest, compiler, options = {}) {
  const {
    stream = false,
    watching = false,
    skipIfIdentical = true,
    force = false,
  } = options

  async function task(ctx) {
    const {
      logger,
      writer,
      mapExt = '.map',
      cwd = process.cwd(),
    } = ctx

    const read = async (filename) => {
      const exists = await existsAsync(filename)
      if (!exists) {
        return null
      }
      try {
        if (stream) {
          return fs.createReadStream(filename)
        } else {
          return readFileAsync(filename)
        }
      } catch (e) {
        console.log(e)
        return null
      }
    }

    const write = async (filename, content) => {
      if (!content) {
        return
      }
      const written = await writer.write(filename, content, {
        skipIfIdentical,
        mkdirp: true
      })
      if (written.skipped) {
        return null
      }
      logger.debug('File generated:', written.filename)
      return written.filename
    }

    if (!force) {
      const srcStat = await statAsync(src).catch(() => null)
      const destStat = await statAsync(dest).catch(() => null)
      const shouldSkip = !!srcStat && !!destStat && srcStat.mtime <= destStat.mtime
      if (shouldSkip) {
        return [null, null]
      }
    }
    const content = await read(src)
    const inMap = await read(src && src + mapExt)
    const [compiled, outMap] = [].concat(await Promise.resolve(compiler(content, inMap, {
      src,
      dest,
      cwd,
      ctx,
      watching
    })))
    return [
      await write(dest, compiled),
      await write(dest + mapExt, outMap)
    ]
      .filter(Boolean)
      .map((filename) => path.relative(cwd, filename))
  }

  return Object.assign(task,
    // Define sub tasks here
    {}
  )
}

module.exports = define


