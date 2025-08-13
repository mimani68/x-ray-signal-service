# Signals Module

## Stack Overview

This project is built using the following technologies:

- **Backend Framework**: NestJS (Node.js framework for building efficient, scalable server-side applications).
- **Database**: MongoDB with Mongoose ODM for schema modeling and data interactions.
- **Language**: TypeScript for type-safe development.
- **API Documentation**: Swagger (integrated via NestJS Swagger module).
- **Other Dependencies**: Includes libraries like `@nestjs/common`, `@nestjs/mongoose`, and utilities for parsing and validation.

## Signal Schema

The `Signal` schema (defined in `src/signals/schemas/signal.schema.ts`) represents signal documents in MongoDB with the following fields:

- **deviceId**: `string` (required) - Identifier for the device.
- **data**: `Array<[number, [number, number, number]]>` (required) - Array of signal data points, each containing a number and a triplet [number, number, number].
- **time**: `number` (required) - Timestamp or time value for the signal.
- **timestamps**: Automatically added `createdAt` and `updatedAt` fields.

## API Endpoints

### GET /signals

Fetches a paginated list of signals with optional filtering by device ID and time range.

**Query Parameters:**
- `deviceId`: `string` (optional) - Filter by device ID.
- `startTime`: `number` (optional) - Filter by start time (timestamp).
- `endTime`: `number` (optional) - Filter by end time (timestamp).
- `page`: `number` (default: 1) - Page number for pagination.
- `limit`: `number` (default: 10) - Number of items per page.

**Response:**
- An object containing:
  - `data`: Array of `Signal` objects.
  - `total`: Total number of matching signals.
  - `page`: Current page number.
  - `limit`: Items per page.

This endpoint is handled by the `SignalsController` in `src/signals/controllers/signals.controller.ts`.


## Development

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Yarn or npm for package management

### Setup
1. Clone the repository: `git clone <repo-url>`
2. Install dependencies: `npm install` or `yarn install`
3. Configure environment variables (e.g., in `.env` file): Set `MONGODB_URI` for database connection.
4. Run the application: `npm run start:dev` or `yarn start:dev` for development mode with hot-reloading.

### Scripts
- `start`: Run in production mode.
- `start:dev`: Run in development mode.
- `build`: Compile TypeScript to JavaScript.
- `lint`: Run ESLint for code linting.

## Architecture

The project follows NestJS's modular architecture:

- **Modules**: Core `SignalsModule` handles signals-related logic.
- **Controllers**: `SignalsController` manages API endpoints (e.g., GET /signals).
- **Services**: `SignalsService` contains business logic, such as querying the database.
- **Schemas**: Mongoose schemas (e.g., `signal.schema.ts`) define data models.
- **Database Layer**: Uses Mongoose for MongoDB interactions.
- **Overall Structure**: Adheres to MVC-like pattern with dependency injection, promoting scalability and maintainability.

## Testing

Testing is set up using Jest, the default testing framework for NestJS.

- **Unit Tests**: Test individual components like services and controllers in isolation (located in `test/` or alongside source files with `.spec.ts` extension).
- **E2E Tests**: End-to-end tests for API endpoints (using Supertest).
- **Running Tests**:
  - All tests: `npm run test` or `yarn test`
  - E2E tests: `npm run test:e2e` or `yarn test:e2e`
  - Coverage: `npm run test:cov` or `yarn test:cov`
