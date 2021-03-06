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


const router = new (require('koa-router'));
router.get('/user-agent', ctx => {
    ctx.body = ctx.userAgent;
});

const server = http.createServer(app.callback());
const socket = require('./lib/socket');

/*** MODULES ***/
if (process.env.MODULES) {
    process.env.MODULES.split(/\s{0,},\s{0,}/).forEach(m => {
        require(m)(app);
    });
}

const fs = require('fs');
router.get('/socket-page', ctx => {
    ctx.type = 'html';
    ctx.body = fs.createReadStream('./static/socket.html');
});

app.use(router.routes());

socket(server);

if (!module.parent) {
    server.listen(config.port, async () => {
        console.log('SERVER LISTENING ON PORT:', config.port);
    });
}
