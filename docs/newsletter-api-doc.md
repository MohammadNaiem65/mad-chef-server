# Newsletter Subscription API Documentation

This document outlines the API endpoints related to newsletter functionality in the application.

**_The Root URL is `/newsletter`_**

## Subscribe to Newsletter

Subscribes a user to the newsletter.

-   **URL:** `/subscribe`
-   **Method:** `POST`
-   **Auth Required:** No

### Request Body

| Parameter | Type   | Description                               | Required |
| --------- | ------ | ----------------------------------------- | -------- |
| `email`   | String | Email address for newsletter subscription | Yes      |
| `userId`  | String | MongoDB ID of the user (if applicable)    | No       |

### Response

#### Success (Status Code: 201)

```json
{
    "message": "Successfully subscribed to newsletter.",
    "data": {
        // Newsletter subscription object
    }
}
```

#### Error Responses

1. Missing Email (Status Code: 400)

    ```json
    {
        "message": "An email is required to subscribe to newsletter."
    }
    ```

2. Already Subscribed (Status Code: 409)

    ```json
    {
        "message": "You are already subscribed to the newsletter."
    }
    ```

3. Server Error (Status Code: 500)
    ```json
    {
        "message": "An error occurred while subscribing to the newsletter."
    }
    ```
