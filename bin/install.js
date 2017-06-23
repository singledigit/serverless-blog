#!/usr/bin/env node
const shell = require('shelljs');

let command = shell.exec('foo');

if (command.code !== 0) {
    shell.echo('INSTALL_ERROR: Error installing stuff');
    shell.exit(command.code);
}