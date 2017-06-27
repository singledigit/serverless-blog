#!/usr/bin/env node
const shell = require('shelljs');

let command = shell.exec('ls', {silent: true});

if (command.code !== 0) {
    shell.echo(`INSTALL_ERROR: ${command.stderr} on Service: ${process.env.SERVICE}`);
    shell.exit(command.code);
}
