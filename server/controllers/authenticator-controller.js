const config = require('./config').Config;
const url = require('url');
const HTTPUtil = require('../services/httputil');
const isvaOpClient = new HTTPUtil(config.isvaOpOauthBaseUrl, "wrpca.pem", false);
const fedIsamClient = new HTTPUtil(config.isamFedBaseUrl, "isamfedca.pem", false);

class AuthenticatorController {

    constructor() {
        this._authenticatorData = {};
    }

    // This method exists as a workaround for MMFA 
    // The way MMFA works is as follow:
    // - initialize by calling GET /apiauthsvc?PolicyId=urn:ibm:security:authentication:asf:mmfa_initiate_simple_login&username=xxxx
    // - check status by calling PUT /apiauthsvc?StateId=xxxx with payload {'operation':'verify'}
    // However, after every check, if still pending, the StateId for the next check change.
    // Have tried to use poll mode, storing the next StateId in EXTRA_ATTRIBUTE table; but the result is not consistent.
    // So instead doing it here - and after it's done, call the /ciba_status_update.
    pushnotify = async (req, res) => {
        let hint = req.body["hint"];
        let statusUpdateUri = req.body["status_update_uri"];
        let bearerToken = req.body["bearerToken"];
        res.status(204).send();

        const response = await fedIsamClient.get('/apiauthsvc', {
                'accept': 'application/json',
                'content-type': 'application/json',
            },{
                'PolicyId': 'urn:ibm:security:authentication:asf:mmfa_initiate_simple_login',
                'username': hint,
            });
        console.log(`MMFA initial response=\n${JSON.stringify(response.data, null, 2)}\n`);
        console.log(`MMFA initial status=` + response.status);
        if (response.status == 200) {
            let stateId = response.data.stateId;
            while (true) {
                const rsp = await fedIsamClient.put('/apiauthsvc', {'operation': 'verify'}, {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                }, {
                    'StateId': stateId,
                });
                console.log(`MMFA verify response=\n${JSON.stringify(rsp.data, null, 2)}\n`);

                if (rsp.status == 204) {
                    await this.statusUpdate(statusUpdateUri, bearerToken, {
                        status: "success",
                        metadata: { // User information
                            uid: "jessica",
                            email: "jessica@ibm.com",
                            preferred_username: "Jessica Jones",
                            given_name: "Jessica",
                            family_name: "Jones",
                            authenticationMechanismTypes: ["urn:ibm:security:authentication:asf:macotp"],
                            factors_completed: "push_notification",
                            push_notification: "1635681600000",
                            AUTHENTICATION_LEVEL: "2"
                        }    
                    });
                    return;
                } else if (rsp.status == 200) {
                    stateId = rsp.data.stateId;
                    console.log("New stateId: " + stateId);
                } else {
                    console.log("Response status: " + rsp.status);
                    await this.statusUpdate(statusUpdateUri, bearerToken, {
                        status: "failed",
                    });
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, 5000));
                console.log("After 5sec sleep");
            }
        }
    }

    // Helper method to call /ciba_status_update endpoint
    statusUpdate = async(statusUpdateUri, bearerToken, payload) => {
        let headers = {
            'accept': 'application/json',
            'content-type': 'application/json',
            'authorization': 'bearer ' + bearerToken,
        };
        let userAuthorizeEndpoint = url.parse(statusUpdateUri);
        let segments = userAuthorizeEndpoint.pathname.split("/");
        let txnId = segments.pop() || segments.pop(); // handles path ends with '/'
        return await isvaOpClient.post('/ciba_status_update/' + txnId, payload, headers);
    }


    notify = async (req, res) => {
        let hint = req.body["hint"];
        let statusUpdateUri = req.body["status_update_uri"];
        let bearerToken = req.body["bearerToken"];
        let bindingMessage = req.body["bindingMessage"];

        this._authenticatorData[hint] = {
            "hint": hint,
            "status_update_uri": statusUpdateUri,
            "bearerToken": bearerToken,
            "bindingMessage": bindingMessage,
        }
        res.status(204).send();
    }

    // This is called by Mobile UI - mockup of push notification
    check = async (req, res) => {
        let hint = req.query.hint;

        var notifMsg = null;
        let notif = req.query.notif;
        if (notif == "success") {
            notifMsg = "Your consent has been submitted.";
        } else if (notif == "failed") {
            notifMsg = "Transaction failed.";
        } else {
            notifMsg = "";
        }
        let data = this._authenticatorData[hint];
        res.render('mobile', { data: data, notifMsg: notifMsg, hasNotif: notifMsg != "",
            noMessage: data == null || data == undefined, haveMessage: data != null && data != undefined });
    }

    // This is called by Mobile UI - mockup of push notification
    consent = async (req, res) => {
        let hint = req.body["hint"];
        let data = this._authenticatorData[hint];
        let decision = req.body["decision"];

        var response = null;
        if (decision == "deny") {
            response = await this.statusUpdate(data["status_update_uri"], data['bearerToken'], {
                status: "failed",
            });
        } else {
            response = await this.statusUpdate(data["status_update_uri"], data['bearerToken'], {
                status: "success",
                metadata: {
                    name: "John Doe",
                    uid: "50MFQUN5BU",
                    uniqueSecurityName: "50MFQUN5BU",
                    groupUids: [
                        "50CCN6TEUX",
                        "600000YB6I"
                    ],
                    groupIds: [
                        "admin",
                        "user"
                    ],
                    authenticationMechanismTypes: [
                        "urn:ibm:security:authentication:asf:macotp"
                    ],
                    AUTHENTICATION_LEVEL: "2",
                    factors_completed: "push_notification",
                    push_notification: "1635681600000"
                }    
            });
        }
        delete this._authenticatorData[hint];
        if (response.status === 204) {
            res.redirect('/authenticator/check?hint=' + hint + '&notif=success');
        } else {
            res.redirect('/authenticator/check?hint=' + hint + '&notif=failed');
        }
    }
}

module.exports = AuthenticatorController;