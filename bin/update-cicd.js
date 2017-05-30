#!/usr/bin/env node

const shell = require('shelljs');
const fs = require('fs');
const _ = require('lodash');
let stacks, services, deployedServices, toBeDeployed, toBeUpdated;

// get stacks
let stackCommand = shell.exec(`aws cloudformation list-stacks`, { silent: true })

if (stackCommand.code !== 0) {
    shell.echo('Could not get current stacks from AWS')
    shell.exit(1);
} else {
    stacks = JSON.parse(stackCommand.stdout).StackSummaries;
}

// get local service names
services = fs.readdirSync('./').filter(item => {
    return item.indexOf('-service') > -1
});

// get deployed services
deployedServices = stacks.filter(item => {
    return _.endsWith(item.StackName, '-cicd') && (item.StackStatus === 'CREATE_COMPLETE' || item.StackStatus === 'UPDATE_COMPLETE')
})

toBeDeployed = _.difference(services, deployedServices.map(item => { return _.trimEnd(item.StackName, '-cicd') }));

toBeUpdated = _.intersection(services, deployedServices.map(item => { return _.trimEnd(item.StackName, '-cicd') }));

const callStack = (service, action) => {
    return new Promise((resolve, reject) => {
        let stackCommand = shell.exec(
            `aws cloudformation ${action}-stack --stack-name ${service}-cicd \
            --template-url https://s3.amazonaws.com/${process.env.CFT_BUCKET}/nested/api-pipeline.yml \
            --capabilities CAPABILITY_NAMED_IAM \
            --parameters ParameterKey=GitHubOwner,ParameterValue=${process.env.GITHUB_OWNER} \
            ParameterKey=Environment,ParameterValue=${process.env.ENVIRONMENT} \
            ParameterKey=Repo,ParameterValue=${process.env.REPO} \
            ParameterKey=Branch,ParameterValue=${process.env.BRANCH} \
            ParameterKey=GitHubToken,ParameterValue=${process.env.GITHUB_TOKEN} \
            ParameterKey=Service,ParameterValue=${service}`
        )

        if (stackCommand.code !== 0) reject(stackCommand.stderr);
        else resolve(stackCommand.stdout);
    })
}

const updateAll = () => {
    toBeUpdated.forEach(item => {
        shell.echo(`Updating ${item}-cicd`);
        callStack(item, 'update')
            .then(response => {
                shell.echo(`${item}-cicd is being updated`);
            })
            .catch(error => {
                shell.echo(`Could not update ${item}-cicd`);
            })
    })
}

const installNew = () => {
    if(toBeDeployed.length === 0 && process.argv[2] !== '--update') shell.echo(`There are no new services to deploy. Add '--update' to update current pipelines`);
    toBeDeployed.forEach(item => {
        shell.echo(`Deploying ${item}-cicd`);
        callStack(item, 'create')
            .then(response => {
                shell.echo(`${item}-cicd is being created`);
            })
            .catch(error => {
                shell.echo(`Could not create ${item}-cicd`);
            })
    });
    if (process.argv[2] === '--update') updateAll();
}

installNew();