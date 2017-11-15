/**
 * Created by tung.nguyen on 11/8/2017.
 */
var app = require('express')()
app.set('origins', "*:*");
var http = require('http').Server(app)
var port = process.env.PORT || 5000
var io = require('socket.io')(http)
io.set('origins', "*:*");
var Session = require('express-session');
var google = require('googleapis');
var plus = google.plus('v1');
var OAuth2 = google.auth.OAuth2;
const ClientId = "513062218576-87l4hpm6gc1ga4eaknhsdksj44qilhdp.apps.googleusercontent.com";
const ClientSecret = "t1CVxNxMrgfVFaOuC8czrGYl";
//const RedirectionUrl = "http://chatchit.com:1234/oauthCallback";
//const RedirectionUrl = "http://tungtestchatchit.herokuapp.com/oauthCallback";
const RedirectionUrl = "http://chatchit.com:5000/oauthCallback";
var url = require('url');
var listUserOnline = [];

app.use(Session({
    secret: 'raysources-secret-19890913007',
    resave: true,
    saveUninitialized: true
}));

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://chatchit.com');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

//app.get('/', function (req, res) {
//    var result = {status: 'OK', message: 'Server is running'};
//    res.send(result)
//})

app.get('/checkLogin/:token', function (req, res) {
    var result = {status: 'NOK', message: 'Sorry, server got problem.'};
    var token = JSON.parse(decodeURI(req.params.token)); // $_GET["token"]
    console.log('checkLogin token : ');
//    console.log(token);
    if(token && token != '') {
        var oauth2Client = getOAuthClient();
        oauth2Client.setCredentials(token);

        var p = new Promise(function (resolve, reject) {
            plus.people.get({ userId: 'me', auth: oauth2Client }, function(err, response) {
                if(err){
                    reject(err);
                } else {
                    resolve(response);
                }
            });
        }).catch(function (error) {
            console.log('error when get user data')
            console.log(error);
            var redirectUrl = getAuthUrl();
            result          = {status : 'NOK', message : 'Not logined yet', redirect : redirectUrl};
            res.send(result);
        }).then(function (data) {
            console.log('get user data successful');
            console.log(data);
            result = {status: 'OK', message: 'Logined', data: data};
            res.send(result)
        });
    }else {
        var redirectUrl = getAuthUrl();
        result          = {status : 'NOK', message : 'Not logined yet', redirect : redirectUrl};
        res.send(result)
    }
})

app.get('/getLoginUrl', function (req, res) {
    var redirectUrl = getAuthUrl();
    res.send({status: 'NOK', message: 'Not logined yet', redirect: redirectUrl})
})

io.on('connect', function (socket) {

    socket.on('disconnect', function () {
        console.log('disconnect');
        console.log(socket.id);
    });

    socket.on('sendMessage', function(sid, msg){
        console.log('sendMessage: ' + msg);
        io.emit('receiveMessage', sid, msg);
    });
    socket.on('joinChat', function(sid){
        console.log('joinChat');
        var isExistedUser = false;
        var sidTemp = sid;
        console.log('joinChat 1');
        console.log(listUserOnline);
        if(listUserOnline.length > 0){
            for (var i = 0; i < listUserOnline.length; i++) {
                var user = listUserOnline[i];
                if(sid.user.id == user.id){
                    isExistedUser = true;
                    break;
                }
            }
        }
        console.log('joinChat 2');
        if(!isExistedUser){
            listUserOnline.push(sid.user);
        }
        console.log('joinChat3');
        sidTemp.listUserOnline = listUserOnline;
        console.log('joinChat 4');
        io.emit('receiveJoinChat', sidTemp);
        console.log('joinChat 5');
    });
})

http.listen(port, function () {
    console.log('server dang mo port ' + port)
})

app.use("/oauthCallback", function (req, res) {
    var oauth2Client = getOAuthClient();
    var session = req.session;
    var code = req.query.code;
    oauth2Client.getToken(code, function(err, tokens) {
        // Now tokens contains an access_token and an optional refresh_token. Save them.
        if(!err) {
            console.log('Login successful with tokens : ');
            oauth2Client.setCredentials(tokens);
//            console.log(tokens);
           /* { access_token: 'ya29.GlwDBR6s3JNUPHTRbXo3JIeSEQ0nnrmTTsVdJiQDiecXUEnHiWKSCfEs-mDoKTjX45dyurC1aMqsSieXkWRLlFvdtNFRFj1hTetlDMoZIVcq-1rkFtBRHg_eDu83mA',
                id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImNjN2QyOWM5Y2IzNzgwNzQxY2MwODc2NjMzYzkxMDdhMGYzM2MyODkifQ.eyJhenAiOiI1MTMwNjIyMTg1NzYtODdsNGhwbTZnYzFnYTRlYWtuaHNka3NqNDRxaWxoZHAuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI1MTMwNjIyMTg1NzYtODdsNGhwbTZnYzFnYTRlYWtua
                HNka3NqNDRxaWxoZHAuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTc5NjAzODA2MTAzMDk4NjU2NjEiLCJhdF9oYXNoIjoiZzV5d2VNQzZTa24wWlgtTktZazVXdyIsImlzcyI6ImFjY291bnRzLmdvb2dsZS5jb20iLCJpYXQiOjE1MTA1NjQwOTgsImV4cCI6MTUxMDU2NzY5OH0.CU52ZzWVvEUnkZQxXouCZn7KZcFv3q13Mr
                YyEZO3ejmHDl5xw7ifSPBZs4pPvPBqzMpcrK4sLZ5pBrc7FwFm5zvlr8eVnpVtJ3XymCO7ZnbBw1VCvMehflgdQjp_l81GApU1tFBL77KjItqSGhihM6P7eLMcjpq3W3-s-cLHlLD87ZWwZP1cGs6ZLrZySujbzfx3SCgvQKYoNdxIym9B84S_SdOyDnPYKSRWLXvz_Bwwlwfvj81xAceOljK6_MMy62ldlu3CHATjC7fqjL0xKIendAuMz8PPpOooMD8
                fzrwSjijUBBn3OJAxlrNqNJ4Um-x27F2AmIdXZGXKrJQIDQ',
                token_type: 'Bearer',
                    expiry_date: 1510567697484 }
*/

//            session["tokenGmail"]=tokens;
            var redirectUrl = "http://chatchit.com/?token=" + encodeURI(JSON.stringify(tokens));
//            console.log('redirectUrl : ' + redirectUrl);
            res.redirect(redirectUrl);
//            res.send('<h3>Login successful!!</h3>\
//  <a href="/details">Go to details page</a>');
        }
        else{
            res.send("<h3>Login failed!!</h3>");
//            res.send('<h3>Login failed!!</h3>');
        }
    });
});

/**
 *
 * @param req
 * @returns {*}
 */
function getFormattedUrl(req) {
    return url.format({
        protocol: req.protocol,
        host: req.get('host')
    });
}

function getOAuthClient () {
    return new OAuth2(ClientId , ClientSecret, RedirectionUrl);
}

function getAuthUrl () {
    var oauth2Client = getOAuthClient();
    // generate a url that asks permissions for Google+ and Google Calendar scopes
    var scopes = [
        'https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'
    ];

    var url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes // If you only need one scope you can pass it as string
    });

    return url;
}

function isUserLogined(req) {
    var session = req.session;
    var result  = false;
    if (session) {
        var sessionToken = session["tokenGmail"];
        if (sessionToken) {
            result = true;
        }
    }
    return result;
}