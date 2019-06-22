require('dotenv').config();

const http          = require('http');
const path          = require('path');
const config        = require('config');
const app           = new (require('koa'));
const KeyGrip       = require('keygrip');
const log           = require('./lib/logger');
const userAgent     = require('koa-useragent');
const responseTime  = require('koa-response-time');
const conditional   = require('koa-conditional-get');
const etag          = require('koa-etag');
const devLogger     = require('koa-logger');
const notifier      = require('node-notifier');

/*
	If NGINX (or another proxy-server) then set to true
	X-Forwarded-Host
	X-Forwarded-Proto
	X-Forwarded-For -> ip
*/
app.proxy = 'false' === process.env.PROXY ? false : Boolean(process.env.PROXY);

app.keys  = new KeyGrip(process.env.KEYS.split(','), 'sha256');

if ('development' === process.env.NODE_ENV) {
    app.use(devLogger());
}

app.use(responseTime());
app.use(userAgent);
app.use(conditional());
app.use(etag());
app.use(async (ctx, next) => {
    await next();
    if (!ctx.expires) return;
    ctx.expires = 2;
    ctx.set('Expires', new Date(Date.now() + ctx.expires * 1e3).toUTCString());
});


process
    .on('unhandledRejection', err => {
        if ('development' === process.env.NODE_ENV) {
            notifier.notify({
                title: 'unhandledRejection',
                message: err.message,
                wait: true
            });
        }
        console.error(err);
        log.fatal(err);
        process.exit(1);
    })
    .on('uncaughtException', err => {
        if ('development' === process.env.NODE_ENV) {
            notifier.notify({
                title: 'uncaughtException',
                message: err.message,
                wait: true
            });
        }
        console.error(err);
        log.fatal(err);
        process.exit(1);
    });

/*** DEFAULT MIDDLEWARES ***/
[
    'static.js',
    'log.js',
    'errHandler.js',
    'bodyparser.js'
]
.map(mw => path.join(__dirname, 'middlewares', mw))
.forEach(mw => {
    app.use(require(mw));
});

/*** MODULES ***/
require('auth')(app);
require('users')(app);
require('messages')(app);

const server = http.createServer(app.callback());

const art = require('ascii-art');
// console.log(art.style('HELLO', 'off'))
// art.font('NODE.js', 'rusted', console.log);
// art.font('NODE.js', 'Doom', console.log);
var qrcode = require('qrcode-terminal');

qrcode.generate('http://github.com', {small: true}, function (qrcode) {
    console.log(qrcode);
});

const CFonts = require('cfonts');

// CFonts.say('NODE.JS', {
//     font: 'block',              // define the font face
//     align: 'left',              // define text alignment
//     colors: ['system'],         // define all colors
//     background: 'transparent',  // define the background color, you can also use `backgroundColor` here as key
//     letterSpacing: 1,           // define letter spacing
//     lineHeight: 1,              // define the line height
//     space: true,                // define if the output text should have empty lines on top and on the bottom
//     maxLength: '0',             // define how many character can be on one line
// });

var asciichart = require ('asciichart')
var s0 = new Array (120)
for (var i = 0; i < s0.length; i++) {
    s0[i] = 15 * Math.sin (i * ((Math.PI * 4) / s0.length))
}

console.log (asciichart.plot (s0))

if (!module.parent) {
    server.listen(config.port, () => {
        console.log('SERVER LISTENING ON PORT:', config.port);
    });
}
