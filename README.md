# Email Tracer Backend

This is the backend service for LucidGrowth, a NestJS-based application for checking and analyzing email deliverability. It connects to an IMAP server to fetch emails, parses them, and stores the results in a MongoDB database.

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/)

### Installation

1.  Clone the repository:
    ```bash
    git clone git@github.com:CodeForgeNet/EmailTracer_backend.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd EmailTracer_backend
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

### Configuration

Create a `.env` file in the root of the project by copying the `.env.example` file and add the following environment variables:

```
MONGODB_URI=<your_mongodb_connection_string>
IMAP_USER=<your_imap_username>
IMAP_PASS=<your_imap_password>
IMAP_HOST=<your_imap_host>
IMAP_PORT=<your_imap_port>
```

- `MONGODB_URI`: The connection string for your MongoDB database.
- `IMAP_USER`: The username for the IMAP server you want to connect to.
- `IMAP_PASS`: The password for the IMAP server.
- `IMAP_HOST`: The hostname of the IMAP server (e.g., `imap.gmail.com`).
- `IMAP_PORT`: The port of the IMAP server (e.g., `993`).

## Running the Application

To start the development server, run:

```bash
npm run start:dev
```

To build and run the application in production mode, run:

```bash
npm run start:prod-file
```

The application will be available at `http://localhost:3000`.

## API Endpoints

- `GET /`: A simple endpoint to check if the service is running.
- `GET /email/config`: Returns the current IMAP configuration.
- `POST /email/check`: Triggers a check for new emails on the configured IMAP server.
- `GET /email/latest`: Returns the results of the latest email check.
- `GET /email/:id`: Returns a specific email check result by its ID.
- `POST /email/recheck?subject=<subject>`: Triggers a manual recheck for emails with a specific subject.
- `GET /email/subject/:subject`: Returns all email check results for a given subject.

## Project Structure

```
├── src
│   ├── app.module.ts
│   ├── main.ts
│   ├── email
│   │   ├── email.controller.ts
│   │   ├── email.model.ts
│   │   ├── email.module.ts
│   │   └── email.service.ts
│   ├── imap
│   │   ├── imap.module.ts
│   │   └── imap.service.ts
│   └── mongo
│       └── mongo.ts
├── test
└── ...
```

- `src`: Contains the source code of the application.
  - `email`: Module for handling email-related logic and API endpoints.
  - `imap`: Module for connecting to and fetching emails from an IMAP server.
  - `mongo`: Module for connecting to the MongoDB database.
- `test`: Contains the end-to-end tests.

## Technologies Used

- [NestJS](https://nestjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [imap-simple](https.com/npm/imap-simple)
- [mailparser](https://www.npmjs.com/package/mailparser)
- [TypeScript](https://www.typescriptlang.org/)

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## License

This project is licensed under the UNLICENSED License.
