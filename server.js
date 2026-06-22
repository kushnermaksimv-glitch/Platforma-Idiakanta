const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

// ЧИТАЙ ТУТ: Поместить файл index.html в ту же папку, что и server.js на Render
app.use(express.static(__dirname));

// Отдаем игру каждому, кто просто перейдет по ссылке в браузере
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let onlinePlayers = {};

io.on('connection', (socket) => {
    console.log(`Игрок зашел в сеть: ${socket.id}`);
    
    onlinePlayers[socket.id] = {
        x: 100, y: 200, dir: 1,
        name: "Кот_" + socket.id.substring(0, 4),
        score: 0, gameMode: "LOBBY"
    };

    socket.emit('currentPlayers', onlinePlayers);
    socket.broadcast.emit('newPlayer', { id: socket.id, info: onlinePlayers[socket.id] });

    socket.on('playerMovement', (movementData) => {
        if (onlinePlayers[socket.id]) {
            onlinePlayers[socket.id].x = movementData.x;
            onlinePlayers[socket.id].y = movementData.y;
            onlinePlayers[socket.id].dir = movementData.dir;
            onlinePlayers[socket.id].gameMode = movementData.gameMode;
            onlinePlayers[socket.id].score = movementData.score;
            socket.broadcast.emit('playerMoved', { id: socket.id, info: onlinePlayers[socket.id] });
        }
    });

    socket.on('disconnect', () => {
        delete onlinePlayers[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`[ONLINE] Сервер запущен на порту: ${PORT}`);
});
