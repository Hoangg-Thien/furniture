# Spring Boot backend

The backend connects to the Supabase PostgreSQL database using the PostgreSQL JDBC driver already declared in `pom.xml`. It exposes a read-only catalog endpoint at `GET http://localhost:8080/api/products` for the React storefront.

## Configure Supabase

1. In Supabase, open **Project Settings > Database > Connection string** and choose **Session pooler**. Use the host, port, database, and username shown for your project. A JDBC URL has this shape: `jdbc:postgresql://<pooler-host>:<port>/postgres?sslmode=require`. If you have a URI beginning with `postgresql://`, do not use it unchanged: make the JDBC URL from its host, port, and database parts, and set its username and password in the separate variables below. Keep `sslmode=require`.
2. If the database schema has not been installed yet, run `../database/sales.sql` in the Supabase SQL Editor. Then run `../database/supabase_storefront.sql` to add the product image column and sample catalog rows.
3. In PowerShell, set the connection values in the terminal where the backend will run. These are PostgreSQL connection credentials, not the Supabase anon key or service-role key:

```powershell
$env:SUPABASE_DB_URL = "jdbc:postgresql://<pooler-host>:<port>/postgres?sslmode=require"
$env:SUPABASE_DB_USERNAME = "<pooler-username>"
$env:SUPABASE_DB_PASSWORD = "<database-password>"
.\mvnw.cmd spring-boot:run
```

The application uses `ddl-auto: validate`, so Hibernate checks mappings but does not create or modify tables. Keep the database password out of source control and chat. If a password has already been shared, rotate it in Supabase before using the connection.

## Verify

With the backend running, open `http://localhost:8080/api/products` or run `Invoke-RestMethod http://localhost:8080/api/products` in PowerShell. The Vite app defaults to this backend URL; set `VITE_API_BASE_URL` in `frontend/.env` only if it runs elsewhere.

The catalog endpoint is the first backend API. Cart persistence, authentication, and order submission are not implemented yet.
