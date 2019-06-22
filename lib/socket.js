const socketIO = require('socket.io');

function Server (server) {
    const opts = {
        transports: ['websocket', 'polling']
    };


    const io = socketIO.listen(server, opts);


    io.on('connection', socket => {
        console.log('КТО-ТО ПОДКЛЮЧИЛСЯ');

        // io.emit('HELLO', {message: 'ПОДКЛЮЧИЛСЯ ' + socket.id});

        socket.on('HELLO_FROM_CLIENT', message => {
            // socket.broadcast.emit('HELLO', {message: 'ПОДКЛЮЧИЛСЯ ' + socket.id});
            socket.volatile.broadcast.emit('HELLO', {message: 'ПОДКЛЮЧИЛСЯ ' + socket.id});
        });

        // setInterval(function () {
        //     io.emit('HELLO', {message: 'ПРИВЕТ МИР'});
        // }, 1000)
    });



}

module.exports = Server;