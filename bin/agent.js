#!/usr/bin/env node
//@ts-check
require('dotenv').config();
const client = require('./client');
const fs = require('fs');
const _ = require('lodash');
let stacks, localServices, deployedStacks, deployedServices, toBeDeployed, toBeUpdated, toBeDeleted, tokens;

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
                ParameterKey: 'GitHubOwner',
                ParameterValue: process.env.GITHUB_OWNER
            },
            {
                ParameterKey: 'GitHubToken',
                ParameterValue: tokens.Parameters[0].Value
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

console.log("Local Services", localServices);

// get token from param store
let tokenParams = {
    Names: ['GITHUB_TOKEN'],
    WithDecryption: true
}

client.getParameters(tokenParams)
    .then(response => {
        tokens = response;

        // get deployed stacks
        let cfParams = {
            StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE']
        }
        return client.listStacks(cfParams)
    })
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
            console.log("Deploying Stack: ", response.StackId);
        })

        let calls = [];

        toBeDeleted.forEach(service => {
            console.log(`Deleteing service ${service}`);
            calls.push(client.deleteStack(service));
        })

        return Promise.all(calls)
    })
    .then(responses => {
        let calls = [];

        toBeUpdated.forEach(service => {
            calls.push(client.updateStack(createParams(service)));
        })

        return Promise.all(calls)
    })
    .then(responses => {
        responses.forEach(response => {
            console.log("Updating Stack: ", response.StackId);
        })
    })
    .catch(error => {
        console.log(error.message);
    })