'use strict';

const AWS = require('aws-sdk');
const hal = require('hal');


const prepareResponse = (statusCode, status, body) => {
     return {
        statusCode: statusCode,
		headers: {"Access-Control-Allow-Origin": "*"},
        body: JSON.stringify({[status] : body})
    };
}

exports.handler = (event, context, callback) => {
    try {
        const circuit = event.pathParameters.circuitDefinition;
        if (circuit === null || circuit === undefined || circuit === '') {
            console.error("Circuit defination is missing");
            callback(null,prepareResponse(400,"ERR_CODE","CIRCUIT_DEFINITION_IS_MISSING"));
        } else {
            let params = {
                TableName: process.env.ENV + "CircuitsDefinitions",
                Key:{
                    "circuitDefinitionId": circuit,
                    "tenantId": "tenant1",
                }
            };
            const docClient =  new AWS.DynamoDB.DocumentClient();
            docClient.get(params, function (err, data) {
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err));
                    callback(null,prepareResponse(500,"ERR_CODE","INTERNAL_SERVER_ERROR"));
                } else {
                    if (data !== undefined && data !== null && data.Item) {
                        let final = data.Item;
                        final. _links = [{href: 'circuits/'+circuit}];
                        callback(null, prepareResponse(200,"data",final));
                    } else {
                        console.error("No record found with circuit Id ->" + circuit);
                        callback(null,prepareResponse(404,"ERR_CODE","RESOURCE_NOT_FOUND"));
                    }
                }
            });
        }
    } catch (e) {
        console.error("Exception->" + e);
        callback(null,prepareResponse(500,"ERR_CODE","INTERNAL_SERVER_ERROR"));
    }

};
