const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" } // Разрешаем подключения из любой точки мира
});

let onlinePlayers = {};

io.on('connection', (socket) => {
    console.log(`Игрок зашел в сеть: ${socket.id}`);
    
    // Создаем персонажа для зашедшего игрока
    onlinePlayers[socket.id] = {
        x: 100,
        y: 200,
        dir: 1,
        name: "Кот_" + socket.id.substring(0, 4),
        score: 0,
        gameMode: "LOBBY"
    };

    // Отправляем игроку карту и список тех, кто уже в лобби
    socket.emit('currentPlayers', onlinePlayers);
    
    // Оповещаем остальных, что зашел новый Кот
    socket.broadcast.emit('newPlayer', { id: socket.id, info: onlinePlayers[socket.id] });

    // Постоянно принимаем координаты от каждого игрока
    socket.on('playerMovement', (movementData) => {
        if (onlinePlayers[socket.id]) {
            onlinePlayers[socket.id].x = movementData.x;
            onlinePlayers[socket.id].y = movementData.y;
            onlinePlayers[socket.id].dir = movementData.dir;
            onlinePlayers[socket.id].gameMode = movementData.gameMode;
            onlinePlayers[socket.id].score = movementData.score;
            
            // Срочно транслируем его новые координаты всем остальным
            socket.broadcast.emit('playerMoved', { id: socket.id, info: onlinePlayers[socket.id] });
        }
    });

    // Обработка выхода из игры
    socket.on('disconnect', () => {
        console.log(`Игрок вышел: ${socket.id}`);
        delete onlinePlayers[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

// Автоматический порт для хостингов (Render, Heroku и т.д.) или 3000 для ПК
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`[ONLINE] Сервер запущен на порту: ${PORT}`);
});
