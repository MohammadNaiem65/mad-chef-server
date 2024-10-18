# Consult API Documentation

This document outlines the API endpoints related to consult functionality in our application.

**The Root URL is `/consults`**

## Get Consults

Retrieves a list of consults based on specified criteria.

-   **URL:** `/`
-   **Method:** `GET`
-   **Auth Required:** Yes

### Query Parameters

| Parameter | Type   | Description                                   | Default |
| --------- | ------ | --------------------------------------------- | ------- |
| `status`  | String | Comma-separated list of statuses to filter by | None    |
| `date`    | JSON   | Date range to filter by                       | None    |

### Response

```json
{
    "message": "Successful",
    "data": [
        {
            // Consult object
        }
    ]
}
```

## Create Consult

Creates a new consult document. This endpoint is only available for students with a 'pro' package.

-   **URL:** `/consult` or `/`
-   **Method:** `POST`
-   **Auth Required:** Yes

### Request Body

| Parameter   | Type   | Description                    | Required |
| ----------- | ------ | ------------------------------ | -------- |
| `username`  | String | Name of the student            | Yes      |
| `userEmail` | String | Email of the student           | Yes      |
| `chefId`    | String | MongoDB ID of the chef         | Yes      |
| `chefName`  | String | Name of the chef               | Yes      |
| `date`      | String | Date of the consultation       | Yes      |
| `startTime` | String | Start time of the consultation | Yes      |
| `endTime`   | String | End time of the consultation   | Yes      |

### Response

```json
{
    "message": "Successfully booked",
    "data": {
        // Created consult object
    }
}
```

## Cancel Consult

Cancels an existing consult.

-   **URL:** `/consult/:consultId` or `/:consultId`
-   **Method:** `PATCH`
-   **Auth Required:** Yes

### URL Parameters

| Parameter   | Type   | Description           | Required |
| ----------- | ------ | --------------------- | -------- |
| `consultId` | String | MongoDB ID of consult | Yes      |

### Response

```json
{
    "message": "Successfully cancelled the consultation",
    "data": {
        // Updated consult object
    }
}
```

## Manage Consult Status Updates

Updates the status of a consult (Chef only).

-   **URL:** `/chef/consult/:consultId` or `/chef/:consultId`
-   **Method:** `PATCH`
-   **Auth Required:** Yes (Chef only)

### URL Parameters

| Parameter   | Type   | Description           | Required |
| ----------- | ------ | --------------------- | -------- |
| `consultId` | String | MongoDB ID of consult | Yes      |

### Request Body

| Parameter | Type   | Description                         | Required    |
| --------- | ------ | ----------------------------------- | ----------- |
| `status`  | String | New status for the consult          | Yes         |
| `link`    | String | Join link (if status is 'accepted') | Conditional |

### Response

```json
{
    "message": "Successfully updated the status",
    "data": {
        // Updated consult object
    }
}
```

## Delete Consult

Deletes a consult document.

-   **URL:** `/consult/:consultId` or `/:consultId`
-   **Method:** `DELETE`
-   **Auth Required:** Yes

### URL Parameters

| Parameter   | Type   | Description           | Required |
| ----------- | ------ | --------------------- | -------- |
| `consultId` | String | MongoDB ID of consult | Yes      |

### Response

```json
{
    "message": "Successfully deleted the consult",
    "data": {
        // Deletion result
    }
}
```
