const EventEmitter = require('events');
const spawn = require('cross-spawn');

const tasks = {};
const taskEvents = new EventEmitter();

module.exports = {
  detectAndRunEntryTask,
  tasks,
  taskEvents,
  createTask,
  runTask,
  composeSeries,
  composeParallel,
  runInChildProcess,
};

const { setupTaskDisplay } = require('./display');

function detectAndRunEntryTask() {
  // get requested task name and execute
  const taskName = process.argv[2];
  if (!taskName) {
    throw new Error(`MetaMask build: No task name specified`);
  }
  const skipStats = process.argv.includes('--skip-stats');

  runTask(taskName, { skipStats });
}

async function runTask(taskName, { skipStats } = {}) {
  if (!(taskName in tasks)) {
    throw new Error(`MetaMask build: Unrecognized task name "${taskName}"`);
  }
  if (!skipStats) {
    setupTaskDisplay(taskEvents);
    console.log(`running task "${taskName}"...`);
  }
  try {
    await tasks[taskName]();
  } catch (err) {
    console.error(
      `MetaMask build: Encountered an error while running task "${taskName}".`,
    );
    console.error(err);
    process.exit(1);
  }
  taskEvents.emit('complete');
}

function createTask(taskName, taskFn) {
  if (taskName in tasks) {
    throw new Error(
      `MetaMask build: task "${taskName}" already exists. Refusing to redefine`,
    );
  }
  const task = instrumentForTaskStats(taskName, taskFn);
  task.taskName = taskName;
  tasks[taskName] = task;
  return task;
}

function runInChildProcess(task) {
  const taskName = typeof task === 'string' ? task : task.taskName;
  if (!taskName) {
    throw new Error(
      `MetaMask build: runInChildProcess unable to identify task name`,
    );
  }
  return instrumentForTaskStats(taskName, async () => {
    let childProcess;
    // don't run subprocesses in lavamoat for dev mode if main process not run in lavamoat
    if (
      taskName.includes('scripts:core:dev') &&
      !process.argv[0].includes('lavamoat')
    ) {
      childProcess = spawn('yarn', ['build:dev', taskName, '--skip-stats'], {
        env: process.env,
      });
    } else {
      childProcess = spawn('yarn', ['build', taskName, '--skip-stats'], {
        env: process.env,
      });
    }
    // forward logs to main process
    // skip the first stdout event (announcing the process command)
    childProcess.stdout.once('data', () => {
      childProcess.stdout.on('data', (data) =>
        process.stdout.write(`${taskName}: ${data}`),
      );
    });
    childProcess.stderr.on('data', (data) =>
      process.stderr.write(`${taskName}: ${data}`),
    );
    // await end of process
    await new Promise((resolve, reject) => {
      childProcess.once('exit', (errCode) => {
        if (errCode !== 0) {
          reject(
            new Error(
              `MetaMask build: runInChildProcess for task "${taskName}" encountered an error ${errCode}`,
            ),
          );
          return;
        }
        resolve();
      });
    });
  });
}

function instrumentForTaskStats(taskName, asyncFn) {
  return async () => {
    const start = Date.now();
    taskEvents.emit('start', [taskName, start]);
    await asyncFn();
    const end = Date.now();
    taskEvents.emit('end', [taskName, start, end]);
  };
}

function composeSeries(...subtasks) {
  return async () => {
    const realTasks = subtasks;
    for (const subtask of realTasks) {
      await subtask();
    }
  };
}

function composeParallel(...subtasks) {
  return async () => {
    const realTasks = subtasks;
    await Promise.all(realTasks.map((subtask) => subtask()));
  };
}
