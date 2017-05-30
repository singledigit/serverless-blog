#!/usr/bin/env node
const shell = require('shelljs');

// If Agent Service then run Agent and exit
if(process.env.SERVICE === "agent-service"){
    // need to run CICD Service Agent
    let agentCommand = shell.exec(`./bin/update-cicd.js`);

    if(agentCommand.code !== 0){
        shell.echo('AGENT_ERROR Problem building CICD Services');
        shell.exit(1)
    }
    shell.exit(0);
}
