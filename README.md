# Math Mentor


## Install necessary libraries(Ubuntu, Linux)
```
sudo apt install gettext ffmpeg redis-server postgresql -y 
```

### Make sure to start and enable redis server
```
sudo systemctl enable redis-server
```

```
sudo systemctl start redis-server
```

### Backend
Follow the [instruction](backend/README.md) to run the backend server.

### Frontend
Follow the [instruction](frontend/README.md) to run the frontend server.