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

class DcrController {

    constructor() {
    }

    init = async (req, res) => {
        res.render('dcr', { title: 'Dynamic Client Profile' });
    }

    create = async (req, res) => {
        let registerReq = JSON.parse(req.body["metadata"]);
        let sendBearer = req.body["sendBearer"];
        let sendSoftwareStatement = req.body["sendSoftwareStatement"];
        let contentType = req.body["contentType"];

        if (sendSoftwareStatement === 'true') {
            registerReq['software_statement'] = await this.createSoftwareStatement();
        }

        console.log(`Register request=\n${JSON.stringify(registerReq, null, 2)}\n`);

        let headers = {
            'accept': 'application/json',
            'content-type': 'application/json'
        }

        if (contentType === "jwt") {
            headers = {
                'accept': 'application/json',
                'content-type': 'application/jwt'
            }
            registerReq = await this.createRequestJwt(registerReq);
        }

        if (sendBearer === 'true') {
            const at = await this.getBearerToken();
            headers['authorization'] = 'bearer ' + at;
        }

        const response = await isvaOpClient.post('/register', registerReq, headers);
        console.log(`Register response=\n${JSON.stringify(response.data, null, 2)}\n`);
        if (response.status === 201) {
            res.render('dcr', { title: 'Dynamic Client Profile', success: true, failed: false, client: JSON.stringify(response.data, null, 2) });
        } else {
            res.render('dcr', { title: 'Dynamic Client Profile', success: false, failed: true, error: response.data });
        }
    }

    createRequestJwt = async (payload) => {
        let header = {
            "alg": "PS256",
            "kid": "cibarsa",
            "typ": "JWT"
        }
        payload['iss'] = 'WNS2802342';
        payload['jti'] = uuid();
        const signature = jws.sign({
            header: header,
            payload: payload,
            privateKey: fs.readFileSync(path.resolve(__dirname, `./cibarsa.pem`), 'utf8'),
        });
        return signature;
    }

    createSoftwareStatement = async () => {
        let header = {
            "alg": "ES256",
            "kid": "ob",
            "typ": "JWT"
        }
        let payload = {
            "iss": "https://www.obdirectory.com",
            "jti": uuid(),
            "iat": Math.trunc(new Date().getTime()/1000),
            "exp": Math.trunc((new Date().getTime()/1000) + 900), // 15 minutes
            "jwks_uri": "http://172.16.123.1:3000/jwks/relyingparty",
            "software_id": "WNS2802342",
            "token_endpoint_auth_method": "private_key_jwt",
            "token_endpoint_auth_signing_alg": "PS256",
            "tls_client_certificate_bound_access_tokens": true,
            "require_pushed_authorization_requests": false,
            "require_pkce": true
        }
        console.log(`Software statement payload=\n${JSON.stringify(payload, null, 2)}\n`);
        const signature = jws.sign({
            header: header,
            payload: payload,
            privateKey: fs.readFileSync(path.resolve(__dirname, `./ob.pem`), 'utf8'),
        });
        return signature;
    }

    getBearerToken = async () => {
        let tokenReq = {
            "grant_type": "client_credentials",
            "client_id": "clientOwner",
            "scope": "cdr:registration"
        };
        console.log(`Token request=\n${JSON.stringify(tokenReq, null, 2)}\n`);

        let headers = {
            'accept': 'application/json',
            'content-type': 'application/x-www-form-urlencoded'
        };

        const response = await isvaOpClient.post('/token', tokenReq, headers);
        console.log(`Token response=\n${JSON.stringify(response.data, null, 2)}\n`);
        if (response.status === 200) {
            return response.data.access_token;
        }
        return null;
    }
}

module.exports = DcrController;