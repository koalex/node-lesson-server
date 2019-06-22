const socketIO = require('socket.io');

function Server (server) {
    const opts = {

    };


    const io = socketIO.listen(server, opts);


    io.on('connection', socket => {
        console.log('КТО-ТО ПОДКЛЮЧИЛСЯ');
    });

}

module.exports = Server;