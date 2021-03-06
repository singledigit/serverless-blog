//@ts-check

const _ = require('lodash');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();
const table = new AWS.DynamoDB.DocumentClient({ service: dynamodb });

export const handler = (event, context, callback) => {

    const responseBody = {
        message: "My Lambda Worked Again Through the CICD even though I broke my own rule"
    };

    let response = {
        statusCode: 200,
        body: JSON.stringify(responseBody)
    };

    callback(null, response);
}