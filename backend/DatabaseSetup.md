# Database Setup
## PostgreSQL

### Install or download postgresql
#### [PostgreSQL](https://www.postgresql.org/download/)

### Login to PostgreSQL
```sudo -u postgres psql```

### Create a new database and a user.

```
CREATE DATABASE mathmentor;
CREATE USER root WITH PASSWORD 'password';
ALTER ROLE root SET client_encoding TO 'utf8';
ALTER ROLE root SET default_transaction_isolation TO 'read committed';
ALTER ROLE root SET timezone TO 'UTC';
```
### Go to that database
```
\c mathmentor
```
### Grant Privileges
```
GRANT ALL PRIVILEGES ON DATABASE mathmentor TO root;
GRANT ALL ON SCHEMA public TO root;
GRANT USAGE ON SCHEMA public TO root;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO root;
ALTER SCHEMA public OWNER TO root;
```