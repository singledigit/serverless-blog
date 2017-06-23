#!/usr/bin/env node
const shell = require('shelljs');

let command = shell.exec('foo', {silent: true});

if (command.code !== 0) {
    shell.echo(`INSTALL_ERROR: ${command.stderr}`);
    shell.exit(command.code);
}