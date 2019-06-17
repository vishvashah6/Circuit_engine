'use strict';

let circuitEngine = require('circuits-engine');
let responseHelper = require('circuits-engine-api-helper');

exports.handler = (event, context, callback) => {
    console.debug(JSON.stringify(event));
    const params = JSON.parse(event.body);
    const user = 'user1';
    const role = 'role1';
    const tenant = 'tenant1';

    params._metadata = {
        'tenant': tenant,
        'user': user,
        'role': role
    };

    circuitEngine.updateCircuitDraft(event.pathParameters.circuitId, params, tenant, user, role)
        .then((data) => {
                callback(null, responseHelper.okResponse(data, event, '/circuits/' + data.circuitId));
            },
            (err) => {
                callback(null, responseHelper.errorResponse(err));
            }
        );
};
