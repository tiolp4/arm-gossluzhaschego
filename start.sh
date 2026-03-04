#!/bin/bash

# Защита от повторного запуска
LOCKFILE="/tmp/arm-gossluzhaschego.lock"

if [ -f "$LOCKFILE" ]; then
    PID=$(cat "$LOCKFILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "Уже запущено (PID: $PID), выход"
        exit 0
    fi
fi

echo $$ > "$LOCKFILE"

# Ждём загрузку графической сессии
sleep 3

cd /home/kassir/arm-gossluzhaschego

./node_modules/.bin/electron . --no-sandbox >> /home/kassir/arm-gossluzhaschego/app.log 2>&1

# Убираем lock при завершении
rm -f "$LOCKFILE"
