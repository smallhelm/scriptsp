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
      return style((new Date()).toString().substr(16, 8) + ' '  + _.repeat(' ', pad_len - name.length) + name + ' | ');
    };
  });
};

var toLines = function(str){
  return _.reject(_.map(String(str && str.toString()).split("\n"), function(line){
    return line.trim();
  }), _.isEmpty);
};

module.exports = function(npm_tasks){
  var prefixers = makePrefixers(npm_tasks);

  var spawned_tasks = {};

  _.each(npm_tasks, function(task, id){
    var prefixer = prefixers[id];

    var spawned = spawned_tasks[id] = spawn('npm', ['run', task], {
      env: process.env
    }).on('close', function(code){
      delete spawned_tasks[id];
      code = code ? (code.code || code) : code;
      if(code !== 0){
        console.log('********');
        console.log('****', chalk.red('exited with error'), code, prefixer());
        console.log('********');
      }else{
        console.log('********');
        console.log('****', prefixer(), chalk.green('finished'), code);
        console.log('********');
      }
    });
    spawned.stdout.on('data', function(data){
      _.each(toLines(data), function(line){
        console.log(prefixer(), line);
      });
    });
    spawned.stderr.on('data', function(data){
      _.each(toLines(data), function(line){
        console.log(prefixer(), chalk.red(line));
      });
    });
  });

  process.on('SIGINT', function(){
    _.each(spawned_tasks, function(task, id){
      task.removeAllListeners('close');
      task.kill('SIGINT');
      console.log('********');
      console.log('**** killing ', prefixers[id]());
      console.log('********');
    });
    console.log('********');
    console.log('**** good bye');
    console.log('********');
    process.exit(0);
  });
};
