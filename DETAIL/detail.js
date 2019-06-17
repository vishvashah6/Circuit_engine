'use strict';

let circuitEngine = require('circuits-engine');
let apiHelper = require('circuits-engine-api-helper');
const feature = {
    resource : 'circuit_engine:/circuits/',
    action: 'GET'
};

exports.handler = (event, context, callback) => {

    const security = apiHelper.getSecurity(feature, event);
    if (security) {
        circuitEngine.getCircuitDetail(event.pathParameters.circuitId, security)
            .then((data) => {
                    callback(null, apiHelper.okResponse(data, event, '/circuits/' + data.circuitId));
                },
                (err) => {
                    callback(null, apiHelper.errorResponse(err));
                }
            );
    } else {
        const err = {
            'ERR_CODE': 'USER_IS_NOT_AUTHORIZED_TO_ACCESS_THIS_RESOURCE',
            'ERR_TYPE': 'SECURITY',
            'ERR_SUGGESTION': 'Check user permissions',
            'ERR_MESSAGE': 'Permission Denied'
        };
        console.error(err);
        callback(null, apiHelper.errorResponse(err));
    }
};
