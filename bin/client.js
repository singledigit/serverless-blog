//@ts-check
const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-southeast-1' });
const cf = new AWS.CloudFormation();
const s3 = new AWS.S3();
const cp = new AWS.CodePipeline();
const ssm = new AWS.SSM();

const getPipelineState = (params) => {
    return new Promise((resolve, reject) => {
        cp.getPipelineState(params, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        })
    })
}

const listStacks = (params = {}) => {
    return new Promise((resolve, reject) => {
        cf.listStacks(params, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        })
    })
}

const createStack = (params) => {
    return new Promise((resolve, reject) => {
        cf.createStack(params, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        })
    })
}

const updateStack = (params) => {
    return new Promise((resolve, reject) => {
        cf.updateStack(params, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        })
    })
}

const _deleteStack = (params) => {
    return new Promise((resolve, reject) => {
        cf.deleteStack(params, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        })
    })
}

const deleteStack = (service) => {

    // get resources
    cf.describeStackResources({ StackName: `${service}-cicd` }, (err, data) => {
        if (err) console.log(`Could not get stack resources for ${service}-cicd`);
        else {
            let buckets = data.StackResources.filter(resource => {
                return resource.ResourceType === 'AWS::S3::Bucket' && (resource.ResourceStatus === 'CREATE_COMPLETE' || resource.ResourceStatus === 'UPDATE_COMPLETE')
            })

            // get bucket contents
            buckets.forEach(bucket => {
                s3.listObjects({ Bucket: bucket.PhysicalResourceId, MaxKeys: 200 }, (err, data) => {
                    var params = {
                        Bucket: bucket.PhysicalResourceId,
                        Delete: { Objects: [] }
                    };

                    data.Contents.forEach(item => {
                        params.Delete.Objects.push({ Key: item.Key })
                    })

                    // delete bucket contents
                    s3.deleteObjects(params, (err, data) => {
                        //delete bucket
                        s3.deleteBucket({ Bucket: bucket.PhysicalResourceId }, (err, data) => {
                            return _deleteStack({ StackName: `${service}-cicd` })
                        })
                    })
                })
            })
        }
    })
}

const describeStackResources = (params) => {
    return new Promise((resolve, reject) => {
        cf.describeStackResources(params, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        })
    })
}

const getParameters = (params) => {
    return new Promise((resolve, reject) => {
        ssm.getParameters(params, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    })
}

exports.getPipelineState = getPipelineState;
exports.listStacks = listStacks;
exports.createStack = createStack;
exports.updateStack = updateStack;
exports.deleteStack = deleteStack;
exports.getParameters = getParameters;