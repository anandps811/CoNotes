# Backend (Real-time Collaborative Notes)

## Setup

1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and update values.
4. `npm run dev`

## Folder Structure

```txt
backend
│
├── config
│   └── db.ts
├── controllers
│   ├── authController.ts
│   └── noteController.ts
├── middleware
│   ├── authMiddleware.ts
│   └── errorMiddleware.ts
├── models
│   ├── User.ts
│   └── Note.ts
├── routes
│   ├── authRoutes.ts
│   └── noteRoutes.ts
├── services
│   └── noteService.ts
├── sockets
│   └── noteSocket.ts
├── utils
│   ├── generateToken.ts
│   └── hashPassword.ts
└── server.ts
```

## REST API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `GET /api/notes`
- `GET /api/notes/:id`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`
- `POST /api/notes/:id/share`
- `DELETE /api/notes/:id/collaborators/:userId`
- `PATCH /api/notes/:id/collaborators/:userId/permission`

## Socket.IO Events

Client emits:
- `join-note` -> `noteId`
- `leave-note` -> `noteId`
- `note-update` -> `{ noteId, title?, content? }`
- `typing-start` -> `{ noteId }`
- `typing-stop` -> `{ noteId }`

Server emits:
- `note-update`
- `presence-update`
- `user-joined`
- `user-left`
- `typing-start`
- `typing-stop`
- `socket-error`

## Authorization Rules

- Owner can fully manage note and collaborators.
- Editor collaborator can edit note content/title.
- Viewer collaborator can only view.
