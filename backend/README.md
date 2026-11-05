# Spring Boot backend

The backend connects to the Supabase PostgreSQL database using the PostgreSQL JDBC driver already declared in `pom.xml`. It exposes a read-only catalog endpoint at `GET http://localhost:8080/api/products` for the React storefront.

## Configure Supabase

1. In Supabase, open **Project Settings > Database > Connection string** and choose **Session pooler**. Use the host, port, database, and username shown for your project. A JDBC URL has this shape: `jdbc:postgresql://<pooler-host>:<port>/postgres?sslmode=require`. If you have a URI beginning with `postgresql://`, do not use it unchanged: make the JDBC URL from its host, port, and database parts, and set its username and password in the separate variables below. Keep `sslmode=require`.
2. For an empty database, start the backend from this checkout with `../database/sales.sql` and `../database/admin_schema_extension.sql` available. The initializer loads the base/admin schema and applies permission migrations.
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

The backend supports customer orders and an administration portal. Staff accounts keep `role=STAFF` and have one business position: `SALES`, `WAREHOUSE`, or `CONTENT`. Admins assign positions in the employee screen. See [the implementation plan and permission matrix](../doc_kehoach/13_PHAN_QUYEN_NHAN_VIEN.md).

Startup applies `staff_permissions.sql` to existing and new databases. Existing staff default to `SALES`; reassign warehouse/content employees as needed. Existing sessions must sign in again. Admin login uses `POST /api/auth/admin/login`; protected APIs require the returned bearer token and read current permissions from the database. Customer login/registration also returns a token for private order/profile APIs.

When bootstrapping an empty database from this checkout, keep both `database/sales.sql` and `database/admin_schema_extension.sql` available next to each other. Startup loads the existing admin schema after the base seed before applying permissions. Test migrations with the isolated QA harness before running against a live database.
