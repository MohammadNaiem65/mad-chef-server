# Role Promotion API Documentation

This document outlines the API endpoints related to role promotion functionality in the application.

**_The Root URL is `/roles`_**

## Apply for Promotion

Submits an application for role promotion.

-   **URL:** `/apply-for-promotion`
-   **Method:** `POST`
-   **Auth Required:** Yes

### Query Parameters

| Parameter | Type   | Description                           | Required |
| --------- | ------ | ------------------------------------- | -------- |
| `role`    | String | Role to apply for (`chef` or `admin`) | Yes      |

### Response

```json
{
    "message": "Successful",
    "data": {
        // Created role promotion application object
    }
}
```

## Check Application Status

Checks if a user has already applied for a promotion.

-   **URL:** `/has-applied-for-promotion`
-   **Method:** `GET`
-   **Auth Required:** Yes

### Query Parameters

| Parameter | Type   | Description                   | Required |
| --------- | ------ | ----------------------------- | -------- |
| `role`    | String | Role to check application for | Yes      |

### Response

```json
{
    "message": "User has/has not applied for promotion",
    "data": {
        "status": true/false
    }
}
```

## Get Role Promotion Application

Retrieves a specific role promotion application.

-   **URL:** `/role-promotion-application/:applicationId`
-   **Method:** `GET`
-   **Auth Required:** Yes (Admin only)

### URL Parameters

| Parameter       | Type   | Description                   | Required |
| --------------- | ------ | ----------------------------- | -------- |
| `applicationId` | String | MongoDB ID of the application | Yes      |

### Response

```json
{
    "message": "Successful",
    "data": {
        // Role promotion application object
    }
}
```

## Get Role Promotion Applications

Retrieves a list of role promotion applications.

-   **URL:** `/role-promotion-applications`
-   **Method:** `GET`
-   **Auth Required:** Yes (Admin only)

### Query Parameters

| Parameter | Type    | Description                      | Default              |
| --------- | ------- | -------------------------------- | -------------------- |
| `p`       | Integer | Page number                      | `1`                  |
| `page`    | Integer | Alternative for `p`              | `0`                  |
| `l`       | Integer | Number of items per page         | `CHEFS_PER_PAGE` env |
| `limit`   | Integer | Alternative for `l`              | `CHEFS_PER_PAGE` env |
| `sort`    | String  | Field to sort by                 | `'updatedAt'`        |
| `order`   | String  | Sort order (`'asc'` or `'desc'`) | `'desc'`             |

### Response

```json
{
    "data": [
        {
            // Role promotion application objects
        }
    ],
    "meta": {
        "page": 1,
        "totalCount": 100
    }
}
```

## Update Promotion Application Status

Updates the status of a role promotion application.

-   **URL:** `/update-promotion-application-status`
-   **Method:** `PATCH`
-   **Auth Required:** Yes (Admin only)

### Query Parameters

| Parameter | Type   | Description                         | Required |
| --------- | ------ | ----------------------------------- | -------- |
| `id`      | String | MongoDB ID of the application       | Yes      |
| `status`  | String | New status code for the application | Yes      |

### Response

```json
{
    "message": "Successfully updated the status",
    "data": {
        // Updated role promotion application object
    }
}
```

## Delete Promotion Application

Deletes a role promotion application.

-   **URL:** `/delete-promotion-application/:id`
-   **Method:** `DELETE`
-   **Auth Required:** Yes (Admin only)

### URL Parameters

| Parameter | Type   | Description                   | Required |
| --------- | ------ | ----------------------------- | -------- |
| `id`      | String | MongoDB ID of the application | Yes      |

### Query Parameters

| Parameter | Type   | Description                   | Required |
| --------- | ------ | ----------------------------- | -------- |
| `id`      | String | MongoDB ID of the application | No       |

Note: The `id` can be provided either in the URL or as a query parameter.

### Response

```json
{
    "message": "Successfully deleted the application",
    "data": {
        // Deletion result
    }
}
```

## Notes

-   Endpoints for getting all applications, getting a specific application, updating application status, and deleting an application require admin privileges (`checkAdmin` middleware).
-   For the `applyForPromotion` endpoint, the `role` must be either 'chef' or 'admin'.
-   Applications with certain statuses (e.g., `accepted` or `rejected`) cannot be deleted.
-   Error responses for all endpoints follow this format:
    ```json
    {
        "message": "Error message",
        "error": "Detailed error description"
    }
    ```
