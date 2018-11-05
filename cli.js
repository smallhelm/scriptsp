var scriptsP = require('./')

var errorOut = function (msg) {
  console.error('[error]', msg)
  process.exit(1)
}

try {
  var packageJson = require(process.cwd() + '/package.json')
} catch (e) {
  errorOut('must be run in the same working directory as your package.json')
}
var scripts = (packageJson && packageJson.scripts) || {}

var raw = false
var npmScriptNames = []

process.argv.slice(2).forEach(function (script) {
  if (script === '-r' || script === '--raw') {
    raw = true
    return
  }
  if (!scripts.hasOwnProperty(script)) {
    errorOut('"' + script + '" not found in package.json scripts')
    return
  }
  npmScriptNames.push(script)
})

if (npmScriptNames.length === 0) {
  console.log()
  console.log('USAGE: scriptsp [--raw] <script1> <script2> ...')
  console.log()
  console.log('    -r, --raw')
  console.log('        simply pipe the output from the scripts, no fancy output stuff')
  console.log()
  console.log('i.e.')
  console.log('    $ scriptsp start test watch-js')
  console.log()
  process.exit(0)
}

scriptsP(npmScriptNames, raw)
