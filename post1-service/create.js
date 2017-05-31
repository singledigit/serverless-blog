const _ = require('lodash');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB();
const table = new AWS.DynamoDB.DocumentClient({ service: dynamodb });

export const handler = (event, context, callback) => {
    let params = {
        TableName: process.env.POSTS_TABLE,
        Item: {
            "id": "12345",
            "category": "family",
            "body": "Tis is my post content",
        },
        ConditionExpression: 'attribute_not_exists(id)'
    }

    table.put(params, (err, data) => {
        if (err) {
            callback(err);
        }
        else {
            callback(null, { message: "It Worked", data: data });
        }
    })
}