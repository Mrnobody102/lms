#!/usr/bin/env node
/* eslint-disable no-undef */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEFAULT_PORTS = [3000, 3001, 3002, 3100, 3101, 3102, 4000];
const repoRoot = path.resolve(__dirname, '..').toLowerCase();
const stopped = new Set();

const args = process.argv.slice(2);
const quiet = args.includes('--quiet');
const ports = args
  .filter((arg) => /^\d+$/.test(arg))
  .map((arg) => Number.parseInt(arg, 10))
  .filter((port) => Number.isInteger(port) && port > 0);

function writeInfo(message) {
  if (!quiet) {
    console.log(message);
  }
}

function run(command, commandArgs) {
  return spawnSync(command, commandArgs, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function commandExists(command) {
  const result = run(process.platform === 'win32' ? 'where' : 'which', [command]);
  return result.status === 0;
}

function stopWithPowerShell() {
  const shell = commandExists('pwsh') ? 'pwsh' : commandExists('powershell') ? 'powershell' : null;
  if (!shell) {
    throw new Error('Neither pwsh nor powershell is available for Windows process cleanup.');
  }

  const script = path.join(__dirname, 'stop-project-processes.ps1');
  const result = spawnSync(shell, ['-ExecutionPolicy', 'Bypass', '-File', script, ...args], {
    stdio: 'inherit',
  });
  process.exit(result.status ?? 1);
}

function getListeningProcessIds(port) {
  if (commandExists('lsof')) {
    const result = run('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t']);
    if (result.status === 0 || result.stdout.trim()) {
      return parseProcessIds(result.stdout);
    }
  }

  if (commandExists('ss')) {
    const result = run('ss', ['-ltnp', `sport = :${port}`]);
    return Array.from(result.stdout.matchAll(/pid=(\d+)/g), (match) =>
      Number.parseInt(match[1], 10),
    );
  }

  writeInfo(`Port ${port}: cannot inspect listeners because neither lsof nor ss is available`);
  return [];
}

function parseProcessIds(value) {
  return value
    .split(/\s+/)
    .map((item) => Number.parseInt(item, 10))
    .filter((pid) => Number.isInteger(pid) && pid > 0);
}

function getProcessCommandLine(pid) {
  const cmdlinePath = `/proc/${pid}/cmdline`;
  if (fs.existsSync(cmdlinePath)) {
    return fs.readFileSync(cmdlinePath).toString('utf8').replace(/\0/g, ' ').trim();
  }

  const result = run('ps', ['-p', String(pid), '-o', 'command=']);
  return result.stdout.trim();
}

function stopProcess(pid, port) {
  if (stopped.has(pid)) {
    writeInfo(`Port ${port}: PID ${pid} already stopped`);
    return;
  }

  const commandLine = getProcessCommandLine(pid);
  if (!commandLine.toLowerCase().includes(repoRoot)) {
    writeInfo(`Port ${port}: skipped PID ${pid} because it is not owned by this repo`);
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
    stopped.add(pid);
    writeInfo(`Port ${port}: stopped PID ${pid}`);
  } catch (error) {
    if (error && error.code === 'ESRCH') {
      writeInfo(`Port ${port}: PID ${pid} no longer exists`);
      return;
    }
    throw error;
  }
}

if (process.platform === 'win32') {
  stopWithPowerShell();
}

for (const port of ports.length > 0 ? ports : DEFAULT_PORTS) {
  const processIds = Array.from(new Set(getListeningProcessIds(port)));
  if (processIds.length === 0) {
    writeInfo(`Port ${port}: free`);
    continue;
  }

  for (const pid of processIds) {
    stopProcess(pid, port);
  }
}
