#!/usr/bin/env node

const client = require('./client');
const fs = require('fs');
const _ = require('lodash');
let stacks, localServices, deployedStacks, deployedServices, toBeDeployed, toBeUpdated, toBeDeleted;

const createParams = (service) => {
    return {
        StackName: `${service}-cicd`,
        Capabilities: ['CAPABILITY_NAMED_IAM'],
        Parameters: [
            {
                ParameterKey: 'Service',
                ParameterValue: service
            },
            {
                ParameterKey: 'Environment',
                ParameterValue: process.env.ENVIRONMENT
            },
            {
                ParameterKey: 'GitHubOwner',
                ParameterValue: process.env.GITHUB_OWNER
            },
            {
                ParameterKey: 'GitHubToken',
                ParameterValue: process.env.GITHUB_TOKEN
            },
            {
                ParameterKey: 'Repo',
                ParameterValue: process.env.REPO
            },
            {
                ParameterKey: 'Branch',
                ParameterValue: process.env.BRANCH
            }
        ],
        TemplateURL: `https://s3.amazonaws.com/${process.env.CFT_BUCKET}/nested/api-pipeline.yml`
    };
}

// get local service names
localServices = fs.readdirSync('./').filter(item => {
    return item.indexOf('-service') > -1
});

// get stacks
let params = {
    StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE']
}

client.listStacks(params)
    .then(response => {
        stacks = response.StackSummaries

        // deployed services
        deployedStacks = stacks.filter(stack => { return _.endsWith(stack.StackName, '-cicd') });

        deployedServices = deployedStacks.map(stack => { return _.trimEnd(stack.StackName, '-cicd') })
        console.log("Deployed Services", deployedServices.sort());

        toBeDeployed = _.difference(localServices, deployedServices);
        console.log(`${toBeDeployed.length} Service(s) to be deployed`, toBeDeployed);

        toBeUpdated = _.intersection(localServices, deployedServices);
        console.log(`Checking ${toBeUpdated.length} Service(s) for updates`, toBeUpdated);

        toBeDeleted = _.difference(deployedServices, localServices);
        console.log(`${toBeDeleted.length} Service(s) to be deleted`, toBeDeleted);

        let calls = []

        toBeDeployed.forEach(service => {
            calls.push(client.createStack(createParams(service)));
        })

        return Promise.all(calls)
    })
    .then(responses => {
        responses.forEach(response => {
            console.log("Building Stack", response.StackId);
        })

        let calls = [];

        toBeUpdated.forEach(service => {
            calls.push(client.updateStack(createParams(service)));
        })

        return Promise.all(calls)
    })
    .then(responses => {
        responses.forEach(response => {
            console.log(response.message);
        })

        let calls = [];

        toBeDeleted.forEach(service => {
            calls.push(client.deleteStack(service));
        })

        return new Promise.all(calls)
    })
    .then(responses => {
        responses.forEach(response => {
            console.log(response.message);
        })
    })
    .catch(error => {
        console.log(error.message);
    })