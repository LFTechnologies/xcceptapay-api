# XceptaPay API

_Node.js Express API with MongoDB for handling XceptaPay transactions._

## Overview

The XceptaPay API provides a backend service to handle BLE-based XRP transactions securely and efficiently. It offers endpoints to process payments, manage user accounts, and track transaction history.

## Features

- RESTful API with Express.js
- MongoDB database for storing user and transaction data
- JWT authentication for secure API access
- Transaction validation and logging
- Scalable and modular codebase

## Requirements

### Software

- Node.js (v14 or higher)
- MongoDB (v4 or higher)

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/xceptapay-api.git
   cd xceptapay-api
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/xceptapay
   JWT_SECRET=your_secret_key
   ```
4. Start the server:
   ```sh
   npm start
   ```

## API Endpoints

| Method | Endpoint         | Description                  |
|--------|-----------------|------------------------------|
| POST   | /api/users       | Register a new user          |
| POST   | /api/auth/login  | Authenticate and get a token |
| POST   | /api/transactions| Process a new transaction    |
| GET    | /api/history     | Retrieve transaction history |

## Usage

1. Register a new user using the `/api/users` endpoint.
2. Authenticate with the `/api/auth/login` endpoint to obtain a JWT.
3. Submit a transaction via the `/api/transactions` endpoint.
4. Fetch transaction history from the `/api/history` endpoint.

## Authentication

- The API uses JWT for authentication.
- Pass the JWT token in the `Authorization` header for secured endpoints.

## Database Schema

### User Collection
```json
{
  "_id": "ObjectId",
  "username": "string",
  "email": "string",
  "password": "string",
  "createdAt": "date"
}
```

### Transaction Collection
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "amount": "number",
  "status": "string",
  "createdAt": "date"
}
```

## Deployment

### Using Docker

1. Build the Docker image:
   ```sh
   docker build -t xceptapay-api .
   ```
2. Run the container:
   ```sh
   docker run -d -p 3000:3000 --env-file .env xceptapay-api
   ```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature-name`).
3. Commit your changes (`git commit -m 'Add feature'`).
4. Push to your branch (`git push origin feature-name`).
5. Create a pull request.

## License

This project is licensed under the MIT License.

## Support

For any issues, please open a ticket on the [GitHub Issues page](https://github.com/yourusername/xceptapay-api/issues).

