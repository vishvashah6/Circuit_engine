'use strict';
let circuitEngine = require('circuits-engine');
let apiHelper = require('circuits-engine-api-helper');
const feature = {
    resource : 'circuit_engine:/circuits',
    action: 'GET'
};

const WHITELIST_FIELDS = ['circuitId', 'currentStatus', 'createdAt', 'searchKey', 'circuitDefinitionId',
    'tenantId-createdAt-circuitDefinitionId', 'createdByRole', 'createdByUser', 'payload', 'slaExpiresAt'];
const WHITELIST_FIELDS_PROJECTION = ['circuitId', 'currentStatus', 'createdAt', 'searchKey', 'circuitDefinitionId',
    'tenantId-createdAt-circuitDefinitionId', 'createdByRole', 'createdByUser', 'payload', 'slaExpiresAt'];
const WHITELIST_PARMS = ['where', 'sort', 'projection', 'max_results', 'page', 'range', 'text_search'];
const DEFAULT_MAX_RESULTS = process.env.DEFAULT_MAX_RESULTS || 20;

exports.handler = (event, context, callback) => {
    try {
        const params = apiHelper.processQueryParameters(event["queryStringParameters"], WHITELIST_PARMS);
        const paramsAsQueryString = apiHelper.toQueryParameterString(event["queryStringParameters"], WHITELIST_PARMS);
        const page = params.page || 1;
        const size = params.max_results || DEFAULT_MAX_RESULTS;
        const query = apiHelper.processWhere(params, WHITELIST_FIELDS);
        if (typeof params.text_search !== 'undefined'){
            query.text_search = params['text_search'];
        }
        const projectionFields = apiHelper.processProjection(params, WHITELIST_FIELDS_PROJECTION);
        const sortFields = apiHelper.processSort(params, WHITELIST_FIELDS_PROJECTION);
        const dateRange = apiHelper.processRange(params);
        const security = apiHelper.getSecurity(feature, event);
        if (security) {
            circuitEngine.queryCircuits(query, dateRange, projectionFields, sortFields, page, size, security)
                .then((data) => {
                        const resp = apiHelper.okMultipleResponse(data, event, '/circuits' + paramsAsQueryString, 'circuitId');
                        const body = JSON.parse(resp.body);
                        body._items = body._embedded.circuits;
                        delete body._embedded;
                        resp.body = JSON.stringify({
                            data: body
                        });
                        callback(null, resp);
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
    } catch (err) {
        const error = {
            'ERR_CODE': 'UNIDENTIFIED_ERROR_IN_API',
            'ERR_TYPE': 'SERVER',
            'ERR_MESSAGE': err
        };
        console.error(error);
        callback(null, apiHelper.errorResponse(error));
    }
};
