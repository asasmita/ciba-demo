// load contents of .env into process.env
require('dotenv').config();

exports.Config = {
    tenantUrl          : process.env.TENANT_URL,
    discoveryUrl       : process.env.DISCOVERY_URL,
    clientId           : process.env.CLIENT_ID, // Use ping
    clientSecret       : process.env.CLIENT_SECRET,
    redirectUri        : process.env.REDIRECT_URI,
    scope              : process.env.SCOPE,
    signupLink         : process.env.USER_REGISTRATION_LINK,
    themeId            : process.env.THEME_ID,
    resourceBase       : process.env.RESOURCE_BASE_URL,
    apiClientId        : process.env.API_CLIENT_ID,
    apiClientSecret    : process.env.API_CLIENT_SECRET,
    mtlsOrJWT          : process.env.MTLS_OR_JWT,
    certBound          : process.env.CERT_BOUND,
    isvaOpOauthBaseUrl : process.env.ISVA_OP_OAUTH_BASE_URL,
    isamFedBaseUrl     : process.env.ISAM_FED_BASE_URL,
    useRequestObject   : process.env.USE_REQUEST_OBJECT,
    pollClientId       : process.env.CIBA_POLL_CLIENT_ID,
    pollClientSecret   : process.env.CIBA_POLL_CLIENT_SECRET,
    pollAuthMethod     : process.env.CIBA_POLL_AUTH_METHOD,
    pingClientId       : process.env.CIBA_PING_CLIENT_ID,
    pingClientSecret   : process.env.CIBA_PING_CLIENT_SECRET,
    pingAuthMethod     : process.env.CIBA_PING_AUTH_METHOD,
};
