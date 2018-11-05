var _ = require('lodash')
var chalk = require('chalk')
var spawn = require('child_process').spawn

var getNextColorFn = (function () {
  var colors = [
    'green',
    'yellow',
    'blue',
    'magenta',
    'cyan',
    'gray'
  ]
  var i = -1
  return function () {
    i++
    if (i >= colors.length) {
      i = 0
    }
    return chalk[colors[i]]
  }
}())

var hasDuplicats = function (names) {
  return names.length !== _.uniq(names).length
}

var toTaskIDs = function (names) {
  if (!hasDuplicats(names)) {
    return names
  }
  var nextIfor = {}
  return _.map(names, function (name) {
    nextIfor[name] = _.has(nextIfor, name) ? nextIfor[name] + 1 : 0
    return name + '.' + nextIfor[name]
  })
}

var toScriptNamesToTasks = function (npmScriptNames) {
  var taskIds = toTaskIDs(npmScriptNames)
  var padLen = _.max(_.map(taskIds, _.size))

  return _.fromPairs(_.map(taskIds, function (taskId, i) {
    var colorFn = getNextColorFn()
    return [taskId, {
      script_name: npmScriptNames[i],
      colorFn: colorFn,
      prefixer: function () {
        return colorFn((new Date()).toString().substr(16, 8) + ' ' + taskId + _.repeat(' ', padLen - taskId.length) + ' | ')
      }
    }]
  }))
}

var toLines = function (str) {
  return _.reject(String(str && str.toString()).split('\n'), function (line) {
    return line.trim().length === 0
  })
}

module.exports = function (npmScriptNames, raw) {
  var tasks = toScriptNamesToTasks(npmScriptNames)

  _.each(tasks, function (task, taskId) {
    task.proc = spawn('npm', ['run', task.script_name], {
      env: process.env,
      stdio: raw ? 'inherit' : 'pipe'
    }).on('close', function (code) {
      task.done = true
      if (raw) {
        return
      }
      code = code ? (code.code || code) : code
      if (code !== 0) {
        console.log('********')
        console.log('****', task.colorFn(taskId), chalk.red('exited with error'), code)
        console.log('********')
      } else {
        console.log('********')
        console.log('****', task.colorFn(taskId), 'finished')
        console.log('********')
      }
    })
    if (raw) {
      return
    }
    task.proc.stdout.on('data', function (data) {
      _.each(toLines(data), function (line) {
        console.log(task.prefixer(), line)
      })
    })
    task.proc.stderr.on('data', function (data) {
      _.each(toLines(data), function (line) {
        console.error(task.prefixer(), chalk.red(line))
      })
    })
  })

  process.on('SIGINT', function () {
    if (raw) {
      return
    }
    console.log('\n***************************************')
    _.each(tasks, function (task, taskId) {
      if (task.done) {
        return
      }
      task.proc.removeAllListeners('close')
      task.proc.kill('SIGINT')
      console.log('**** killing ', task.colorFn(taskId))
    })
    console.log('**** good bye')
    process.exit(0)
  })
}
