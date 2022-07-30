# Sync-static-server

## Информация

Статический http сервер с возможностью синхронизации контента с git репозиторием.

## Оглавление:
- [Установка](#install)
- [Запуск](#launch)
- [Конфигурация](#configuration)
- [API](#api)

## <a name="install"></a> Запуск

пример строки запуска: `node /sync-static-server/app.js -c config.toml`

## <a name="launch"></a> Таблица ключей запуска

Ключ | Описание
------------ | -------------
--version, -v | вывести номер версии приложения
--help, -h | вызвать справку по ключам запуска
--config, -c | путь к файлу конфигурации в формате toml или json, (переменная среды: SYNC_STATIC_SERVER_CONFIG_PATH)

## <a name="configuration"></a> Конфигурация

Программа настраивается через файл конфигурации форматов TOML, JSON, YML и YAML. Так же можно настраивать через переменные среды, которые будут считаться первичными.

### Пример файла конфигурации config.toml

```toml
[logger]                    # настройка логгера
    name = ""               # имя логгера
    enable = true           # активация
    level = "error"         # уровень (fatal, error, warn, info, debug, trace)
    timestamp = "none"      # вывод времени full, short, unix и none

[api]
    enable = false              # активация API сервера
    logging = false             # логирование запросов (ключ logger.level = "debug" или ниже)
    hostname = "0.0.0.0"        # хост          
    port = 3001                 # порт
    backlog = 511               # очередь баклога
    prefix = "/api"             # префикс
    connection_timeout = 0      # таймаут сервера в миллисекундах
    keep_alive_timeout = 5000   # таймаут keep-alive сервера в миллисекундах
    body_limit = "1mb"          # максимальный размер тела запроса (b, kb, mb)
    trust_proxy = false         # доверие proxy заголовку

[web]
    enable = false              # активация WEB сервера
    logging = false             # логирование запросов (ключ logger.level = "debug" или ниже)
    hostname = "0.0.0.0"        # хост          
    port = 3001                 # порт
    backlog = 511               # очередь баклога
    prefix = "/api"             # префикс
    connection_timeout = 0      # таймаут сервера в миллисекундах
    keep_alive_timeout = 5000   # таймаут keep-alive сервера в миллисекундах
    body_limit = "1mb"          # максимальный размер тела запроса (b, kb, mb)
    trust_proxy = false         # доверие proxy заголовку
    [web.store]                 # настройка сервера
        path = "static"         # папка root сервера
        hidden = false          # видимость скрытых файлов
    [web.synchronization]                                                   # синхронизация
        enable = false                                                      # активация
        [web.synchronization.source]                                        # настройка источника
            type = "git"                                                    # тип источника
            include_regexp = [".*"]                                         # файлы будут включены в поиск        
            exclude_regexp = ["\\.md$"]                                     # файлы будут исключены из поиска
            tmp = "tmp"                                                     # временная папка
            size = "200kb"                                                  # максимальный размер файла
            commit_count = 10                                               # количество хранимых коммитов
            repository = "https://user:password@localhost/repository.git"   # репозиторий
            branch = "main"                                                 # ветка репозитория
            [namespaces.source.cron]            # настройка обновления
                enable = true                   # активация
                jitter = 3                      # интервал дрожания
                interval = "*/15 * * * * *"     # интервал
                time_zone = "Europe/Moscow"     # временная зона
```

### Настройка через переменные среды

Ключи конфигурации можно задать через переменные среды ОС. Имя переменной среды формируется из двух частей, префикса `SYNC_STATIC_SERVER_` и имени переменной в верхнем реестре. Если переменная вложена, то это обозначается символом `_`. Переменные среды имеют высший приоритет.

пример для переменной **api.enable**: `SYNC_STATIC_SERVER_API_ENABLE`

## <a name="api"></a> API

Сервис предоставляет API, который настраивается в секции файла настройки **api**. API доступно по протоколу HTTP.

### Примеры применения

проверить доступность сервера: `curl -i http://localhost:3001/api/healthcheck` или `curl -i http://localhost:3001/api/`  

### API информации сервиса

| URL | Метод | Код | Описание | Пример ответа/запроса |
| ----- | ----- | ----- | ----- | ----- |
| / | GET | 200 | проверить здоровье сервиса | OK |
| /healthcheck | GET | 200 | проверить здоровье сервиса | OK |
| /healthcheck/liveness | GET | 200 | проверить работы сервиса | OK |
| /healthcheck/readiness | GET | 200 | проверить готовности сервиса | OK |
