# Student API Documentation

This document outlines the API endpoints related to student functionality in our application.

**_The Root URL is `/admins`_**

## Table of Contents

1. [Get Admin Data](#get-admin-data)
2. [Update Admin Data](#update-admin-data)
3. [Upload Profile Picture](#upload-profile-picture)

## Get Admin Data

Fetches the data of a specific admin.

-   **URL:** `/admin/:adminId` or `/:adminId`
-   **Method:** `GET`
-   **Auth Required:** Yes
-   **Permissions:** Admin only

### URL Parameters

| Parameter | Type   | Description     |
| --------- | ------ | --------------- |
| `adminId` | String | ID of the admin |

### Response

```json
{
    "message": "Successful",
    "data": {
        // Admin data object
    }
}
```

## Update Admin Data

Updates the data of the logged-in admin.

-   **URL:** `/admin/update-data`
-   **Method:** `PATCH`
-   **Auth Required:** Yes
-   **Permissions:** Admin only

### Body Parameters

| Parameter | Type   | Description    |
| --------- | ------ | -------------- |
| data      | Object | New admin data |

### Response

```json
{
    "message": "Successfully updated data",
    "data": {
        // Result of the update operation
    }
}
```

## Upload Profile Picture

Uploads a new profile picture for the admin and updates their data with the image URL.

-   **URL:** `/admin/upload-profile-picture`
-   **Method:** `POST`
-   **Auth Required:** Yes
-   **Permissions:** Admin only
-   **File Upload:** Yes (using multipart/form-data)

### Body Parameters

| Parameter     | Type | Description                     |
| ------------- | ---- | ------------------------------- |
| profile-image | File | The new profile image to upload |

### Response

```json
{
    "message": "Profile picture uploaded and data updated successfully",
    "data": {
        // Result of the upload operation
    }
}
```
