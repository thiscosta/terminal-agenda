#!/usr/bin/env node
import { start } from './main';

async function run(): Promise<void> {
  const command = process.argv[2];
  if (command === 'start') {
    await start();
    return;
  }
  console.log('Terminal Agenda\n\nUsage: thiscosta-terminal-agenda start');
}

run().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
