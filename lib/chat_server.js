var socketio = require('socket.io');
var io;
var nicknames = {};
var namesUsed = [];
var currentRoom = {};

// Database creation / connection
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('chat_records.db');

// Start Socket.IO server and process requests
exports.listen = function (server) {
    io = socketio.listen(server);

    // Process for every connected user
    io.sockets.on('connection', function (socket) {
        db.run('CREATE TABLE IF NOT EXISTS records (message TEXT)');

        // Load messages from database
        db.all('SELECT * FROM records', function (err, rows) {
            socket.emit('loadMessage', rows);
        });

        joinRoom(socket, 'Main');
        handleMessageBroadcasting(socket, nicknames);
        handleNameAssignment(socket, nicknames, namesUsed);
        handleClientDisconnection(socket, nicknames, namesUsed);

        // Save messages into database
        socket.on('saveMessage', function (message) {
            db.run("INSERT INTO records (message) VALUES ('" + message + "')");
        });
    });
};


/* Functions */

// Add user to chat room
function joinRoom(socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult', { room: room });
}

function handleNameAssignment(socket, nicknames, namesUsed) {
    socket.on('assignNickname', function (name) {
        // Name not being used
        if (namesUsed.indexOf(name) == -1) {
            var previousName = nicknames[socket.id];
            var previousNameIndex = namesUsed.indexOf(previousName);
            namesUsed.push(name);
            nicknames[socket.id] = name;
            delete namesUsed[previousNameIndex];
            socket.emit('nameResult', {
                success: true,
                name: name
            });
            // Let others know a new user has joined
            socket.broadcast.to('Main').emit('message', {
                text: nicknames[socket.id] + ' has joined.'
            });
        }
        // Name in use
        else {
            socket.emit('nameResult', {
                success: false,
                error: 'The name "' + name + '" is already in use.' 
            });
        }
    });
}

// Send a message to all users in the chat room
function handleMessageBroadcasting(socket) {
    socket.on('message', function (message) {
        socket.broadcast.to(message.room).emit('message', {
            nickname: nicknames[socket.id],
            time: message.time,
            text: message.text,
            myself: false
        });
    });
}

// User leaves room
function handleClientDisconnection(socket) {
    socket.on('disconnect', function () {
        if (nicknames[socket.id]) {
            socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                text: nicknames[socket.id] + ' has disconnected.'
            });
        }
        var nameIndex = namesUsed.indexOf(nicknames[socket.id]);
        delete namesUsed[nameIndex];
        delete nicknames[socket.id];
    });
}