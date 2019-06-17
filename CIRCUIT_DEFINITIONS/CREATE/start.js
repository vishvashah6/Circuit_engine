'use strict';

let circuitEngine = require('circuits-engine');
let responseHelper = require('circuits-engine-api-helper');
const feature = {
    resource: 'circuit_engine:/circuit_definations/*/create',
    action: 'POST'
};

exports.handler = (event, context, callback) => {

    const security = responseHelper.getSecurity(feature, event);
    if (security) {
        try {
            const user = 'user1';
            //const data = await circuitEngine.updateCircuitComments(event.pathParameters.circuitId, comment.comment, security);
            circuitEngine.createCircuit(event.pathParameters.circuitDefinition, JSON.parse(event.body), security.tenant, user, security.roles, security.groups)
                .then((data) => {
                        callback(null, responseHelper.okResponse(data, event, '/circuit_definations/' + data.circuitId, 201));
                    },
                    (err) => {
                        callback(null, responseHelper.errorResponse(err));
                    }
                );
        } catch (err) {
            return responseHelper.errorResponse(err);
        }
    } else {
        const err = {
            'ERR_CODE': 'USER_IS_NOT_AUTHORIZED_TO_ACCESS_THIS_RESOURCE',
            'ERR_TYPE': 'SECURITY',
            'ERR_SUGGESTION': 'Check user permissions',
            'ERR_MESSAGE': 'Permission Denied'
        };
        console.error(err);
        callback(null, responseHelper.errorResponse(err));
    }
};
