var _ = require('lodash');
var chalk = require('chalk');
var spawn = require('child_process').spawn;

var getNextColorFn = (function(){
  var colors = [
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
    if(i >= colors.length){
      i = 0;
    }
    return chalk[colors[i]];
  };
}());

var hasDuplicats = function(names){
  return names.length !== _.unique(names).length;
};

var toTaskIDs = function(names){
  if(!hasDuplicats(names)){
    return names;
  }
  var next_i_for = {};
  return _.map(names, function(name){
    next_i_for[name] = _.has(next_i_for, name) ? next_i_for[name] + 1 : 0;
    return name + '.' + next_i_for[name];
  });
};

var toScriptNamesToTasks = function(npm_script_names){
  var task_ids = toTaskIDs(npm_script_names);
  var pad_len = _.max(_.map(task_ids, _.size));

  return _.object(_.map(task_ids, function(task_id, i){
    var colorFn = getNextColorFn();
    return [task_id, {
      script_name: npm_script_names[i],
      colorFn: colorFn,
      prefixer: function(){
        return colorFn((new Date()).toString().substr(16, 8) + ' ' + task_id  + _.repeat(' ', pad_len - task_id.length) + ' | ');
      }
    }];
  }));
};

var toLines = function(str){
  return _.reject(String(str && str.toString()).split("\n"), function(line){
    return line.trim().length === 0;
  });
};

module.exports = function(npm_script_names){
  var tasks = toScriptNamesToTasks(npm_script_names);

  _.each(tasks, function(task, task_id){
    task.proc = spawn('npm', ['run', task.script_name], {
      env: process.env
    }).on('close', function(code){
      task.done = true;
      code = code ? (code.code || code) : code;
      if(code !== 0){
        console.log('********');
        console.log('****', task.colorFn(task_id), chalk.red('exited with error'), code);
        console.log('********');
      }else{
        console.log('********');
        console.log('****', task.colorFn(task_id), 'finished');
        console.log('********');
      }
    });
    task.proc.stdout.on('data', function(data){
      _.each(toLines(data), function(line){
        console.log(task.prefixer(), line);
      });
    });
    task.proc.stderr.on('data', function(data){
      _.each(toLines(data), function(line){
        console.error(task.prefixer(), chalk.red(line));
      });
    });
  });

  process.on('SIGINT', function(){
    console.log("\n***************************************");
    _.each(tasks, function(task, task_id){
      if(task.done){
        return;
      }
      task.proc.removeAllListeners('close');
      task.proc.kill('SIGINT');
      console.log('**** killing ', task.colorFn(task_id));
    });
    console.log('**** good bye');
    process.exit(0);
  });
};
