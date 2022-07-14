# CIBA-demo

This application is created to demonstrate CIBA flow. The application is built with Node.js and uses openid-client. 
All UI assets can be found under `views` and `public`. All `views` are written using vanilla HTML and JS and templated using Handlebars.

In this app, you can do the following -

1. Authenticate the client using private_key_jwt or tls_client_auth
2. Using request object
3. Viewing the authenticated user's profile by unpacking the id_token
4. Viewing the introspection payload
5. Testing dynamic client registration

## Pre-requisites
1. Install Node and Git on your machine
2. Clone this repo to your machine
3. Setup IBM Security Verify Access OIDC Provider environment

## Setup

For CIBA flow test, you can create a CIBA client as follow:

```
client_id: cibademo
client_id_issued_at: 1642399207
client_secret: secret
client_secret_expires_at: 0
client_name: Photo Print Client
enabled: true
redirect_uris:
  - https://www.ibm.com
grant_types:
  - authorization_code
  - client_credentials
  - refresh_token
  - urn:openid:params:grant-type:ciba
response_types:
  - code id_token
token_endpoint_auth_method: tls_client_auth
tls_client_auth_subject_dn: CN=clientID01,OU=security,O=IBM,L=singapore,ST=singapore,C=SG
tls_client_certificate_bound_access_tokens: true
jwks_uri: http://172.16.123.1:3000/jwks/relyingparty
request_object_signing_alg: ES512
backchannel_token_delivery_mode: ping
backchannel_client_notification_endpoint: http://172.16.123.1:3000/services/ping
backchannel_user_code_parameter: false
```

For Dynamic Client Registration test, to create the initial bearer token, this client is assumed:

```
client_id: clientOwner
client_id_issued_at: 1642399207
client_secret: secret
client_secret_expires_at: 0
client_name: Dynamic Client Owner
enabled: true
grant_types:
  - client_credentials
scopes:
  - cdr:registration
token_endpoint_auth_method: tls_client_auth
tls_client_auth_subject_dn: CN=clientID01,OU=security,O=IBM,L=singapore,ST=singapore,C=SG
tls_client_certificate_bound_access_tokens: false
```

## Setup the application
Copy `dotenv` file to `.env` and populate the values as below

| Name | Description | Example Value |
|------|-------------|---------------|
| ISVA_OP_OAUTH_BASE_URL  | Base URL of the IBM Security Verify Access OIDC Provider | https://isvaop.com/oauth2 |
| ISAM_FED_BASE_URL       | Base URL of the MMFA Authentication                      | https://mmfa.com/mga/sps |
| USE_REQUEST_OBJECT      | Whether CIBA initial request is using request object     | true or false |
| CIBA_POLL_CLIENT_ID     | Client ID of a 'poll' CIBA client | cibapoll |
| CIBA_POLL_CLIENT_SECRET | Client Secret of a 'poll' CIBA client | secret |
| CIBA_POLL_AUTH_METHOD   | Client authentication method for 'poll' CIBA client | private_key_jwt |
| CIBA_PING_CLIENT_ID     | Client ID of a 'ping' CIBA client | cibaping |
| CIBA_PING_CLIENT_SECRET | Client Secret of a 'ping' CIBA client | secret |
| CIBA_PING_AUTH_METHOD   | Client authentication method for 'ping' CIBA client | tls_client_auth |

This demo application is bundled with client certificate used for MTLS communication (the public key under `config/cert.pem` and private key under `config/key.pem`). This certificate has subject DN: `CN=clientID01,OU=security,O=IBM,L=singapore,ST=singapore,C=SG`.
You can overwrite it with your own certificate. By default, communication with the OIDC Provider will always use MTLS.
Whether the client certificate is used as means of client authentication or certificate bound access token, it will depend on the OAuth/OIDC client
settings: whether `token_endpoint_auth_method=tls_client_auth` and whether `tls_client_certificate_bound_access_tokens=true`.

To minimize configuration, this demo application will always sign the `private_key_jwt` client assertion using `PS256` algorithm.
And will always sign the request object using `ES512` algorithm. The private keys are inside `server/controllers` folder.
And the public keys are published as `jwks` at `http://localhost:3000/jwks/relyingparty`.
So, when using `token_endpoint_auth_method=private_key_jwt`, please also configure `token_endpoint_auth_signing_alg=PS256`.
And for `request_object_signing_alg` use `ES512`. The client can set its `jwks_uri` to `http://localhost:3000/jwks/relyingparty`.

## Run the application
1. Install node dependencies
```
npm install
```
2. Run the application. You should see Server started and listening on port 3000 after executing the command below.
```
npm start
```
3. Open the browser and go to http://localhost:3000/kiosk and you should be able to use the application.
