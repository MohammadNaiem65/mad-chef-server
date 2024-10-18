# Authentication API Documentation

This document outlines the API endpoints related to authentication functionality in our application.

**_The Root URL is `/auth`_**

## Table of Contents

1. [Authenticate User](#authenticate-user)
2. [Refresh Authentication Token](#refresh-authentication-token)
3. [Logout User](#logout-user)

## Authenticate User

Authenticates a user using a Firebase ID token and either logs them in or registers a new account.

-   **URL:** `/` or `/login`
-   **Method:** `POST`
-   **Auth Required:** No (Firebase token required in header)

### Headers

| Header          | Value                      |
| --------------- | -------------------------- |
| `Authorization` | Bearer [Firebase ID Token] |

### Request Body (for registration)

```json
{
    "reqType": "registration"
}
```

### Response (successful login)

```json
{
    "message": "Login successful",
    "data": {
        "user": {
            "userId": "string",
            "role": "string",
            "firebaseId": "string",
            "userEmail": "string",
            "emailVerified": "boolean",
            "pkg": "string" // if applicable
        },
        "accessToken": "string"
    }
}
```

### Response (successful registration)

```json
{
    "message": "Registration successful"
}
```

### Cookies Set

-   `refreshToken`: HTTP-only cookie containing the refresh token

## Refresh Authentication Token

Refreshes the user's authentication by using a refresh token stored in cookies.

-   **URL:** `/refresh-token`
-   **Method:** `GET`
-   **Auth Required:** No (Refresh token required in cookies)

### Cookies Required

-   `refreshToken`: HTTP-only cookie containing the refresh token

### Response

```json
{
    "message": "Reauthentication successful",
    "data": {
        "user": {
            "userEmail": "string",
            "userId": "string",
            "firebaseId": "string",
            "emailVerified": "boolean",
            "role": "string",
            "pkg": "string" // if applicable
        },
        "accessToken": "string"
    }
}
```

### Cookies Set

-   `refreshToken`: Updated HTTP-only cookie containing the new refresh token

## Logout User

Logs out a user by invalidating their refresh token.

-   **URL:** `/logout/:userId`
-   **Method:** `DELETE`
-   **Auth Required:** No

### URL Parameters

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `userId`  | String | User's ID   |

### Response

```json
{
    "message": "Logout successful"
}
```

### Cookies Cleared

-   `jwt`: The refresh token cookie is cleared

### Error Responses

---

### 400 Bad Request

```json
{
    "message": "User validation failed"
}
```

or

```json
{
    "message": "The user with the email does not exist"
}
```

### 401 Unauthorized

```json
{
    "message": "No authentication token provided"
}
```

or

```json
{
    "error": "No refresh token provided"
}
```

### 403 Forbidden

```json
{
    "message": "Firebase auth token expired"
}
```

or

```json
{
    "error": "Invalid refresh token"
}
```

or

```json
{
    "error": "Refresh token expired"
}
```

### 409 Conflict

```json
{
    "message": "A user with the [field] already exists"
}
```

### 500 Internal Server Error

```json
{
    "message": "Internal server error"
}
```

or

```json
{
    "message": "Something went wrong. Try again later"
}
```
