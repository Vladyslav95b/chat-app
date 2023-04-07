const http = require('http');
const path = require('path');
const express = require('express');
const socketIo = require('socket.io');
const Filter = require('bad-words');


const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom,
} = require('./utils/users');

const {
    generateMessage,
    generateLocationMessage,
} = require('./utils/messages');

const filter = new Filter();
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 3000;
const publicDirectoryPass = path.resolve(__dirname, '..', 'public');
app.use(express.static(publicDirectoryPass));

io.on('connection', (socket) => {
    console.log('New web socket connection');
    socket.on('join', ({ username, room }, callback) => {
        const { user, error } = addUser({ id: socket.id, username, room });

        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessage('System', 'Welcome!'));
        socket.broadcast
            .to(room)
            .emit(
                'message',
                generateMessage('System', `${user.username} has joined!`)
            );

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room),
        });
        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed');
        }
        io.to(user.room).emit(
            'message',
            generateMessage(user.username, message)
        );
        callback();
    });

    //Location
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit(
            'locationMessage',
            generateLocationMessage(
                user.username,
                `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
            )
        );
        if (!coords) {
            callback('No coords received');
        }
        callback('Coords sended');
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit(
                'message',
                generateMessage('System', `${user.username} has left!`)
            );
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room),
            });
        }
    });
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
