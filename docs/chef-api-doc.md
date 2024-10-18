# Chef API Documentation

This document outlines the API endpoints related to chef functionality in our application.

**The Root URL is `/chefs`**

## Table of Contents

1. [Get All Chefs](#get-all-chefs)
2. [Get Single Chef](#get-single-chef)
3. [Get Chef Reviews](#get-chef-reviews)
4. [Create Chef Review](#create-chef-review)
5. [Update Chef Data](#update-chef-data)
6. [Upload Chef Profile Picture](#upload-chef-profile-picture)

## Get All Chefs

Retrieves a list of chefs based on specified criteria.

-   **URL:** `/`
-   **Method:** `GET`
-   **Auth Required:** No

### Query Parameters

| Parameter | Type    | Description                                     | Default              |
| --------- | ------- | ----------------------------------------------- | -------------------- |
| `p`       | Integer | Page number                                     | `1`                  |
| `l`       | Integer | Number of items per page                        | `CHEFS_PER_PAGE` env |
| `sort`    | String  | Field to sort by                                | `'updatedAt'`        |
| `order`   | String  | Sort order (`'asc'` or 'desc')                  | `'desc'`             |
| `include` | String  | Comma-separated list of fields to include       | ''                   |
| `exclude` | String  | Comma-separated list of fields to exclude       | ''                   |
| `role`    | String  | Filter chefs by role (`'student'` or `'admin'`) | `'student'`          |

### Response

```json
{
    "data": [
        {
            // Chef object
        }
    ],
    "meta": {
        "page": 1,
        "totalCount": 100
    }
}
```

## Get Single Chef

Retrieves details of a specific chef.

-   **URL:** `/chef/:chefId` or `/:chefId`
-   **Method:** `GET`
-   **Auth Required:** No

### URL Parameters

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `chefId`  | String | Chef's ID   |

### Query Parameters

| Parameter | Type   | Description                               |
| --------- | ------ | ----------------------------------------- |
| `include` | String | Comma-separated list of fields to include |
| `exclude` | String | Comma-separated list of fields to exclude |

### Response

```json
{
    "message": "Successful",
    "data": {
        // Chef object
    }
}
```

## Get Chef Reviews

Retrieves reviews for a specific chef.

-   **URL:** `/chef/:chefId/reviews` or `/:chefId/reviews`
-   **Method:** `GET`
-   **Auth Required:** Yes

### URL Parameters

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `chefId`  | String | Chef's ID   |

### Query Parameters

| Parameter | Type    | Description                               | Default                     |
| --------- | ------- | ----------------------------------------- | --------------------------- |
| `p`       | Integer | Page number                               | `1`                         |
| `l`       | Integer | Number of items per page                  | `CHEF_REVIEWS_PER_PAGE` env |
| `sort`    | String  | Field to sort by                          | `'updatedAt'`               |
| `order`   | String  | Sort order (`'asc'` or `'desc'`)          | `'desc'`                    |
| `include` | String  | Comma-separated list of fields to include | ''                          |
| `exclude` | String  | Comma-separated list of fields to exclude | ''                          |

### Response

```json
{
    "data": [
        {
            // Review object
        }
    ],
    "meta": {
        "page": 1,
        "totalCount": 50
    }
}
```

## Create Chef Review

Creates a new review for a chef.

-   **URL:** `/chef/:chefId/reviews` or `/:chefId/reviews`
-   **Method:** `POST`
-   **Auth Required:** Yes
-   **Middleware:** `checkStudent`

### URL Parameters

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `chefId`  | String | Chef's ID   |

### Request Body

```json
{
    "studentId": "string",
    "rating": "number",
    "message": "string"
}
```

### Response

```json
{
    "message": "Successful",
    "data": {
        // Created review object
    }
}
```

## Update Chef Data

Updates the data of the authenticated chef.

-   **URL:** `/chef/update-data`
-   **Method:** `PATCH`
-   **Auth Required:** Yes
-   **Middleware:** `checkChef`

### Request Body

```json
{
    // Chef data to update
}
```

### Response

```json
{
    "data": {
        // Updated chef object
    },
    "message": "Successfully updated data"
}
```

## Upload Chef Profile Picture

Uploads a profile picture for the authenticated chef.

-   **URL:** `/chef/upload-profile-picture`
-   **Method:** `POST`
-   **Auth Required:** Yes
-   **Middleware:** `checkChef`, `upload.single('profile-image')`, `uploadImage`

### Request Body

Form-data with key `profile-image` containing the image file.

### Response

```json
{
    "data": {
        // Updated chef object with new profile picture
    },
    "message": "Successfully updated data"
}
```
