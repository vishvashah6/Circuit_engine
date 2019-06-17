'use strict';
let circuitEngine = require('circuits-engine');
const AWS = require('aws-sdk');
const entitiesIds = ['taskId', 'circuitId'];
const entities = ['tasks', 'circuits'];

exports.handler = async (event, context, callback) => {
    console.debug(JSON.stringify(event));
    const converter = AWS.DynamoDB.Converter;
    let entity;
    let elementIdKey;
    let elementId;
    let results = [];

    for (let record of event.Records) {
        try {
            if (typeof elementIdKey === 'undefined') {
                const element = converter.unmarshall(event.Records[0].dynamodb.NewImage);
                for (let e in entitiesIds) {
                    elementId = element[entitiesIds[e]];
                    if (typeof elementId !== 'undefined') {
                        elementIdKey = entitiesIds[e];
                        entity = entities[e];
                        break;
                    }
                }
            }

            const element = converter.unmarshall(record.dynamodb.NewImage);
            if (record.eventName === 'INSERT') {
                results.push(await circuitEngine.insertAnalytics(entity, elementIdKey, element));
            } else if (record.eventName === 'MODIFY') {
                results.push(await circuitEngine.updateAnalytics(entity, elementIdKey, element));
            }
        } catch (err) {
            //todo: handle the errors using dead letter queue
            console.error(err);
            continue;
        }
    }
    return results;


};
