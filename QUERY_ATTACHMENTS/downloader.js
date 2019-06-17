let AWS = require('aws-sdk');

exports.handler = async (event, context, callback) => {
    try {
        console.log(event);
        console.log(context);
        //const circuit = await circuitEngine.getCircuitDetail(event.pathParameters.circuitId);
        const s3 = new AWS.S3({apiVersion: '2006-03-01'});
        const params = {
            Bucket: process.env.FILES_BUCKET,
            Key: event.pathParameters.circuitId + '/' + event.pathParameters.attachmentId
        };
        await new Promise((resolve, reject) => {
            s3.getObject(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                    reject(err);
                } else {
                    console.log(data);
                    return resolve(callback(null, {
                        statusCode: 200,
                        isBase64Encoded: true,
                        headers: {
                            'Access-Control-Allow-Origin': '*',
                            'content-type': data.ContentType
                        },
                        body: data.Body.toString('base64')
                    }));
                }
            });
        });
    } catch (err) {
        console.log("Error uploading: " + err);
        return callback(null, {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(err)
        });
    }
};

