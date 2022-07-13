const config = require('../../controllers/config').Config;
const HTTPUtil = require('../httputil');
const httpClient = new HTTPUtil(`https://${config.tenantUrl}`);
        
class TokenService {

    initCiba = async (scope, hint) => {

        const response = await httpClient.post("/oauth2/ciba", {
            "client_id": config.clientId,
            "client_secret": config.clientSecret,
            "client_notification_token": config.notificationToken,
            "binding_message": "Purchase of photo printing service",
            "scope": scope,
            "login_hint": hint,
        }, {
            "content-type": "application/x-www-form-urlencoded",
            "accept": "application/json",
        });

        return response.data;
    }

    getToken = async (authReqId) => {
        const response = await httpClient.post('/oauth2/token', {
            "client_id": config.clientId,
            "client_secret": config.clientSecret,
            "grant_type": "urn:openid:params:grant-type:ciba",
            "auth_req_id": authReqId,
        }, {
            "content-type": "application/x-www-form-urlencoded",
            "accept": "application/json",
        });

        return response.data;
    }

    introspect = async (accessToken) => {
        const response = await httpClient.post('/oauth2/introspect', {
            "client_id": config.clientId,
            "client_secret": config.clientSecret,
            "token": accessToken,
        }, {
            "content-type": "application/x-www-form-urlencoded",
            "accept": "application/json",
        });

        return response.data;
    }
}

module.exports = TokenService;
