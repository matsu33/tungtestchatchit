/**
 * Created by tung.nguyen on 11/8/2017.
 */

/*
 TODO
 Broadcast a message to connected users when someone connects or disconnects
 Add support for nicknames
 Don’t send the same message to the user that sent it himself. Instead, append the message directly as soon as he presses enter.
 Add “{user} is typing” functionality
 Show who’s online
 Add private messaging
 Share your improvements!
 block spam
 */
var hostLive = "ws://tungtestchatchit.herokuapp.com";
var portLive = 80;
var hostDev  = "http://chatchit.com";
var portDev  = "5000";
//var hostDev  = "ws://127.0.0.1";
//var portDev  = "38928";
var codeEnv  = "DEV";
//var codeEnv = "LIVE";

var messageClientApi;
var CHAT_CHIT_COOKIE_USERNAME    = "CHAT_CHIT_COOKIE_USERNAME";
var TUNGTESTCHATCHIT_TOKEN_EMAIL = "TUNGTESTCHATCHIT_TOKEN_EMAIL";

function MailboxClient(options) {
    var hostChat = hostLive;
    var portChat = portLive;
    if (codeEnv == "DEV") {
        hostChat = hostDev;
        portChat = portDev;
    }
    this.default         = {
        portal        : 'xt',
        port          : portChat,
        host          : hostChat,
        socketOptions : {}
    };
    this.settings        = {};
    this.socket          = null;
    this.sid             = null;
    this.messageTemplate = "<div class=\"message\">\
    <div class=\"CLASS_FROM\">\
        <p>MESSAGE_CONTENT</p>\
    <date><b>FROM_USER</b> DATETIME_STRING</date>\
    </div>\
    </div>";

//<a href=\"USER_URL\" class=\"image-wrapper CLASS_FROM\" target=\"_blank\"><img src=\"USER_IMAGE\" /></a>\
    this.FROM_ME = "myMessage",
        this.FROM_THEM = "fromThem";
    this.user = {
        name  : '',
        image : '',
        url   : '',
        id    : ''
    };
//    this.username = "";
//    this.userimage = "";
//    this.userurl = "";
//    this.tokenGmail = "";
    this.init(options);
}

MailboxClient.prototype.init = function (options) {
    var _self          = this;
    _self.settings     = jQuery.extend({}, _self.default, options);
//    _self.tokenGmail = getParameterByName('token');
    var tokenGmailTemp = _self.settings.tokenGmail;
//    console.log('tokenGmail : ' + _self.tokenGmail);
    var ioHostPort     = _self.settings.host + ":" + _self.settings.port;
    console.log('D:\Project\message_chat\client\messageclient.js > init ioHostPort : ' + ioHostPort);

    _self.socket = io(ioHostPort);
//    _self.socket = io();

    console.log('try to connect to server');
    console.log(_self.socket);

    /**
     * handle 'connected' event
     */
    _self.socket.on('connect', function (s) {
        _self.sid = _self.socket.io.engine.id;
        console.log('D:\Project\message_chat\client\messageclient.js > connect successfully with sid : ' + _self.sid);
        console.log('checking login');
        //check login
        var urlCheckLogin = ioHostPort + '/getLoginUrl';
        if (tokenGmailTemp != '') {
            urlCheckLogin = ioHostPort + '/checkLogin/' + encodeURI(tokenGmailTemp);
        }
//        console.log('tokenGmail 2 : ' + tokenGmailTemp);
        console.log('urlCheckLogin : ' + urlCheckLogin);
        var checkLoginPromise = $.get(urlCheckLogin);
        checkLoginPromise.done(function (data) {
            console.log('checkLoginPromise done');
            console.log(data);
            if (data.status == 'NOK') {
                if (data.redirect && data.redirect != '') {
                    console.log('redirect to url : ' + data.redirect);
                    window.location = data.redirect;
                }
            } else
                if (data.status == 'OK') {
                    _self.user.name  = data.data.displayName;
                    _self.user.image = data.data.image.url;
                    _self.user.url   = data.data.url;
                    _self.user.id    = data.data.id;
                    if (_self.user.name == '') {
                        _self.user.name = _self.user.id;
                    }
                    if (typeof(_self.user.url) == 'undefined' || _self.user.url == '' || _self.user.url == 'undefined') {
                        _self.user.url = data.data.domain;
                    }
                    console.log(data.data);
                    _self.displayMessageFromSomeone(_self.FROM_THEM, _self.user, 'Hello ' + _self.user.name + ', welcome to chatchit room');
                    _self.socket.emit('joinChat', {sid : _self.sid, user : _self.user});
                }
        });

        _self.socket.on('receiveMessage', function (msgObj, msg) {
            console.log('receiveMessage');
            var serverSid = msgObj.sid,
                fromWho   = _self.FROM_THEM;
            if (serverSid == _self.sid || msgObj.user.id == _self.user.id) {
                fromWho = _self.FROM_ME;
            }
            _self.displayMessageFromSomeone(fromWho, msgObj.user, msg);
        });

        _self.socket.on('receiveJoinChat', function (msgObj) {
            console.log('receiveJoinChat');
            if (msgObj.sid != _self.sid && msgObj.user.id != _self.user.id) {
                _self.displayMessageFromSomeone(_self.FROM_THEM, msgObj.user, msgObj.user.name + ' has joined chat room.');
            }
            listUserOnline = msgObj.listUserOnline;
            console.log(listUserOnline);
            if (typeof (listUserOnline) != 'undefined') {
                for (var i = 0; i < listUserOnline.length; i++) {
                    var user = listUserOnline[i];
                    var uid  = user.id;
                    if ($('.list-useronlie li.' + uid).length <= 0) {
                        var username     = user.name;
                        var targetString = user.url != '#' ? 'target="_blank"' : '';
                        $('.list-useronlie').append('<li class="' + uid + '"><a href="' + addHttp(user.url) + '" ' + targetString + '><img src="' + user.image + '" />' + username + '</a></li>');
                    }
                }
            }
        });
    });

    jQuery('form').submit(function () {
        if (jQuery('#m').val().trim() != '') {
            _self.socket.emit('sendMessage', {sid : _self.sid, user : _self.user}, jQuery('#m').val());
        }
        jQuery('#m').val('');
        return false;
    });

}

MailboxClient.prototype.getMessageStringWithFromClassAndMessage = function (fromClass, user, messageContent) {
    var _self         = this;
    var messageResult = _self.messageTemplate;
    var date          = getDateString();
    messageResult     = messageResult.replaceAll("CLASS_FROM", fromClass)
        .replace("MESSAGE_CONTENT", htmlEscape(messageContent))
        .replace("DATETIME_STRING", date)
        .replace("FROM_USER", htmlEscape(user.name))
        .replace("USER_URL", user.url)
        .replace("USER_IMAGE", user.image);
    return messageResult;
}

MailboxClient.prototype.displayMessageFromSomeone = function (fromClass, user, messageContent) {
    var _self          = this;
    var messageDisplay = _self.getMessageStringWithFromClassAndMessage(fromClass, user, messageContent);
    $('.message-list').append($(messageDisplay));
    $('.message-list').stop().animate({
        scrollTop : $('.message-list')[0].scrollHeight
    }, 800);
}

function getRandomRgb() {
    var num = Math.round(0xffffff * Math.random());
    var r   = num >> 16;
    var g   = num >> 8 & 255;
    var b   = num & 255;
    return 'rgb(' + r + ', ' + g + ', ' + b + ')';
}

//Get only light colors randomly using JavaScript
function getRandomColor() {
    var letters = 'BCDEF'.split('');
    var color   = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
}

function getDateString() {
    var now  = new Date();
    var then = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDay();
    then += ' ' + now.getHours() + ':' + now.getMinutes();
    return then;
}

function initSlideBackgroundImage() {
    console.log('initSlideBackgroundImage');
    var imageNumberRandom = randomNumberFromRange(1, 52);
//    imageNumberRandom     = 1;
    var imageUrl          = '/images/model/image_ (' + imageNumberRandom + ').jpg';
    console.log('imageUrl : ' + imageUrl);
    $('body').css('background', 'url("' + imageUrl.replace(/ /g, '%20') + '") no-repeat center center fixed');
}

function randomNumberFromRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

$(document).ready(function () {
    var emailToken = getParameterByName('token');
    if (typeof(emailToken) != 'undefined' && emailToken != '') {
        setCookie(TUNGTESTCHATCHIT_TOKEN_EMAIL, emailToken)
        window.location = '/';
    } else {
        emailToken = getCookie(TUNGTESTCHATCHIT_TOKEN_EMAIL);
    }
    if (typeof(emailToken) == 'undefined') {
        emailToken = '';
    }
    var config       = {tokenGmail : emailToken};
    messageClientApi = new MailboxClient(config);
    initSlideBackgroundImage();
});

function getCookie(key) {
    return $.cookie(key);
}

function setCookie(key, value) {
    return $.cookie(key, value);
}

function getParameterByName(name) {
    var urlParams = new URLSearchParams(window.location.search);
    var result    = urlParams.get(name);
    if (!result) {
        result = '';
    }
    return result;
}

function htmlEscape(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function addHttp(s){
    var prefix = 'http';
    if (s.substr(0, prefix.length) !== prefix)
    {
        s = prefix + '://' + s;
    }
    return s;
}

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};