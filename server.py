from flask import Flask, send_from_directory
from flask_socketio import SocketIO, emit
import os

# Инициализируем Flask. Точка означает, что сервер ищет файлы в текущей папке
app = Flask(__name__, static_folder='.')
# Разрешаем безопасное подключение игроков со всего мира
socketio = SocketIO(app, cors_allowed_origins="*")

online_players = {}

# ГЛАВНЫЙ МАРШРУТ: Отдает index.html, когда кто-то заходит на твой Render
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# Сетевое событие: Игрок зашел в игру
@socketio.on('connect')
def handle_connect():
    import flask
    sid = flask.request.sid
    print(f"[СЕТЬ] Подключился новый Кот: {sid}")
    
    # Базовые координаты нового игрока
    online_players[sid] = {
        'x': 100,
        'y': 200,
        'dir': 1,
        'name': f"Кот_{sid[:4]}",
        'score': 0,
        'gameMode': "LOBBY"
    }
    
    # Отправляем ему список тех, кто уже играет
    emit('currentPlayers', online_players)
    # Всем остальным объявляем о новичке
    emit('newPlayer', {'id': sid, 'info': online_players[sid]}, broadcast=True, include_self=False)

# Сетевое событие: Обновление координат (бег, прыжки)
@socketio.on('playerMovement')
def handle_movement(movement_data):
    import flask
    sid = flask.request.sid
    if sid in online_players:
        online_players[sid].update({
            'x': movement_data['x'],
            'y': movement_data['y'],
            'dir': movement_data['dir'],
            'gameMode': movement_data['gameMode'],
            'score': movement_data['score']
        })
        # Пересылаем его шаги всем остальным игрокам на карте
        emit('playerMoved', {'id': sid, 'info': online_players[sid]}, broadcast=True, include_self=False)

# Сетевое событие: Выход из игры
@socketio.on('disconnect')
def handle_disconnect():
    import flask
    sid = flask.request.sid
    print(f"[СЕТЬ] Кот отключился: {sid}")
    if sid in online_players:
        del online_players[sid]
        emit('playerDisconnected', sid, broadcast=True)

if __name__ == '__main__':
    # Render сам выдает нужный порт через переменную PORT. Если запускаешь на ПК — будет порт 5000
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port)
