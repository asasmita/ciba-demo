const config = require('./config').Config;
const {uuid} = require('uuidv4');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require("path");
const helper = require('../services/helper');
const HTTPUtil = require('../services/httputil');
const isvaOpClient = new HTTPUtil(config.isvaOpOauthBaseUrl, "wrpca.pem", true);
const QRCode = require('qrcode')
const jws = require('jws');

const cibaGrantType = `urn:openid:params:grant-type:ciba`;
const clientAssertionType = `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`;

class ServicesController {

    constructor() {
        this._metadata = null;
        this._transactionData = {};
    }

    // Calling metadata endpoint to get issuer, etc.
    metadata = async () => {
        let headers = {
            'accept': 'application/json',
            'content-type': 'application/json'
        };

        const response = await isvaOpClient.get('/.well-known/openid-configuration', headers);
        console.log(`Metadata response=\n${JSON.stringify(response.data, null, 2)}\n`);
        return response.data;
    }

    // Initialize ciba call
    init = async (req, res) => {

        if (this._metadata == null) {
            this._metadata = await this.metadata();
        }

        let code = req.body["code"];
        let qty = req.body["qty"];
        let hint = req.body["hint"];

        var bindingMessage = "Purchase from Happy Print - ";
        if (code == "item001") {
            bindingMessage = bindingMessage + "Print Labels (item001) - Total Amount: $" + (0.25 * qty);
        } else if (code == "item002") {
            bindingMessage = bindingMessage + "Print Name Cards (item002) - Total Amount: $" + (0.75 * qty);
        } else if (code == "item003") {
            bindingMessage = bindingMessage + "Print Photos (item003) - Total Amount: $" + (0.50 * qty);
        }

        let authReq = {
            "binding_message": bindingMessage,
            "scope": "openid",
            "login_hint": hint,
            "requested_expiry": 300
        }

        const clientInfo = await this.getClientInfo(hint);
        if (clientInfo['client_id'] === config.pingClientId) {
            authReq['client_notification_token'] = helper.generateJwt();
        }

        let cibaReq = await this.initializeClientAuthentication(clientInfo);
        if (config.useRequestObject == "true") {
            cibaReq["request"] = await this.createRequestObject(clientInfo, authReq);
        } else {
            for (const key in authReq) {
                cibaReq[key] = authReq[key];
            }
        }
        console.log(`CIBA request=\n${JSON.stringify(cibaReq, null, 2)}\n`);

        let headers = {
            'accept': 'application/json',
            'content-type': 'application/x-www-form-urlencoded'
        }

        const response = await isvaOpClient.post('/ciba', cibaReq, headers)
        console.log(`CIBA response=\n${JSON.stringify(response.data, null, 2)}\n`);

        if (response.status === 200) {
            let authReqId = response.data.auth_req_id;
            authReq['auth_req_id'] = authReqId;
            authReq['expires_in'] = response.data.expires_in;
            authReq['interval'] = response.data.interval;

            let data = this._transactionData[authReqId];
            if (data != null) {
                authReq['user_authorize_uri'] = data['user_authorize_uri'];
                authReq['qr'] = await QRCode.toDataURL(data['user_authorize_uri']);
            }
            this._transactionData[authReqId] = authReq;
            res.redirect('/services/refresh?id=' + authReqId);
        } else {
            authReq['error'] = response.data.error;
            authReq['error_description'] = response.data.error_description;
            res.render('services', { title: 'Kiosk Photo Print - Transaction', authReq: authReq, qrExist: false, tokenExist: false, showReject: false });    
        }
    }
    
    // This call coming from OP before the /ciba call returned
    // The use case is when the user is not having push notification
    // So need to send back the user_authorize_uri
    // Another way is to send this URL together with CIBA init response.
    notify = async (req, res) => {
        let authReqId = req.body["auth_req_id"];
        let userAuthorize = req.body["user_authorize_uri"];

        this._transactionData[authReqId] = {
            "user_authorize_uri": userAuthorize,
        }
        res.status(204).send();
    }

    // This URI is the ping notification URI
    ping = async (req, res) => {
        let authReqId = req.body["auth_req_id"];
        console.log("Received ping notification for ciba transaction: " + authReqId);

        let data = this._transactionData[authReqId];
        if (data == null || data == undefined) {
            console.log("Forbidden - there is no such ciba transaction: " + authReqId);
            res.status(403).send("No ciba transaction: " + authReqId);
            return;
        }

        let authorization = req.headers["authorization"];
        if (authorization === null || authorization === undefined || authorization === "") {
            console.log("Forbidden - the notification does not come with bearer token");
            res.status(403).send("Bearer token is required!");
            return;
        }
    
        let bearerToken = authorization.substring('bearer '.length);
        if (bearerToken !== data.client_notification_token) {
            console.log("Forbidden - the bearer token received is not expected.");
            res.status(403).send("You are not authorized to access this endpoint!");
            return;
        }
        res.status(204).send();
        this.token(authReqId);
    }

    // Call from UI periodically to query the status of transaction
    refresh = async (req, res) => {
        let authReqId = req.query.id;
        let data = this._transactionData[authReqId];
        const clientInfo = await this.getClientInfo(data['login_hint']);

        if (clientInfo['client_id'] == config.pollClientId) { // Poll mode, call /token first
            console.log("Poll mode, need to call /token first");
            await this.token(authReqId);
        }

        var idTokenPayload = {};
        var introspection = {};
        if (data['token'] != undefined) {
            idTokenPayload = jwt.decode(data.token.id_token);
            introspection = await this.introspect(clientInfo, data.token.access_token);    
        }

        res.render('services', { title: 'Kiosk Photo Print - Transaction', authReq: data, qrExist: data.qr != null || data.qr != undefined,
            tokenExist: data.token != undefined, showReject: data.rejected != undefined && data.rejected == true,
            fullJson: JSON.stringify(idTokenPayload, null, 2), introspection: JSON.stringify(introspection, null, 2) });
    }

    // Token call
    token = async (authReqId) => {
        let data = this._transactionData[authReqId];
        const clientInfo = await this.getClientInfo(data['login_hint']);

        let tokenReq = await this.initializeClientAuthentication(clientInfo);
        tokenReq["auth_req_id"] = authReqId;
        tokenReq["grant_type"] = cibaGrantType;

        console.log(`Token request=\n${JSON.stringify(tokenReq, null, 2)}\n`);

        let headers = {
            'accept': 'application/json',
            'content-type': 'application/x-www-form-urlencoded'
        };

        const response = await isvaOpClient.post('/token', tokenReq, headers);
        console.log(`Token response=\n${JSON.stringify(response.data, null, 2)}\n`);
        if (response.status === 200) {
            data['token'] = response.data;
            data['rejected'] = false;
        } else if (response.status === 400) {
            data['rejected'] = false; // Still pending ...
        } else {
            data['rejected'] = true;
        }
    }

    // Introspection call
    introspect = async (clientInfo, access_token) => {
        let introspectReq = await this.initializeClientAuthentication(clientInfo);
        introspectReq["token"] = access_token;
        console.log(`Introspect request=\n${JSON.stringify(introspectReq, null, 2)}\n`);

        let headers = {
            'accept': 'application/json',
            'content-type': 'application/x-www-form-urlencoded'
        };
        const response = await isvaOpClient.post('/introspect', introspectReq, headers)
        console.log(`Introspection response=\n${JSON.stringify(response.data, null, 2)}\n`);
        return response.data;
    }

    initializeClientAuthentication = async (clientInfo) => {
        var payload = {};
        if (clientInfo['auth_method'] === "private_key_jwt") {
            payload = {
                "client_assertion": await this.generatePrivateKeyJwt(clientInfo),
                "client_assertion_type": clientAssertionType,
            }
        } else if (clientInfo['auth_method'] === "tls_client_auth") {
            payload = {
                "client_id": clientInfo['client_id'],
            }
        } else { // assume: client_secret_post
            payload = {
                "client_id": clientInfo['client_id'],
                "client_secret": clientInfo['client_secret'],
            }
        }
        return payload;
    }

    // In case of using request object
    createRequestObject = async (clientInfo, authReq) => {
        let header = {
            "alg": "ES512",
            "kid": "cibaec521",
            "typ": "JWT"
        }
        authReq["iss"] = clientInfo['client_id'];
        authReq["aud"] = this._metadata["issuer"];
        authReq["iat"] = Math.trunc(new Date().getTime()/1000);
        authReq["nbf"] = Math.trunc(new Date().getTime()/1000);
        authReq["exp"] = Math.trunc((new Date().getTime()/1000) + 1800); // 30 minutes
        authReq["jti"] = uuid();
        const signature = jws.sign({
            header: header,
            payload: authReq,
            privateKey: fs.readFileSync(path.resolve(__dirname, `./cibaec521.pem`), 'utf8'),
        });
        return signature;
    }

    // In case the client authentication using private_key_jwt
    generatePrivateKeyJwt = async (clientInfo) => {
        let header = {
            "alg": "PS256",
            "kid": "cibarsa",
            "typ": "JWT"
        }
        let payload = {
            "sub": clientInfo['client_id'], 
            "iss": clientInfo['client_id'],
            "jti": uuid(),
            "iat": Math.trunc(new Date().getTime()/1000),
            "exp": Math.trunc((new Date().getTime()/1000) + 1800), // 30 minutes
            "aud": this._metadata["token_endpoint"],
        }
        const signature = jws.sign({
            header: header,
            payload: payload,
            privateKey: fs.readFileSync(path.resolve(__dirname, `./cibarsa.pem`), 'utf8'),
        });
        return signature;
    }

    // Choosing between poll or ping mode
    getClientInfo = async (login_hint) => {
        var clientInfo = {};
        if (login_hint === "97355164") {
            clientInfo = {
                "client_id": config.pollClientId,
                "client_secret": config.pollClientSecret,
                "auth_method": config.pollAuthMethod
            }
        } else {
            clientInfo = {
                "client_id": config.pingClientId,
                "client_secret": config.pingClientSecret,
                "auth_method": config.pingAuthMethod
            }
        }
        return clientInfo;
    }
}

module.exports = ServicesController;
