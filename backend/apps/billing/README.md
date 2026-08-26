```
celery-beat.service
    [Unit]
    Description=Celery Beat (Math Mentor)
    After=network.target redis-server.service

    [Service]
    Type=simple
    User=<DEPLOY_USER>
    WorkingDirectory=<BACKEND_PATH>
    EnvironmentFile=<BACKEND_PATH>/.env
    ExecStart=<BACKEND_PATH>/.venv/bin/celery -A lms beat -l info
    Restart=always
    RestartSec=5

    [Install]
    WantedBy=multi-user.target
```

```
celery-worker.service
    [Unit]
    Description=Celery Worker (Math Mentor)
    After=network.target redis-server.service

    [Service]
    Type=simple
    User=<DEPLOY_USER>
    WorkingDirectory=<BACKEND_PATH>
    EnvironmentFile=<BACKEND_PATH>/.env
    ExecStart=<BACKEND_PATH>/.venv/bin/celery -A lms worker -l info
    Restart=always
    RestartSec=5

    [Install]
    WantedBy=multi-user.target
```