# PujaCollectionTracker

Welcome to the **Durga Pujo Collection Tracker** backend API solution built with Clean Architecture!

## Getting Started

- Build the solution:
  ```sh
  dotnet build
  ```
- Run the Web API project:
  ```sh
  dotnet run --project src/PujaCollectionTracker.Web
  ```
- Swagger UI / OpenAPI docs are available at `/swagger` or `/scalar/v1` when running locally.

## Solution Structure

- **Core**: Domain entities (`PaymentCollection`, `Flat`, `User`, `Role`, `ExceptionLog`), value objects, interfaces
- **UseCases**: Application logic, CQRS handlers, reports, export features
- **Infrastructure**: Entity Framework Core, SQLite/SqlServer data access, security, email
- **Web**: FastEndpoints REST API endpoints, JWT auth, middleware, OpenAPI documentation

