'use strict'

const pon = require('pon')
const compile = require('pon-task-compile')

async function tryExample () {
  let run = pon({
    'compile:foo': compile('src/foo.txt', 'dest/bar.txt', (src, dest) => {
      let compiled = '...'
      let map = '...'
      return [ compiled, map ]
    })
  })

  run('compile:foo')
}

tryExample()
