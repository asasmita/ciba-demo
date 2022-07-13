const PORT = process.env.PORT || 3000;

// initialize libraries
const express = require('express');
const session = require('express-session')
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser')
const sessionRoutes = require('./routes/session-route');
const usersRoutes = require('./routes/users-route');
const servicesRoutes = require('./routes/services-route');
const kioskRoutes = require('./routes/kiosk-route');
const authenticatorRoutes = require('./routes/authenticator-route');
const jwksRoutes = require('./routes/jwks-route');
const dcrRoutes = require('./routes/dcr-route');

// initialize handlebars
var hbs = handlebars.create({
    helpers: {
        formatPurpose: function(purposeName, version) {
            if (purposeName == 'ibm-oauth-scope') {
                return 'OAuth Scope';
            }

            return `${purposeName} (Version ${version})`
        },
        formatDate: function (badDate) {
            var dMod = new Date(badDate * 1000);
            return dMod.toLocaleDateString();
        },
        formatState: function (state) {
            var stateOpt = {
                1: "Consent allow",
                2: "Consent deny",
                3: "Opt-in",
                4: "Opt-out",
                5: "Transparent"
            }
            return stateOpt[state];
        },
        formatAccessType: function (accessType) {
            if (accessType == "default") {
                return "";
            }
            return accessType;
        },
        formatAttribute: function (attribute) {
            if (attribute == "") {
                return "–";
            }
            else {
                return attribute;
            }
        }
    },
    layoutsDir: __dirname + '/../views/layouts',
    partialsDir: __dirname + '/../views/partials',
    extname: 'hbs',
    defaultLayout: 'default',
});

// initialize the app
const app = express();
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine)

app.use(session({
    secret: 'supersecret',
    resave: false,
    saveUninitialized: true,
    cookie: { path: '/', maxAge: 1800 * 1000, secure: false }
}))

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

// define routes
app.use(express.static(__dirname + '/../public'))
app.use('/', sessionRoutes);
app.use('/users', usersRoutes);
app.use('/services', servicesRoutes);
app.use('/kiosk', kioskRoutes);
app.use('/authenticator', authenticatorRoutes);
app.use('/jwks', jwksRoutes);
app.use('/dcr', dcrRoutes);

app.listen(PORT, () => {
    console.log('Server started and listening on port 3000');
});
