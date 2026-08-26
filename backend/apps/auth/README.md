# API
### Registration

#### After successfully registering an user. An OTP will be send to user email or phone. While registering either email or phone is required.

### Student Registration

##### `/api/auth/student-register/`
#### body 
```
{
    "email": "student1@test.com",
    "phone: "+8800000001"
    "full_name": "Student One",
    "username": "student1",
    "password": "student",
    "confirm_password": "student"
}
```


### Parent Registration

##### `/api/auth/parent-register/`
#### body 
```
{
    "email": "parent1@test.com",
    "phone: "+8800000002"
    "full_name": "Parent One",
    "username": "parent1",
    "password": "parent",
    "confirm_password": "parent"
}
```


### Tutor Registration

##### `/api/auth/tutor-register/`
#### body 
```
{
    "email": "tutor1@test.com",
    "phone: "+8800000003"
    "full_name": "Tutor One",
    "username": "tutor1",
    "password": "tutor",
    "confirm_password": "tutor"
}
```

### Login
### Student Login

##### `/api/auth/student-login/`
#### body 
```
{
    "username": "student1",
    "password": "student",
}

```

### Parent Login

##### `/api/auth/parent-login/`
#### body 
```
{
    "username": "parent1",
    "password": "parent",
}
```


### Tutor Login

##### `/api/auth/tutor-login/`
#### body 
```
{
    "username": "tutor1",
    "password": "tutor",
}
```

### Forgot Passoword

##### `/api/auth/forgot-password/`
#### body 
```
{
  "email": "user@test.com",
  "phone": "8800000001"
}
```
#### An OTP will sent to their email or phone.


### Reset Passoword

##### `/api/auth/reset-password/`
#### body 
```
{
  "password": "new_password",
  "confirm_password": "new_password",
  "otp": "1234"
}
```


### User List(Get)

##### `/api/auth/users/`


### User Detail(Get, Delete)

##### `/api/auth/users/{id}`