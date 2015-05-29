var _ = require('lodash');
var chalk = require('chalk');
var spawn = require('child_process').spawn;

var getNextStyle = (function(){
  var styles = [
    'green',
    'yellow',
    'blue',
    'magenta',
    'cyan',
    'gray'
  ];
  var i = -1;
  return function(){
    i++;
    if(i >= styles.length){
      i = 0;
    }
    return chalk[styles[i]];
  };
}());

var makePrefixers = function(names){
  var pad_len = _.max(_.map(names, _.size));

  return _.mapValues(names, function(name, id){
    var style = getNextStyle();
    return function(){
      return style((new Date()).toString().substr(16, 8) + ' ['  + _.repeat(' ', pad_len - name.length) + name + ']');
    };
  });
};

module.exports = function(npm_tasks){
  var prefixers = makePrefixers(npm_tasks);

  var spawned_tasks = {};

  _.each(npm_tasks, function(task, id){
    var prefixer = prefixers[id];

    spawned_tasks[id] = spawn('npm', ['run', task], {
      cwd: process.cwd,
      env: process.env,
      stdio: [
        0,
        process.stdout,
        process.stderr
      ]
    }).on('close', function(code){
      delete spawned_tasks[id];
      code = code ? (code.code || code) : code;
      if(code !== 0){
        console.log('****', chalk.red('exited with error'), code, prefixer());
      }else{
        console.log('****', chalk.green('finished'), code, prefixer());
      }
    });
  });

  process.on('SIGINT', function(code){
    _.each(spawned_tasks, function(task, id){
      task.removeAllListeners('close');
      task.kill('SIGINT');
      console.log('**** killing ', prefixers[id]());
    });
    console.log('**** good bye');
    process.exit(code);
  });
};
