# Student API Documentation

This document outlines the API endpoints related to student functionality in our application.

**The Root URL is `/students`**

## Table of Contents

1. [Get All Students](#get-all-students)
2. [Verify Student Email](#verify-student-email)
3. [Get Student by ID](#get-student-by-id)
4. [Update Student Data](#update-student-data)
5. [Update Student Package](#update-student-package)
6. [Upload Student Profile Picture](#upload-student-profile-picture)
7. [Bookmark Management](#bookmark-management)
8. [Like Management](#like-management)
9. [Recipe Rating Management](#recipe-rating-management)
10. [Chef Review Management](#chef-review-management)

---

## Get All Students

Retrieves a list of all students. Only accessible by admin users.

-   **URL:** `/`
-   **Method:** `GET`
-   **Auth Required:** Yes
-   **Permissions:** Admin only

### Query Parameters

| Parameter | Type    | Description                               | Default              |
| --------- | ------- | ----------------------------------------- | -------------------- |
| p         | Integer | Page number                               | 1                    |
| l         | Integer | Number of items per page                  | `USERS_PER_PAGE` env |
| sort      | String  | Field to sort by                          | 'name'               |
| order     | String  | Sort order ('asc' or 'desc')              | 'asc'                |
| include   | String  | Comma-separated list of fields to include | ''                   |
| exclude   | String  | Comma-separated list of fields to exclude | ''                   |

### Response

```json
{
    "data": [
        {
            // Student objects
        }
    ],
    "meta": {
        "page": 1,
        "totalCount": 100
    }
}
```

---

## Verify Student Email

Verifies a student's email address.

-   **URL:** `/student/verify-email`
-   **Method:** `GET`
-   **Auth Required:** No

### Query Parameters

| Parameter | Type   | Description            |
| --------- | ------ | ---------------------- |
| uid       | String | Firebase User ID (UID) |

### Response

Redirects to the student's profile page upon successful verification.

---

## Get Student by ID

Retrieves a specific student's information by their ID.

-   **URL:** `/student/:id` or `/:id`
-   **Method:** `GET`
-   **Auth Required:** Yes

### URL Parameters

| Parameter | Type   | Description | Required |
| --------- | ------ | ----------- | -------- |
| id        | String | Student ID  | Yes      |

### Query Parameters

| Parameter | Type   | Description                               | Default |
| --------- | ------ | ----------------------------------------- | ------- |
| include   | String | Comma-separated list of fields to include | ''      |
| exclude   | String | Comma-separated list of fields to exclude | ''      |

### Response

```json
{
    "message": "Successful",
    "data": {
        // Student object
    }
}
```

### Error Responses

-   **404 Not Found**

    ```json
    {
        "message": "Student not found"
    }
    ```

-   **500 Internal Server Error**
    ```json
    {
        "message": "An error occurred",
        "error": "Error message"
    }
    ```

---

## Update Student Data

Updates a student's personal information.

-   **URL:** `/student/update-data`
-   **Method:** `PATCH`
-   **Auth Required:** Yes
-   **Permissions:** Student only

### Request Body

```json
{
    // Fields to update
}
```

### Response

```json
{
    "message": "Successfully updated student data",
    "data": {
        // Updated student object
    }
}
```

### Error Responses

-   **400 Bad Request**

    ```json
    {
        "message": "No update data provided."
    }
    ```

-   **404 Not Found**

    ```json
    {
        "message": "Student not found."
    }
    ```

-   **500 Internal Server Error**
    ```json
    {
        "message": "An error occurred while updating student data"
    }
    ```

---

## Update Student Package

Updates a student's subscription package to 'pro'.

-   **URL:** `/student/update-package`
-   **Method:** `PATCH`
-   **Auth Required:** Yes
-   **Permissions:** Student only

### Response

```json
{
    "message": "Package successfully updated to pro",
    "data": {
        "user": {
            // Updated user data
        },
        "accessToken": "new-access-token"
    }
}
```

### Error Responses

-   **400 Bad Request**

    ```json
    {
        "message": "No payment receipt found"
    }
    ```

-   **500 Internal Server Error**
    ```json
    {
        "message": "Internal server error"
    }
    ```

---

## Upload Student Profile Picture

Uploads a new profile picture for the student.

-   **URL:** `/student/upload-profile-picture`
-   **Method:** `POST`
-   **Auth Required:** Yes
-   **Permissions:** Student only
-   **Content-Type:** `multipart/form-data`

### Request Body

| Parameter     | Type | Description        | Required |
| ------------- | ---- | ------------------ | -------- |
| profile-image | File | Profile image file | Yes      |

### Response

```json
{
    "message": "Successfully updated student data",
    "data": {
        // Updated student object with new profile picture URL
    }
}
```

### Error Responses

-   **400 Bad Request**

    ```json
    {
        "message": "No update data provided."
    }
    ```

-   **404 Not Found**

    ```json
    {
        "message": "Student not found."
    }
    ```

-   **500 Internal Server Error**
    ```json
    {
        "message": "An error occurred while updating student data"
    }
    ```

---

# Bookmark Management

## Get Student Bookmark

Retrieves a specific bookmark for a student.

-   **URL:** `/student/:id/bookmark` or `/:id/bookmark`
-   **Method:** `GET`
-   **Auth Required:** Yes
-   **Permissions:** Student only

### URL Parameters

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| id        | String | Student's ID |

### Query Parameters

| Parameter | Type   | Description                            |
| --------- | ------ | -------------------------------------- |
| recipeId  | String | ID of the recipe to check for bookmark |

### Response

```json
{
    "message": "Successful",
    "data": {
        // Bookmark object
    }
}
```

## Get Student Bookmarks

Retrieves all bookmarks for a student.

-   **URL:** `/student/:id/bookmarks` or `/:id/bookmarks`
-   **Method:** `GET`
-   **Auth Required:** Yes
-   **Permissions:** Student only

### URL Parameters

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| id        | String | Student's ID |

### Response

```json
{
    "message": "Successful",
    "data": [
        // Array of bookmark objects
    ]
}
```

## Mark Recipe as Bookmark

Adds a recipe to a student's bookmarks.

-   **URL:** `/student/:id/add-bookmark` or `/:id/add-bookmark`
-   **Method:** `POST`
-   **Auth Required:** Yes
-   **Permissions:** Student only

### URL Parameters

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| id        | String | Student's ID |

### Query Parameters

| Parameter | Type   | Description                  |
| --------- | ------ | ---------------------------- |
| recipeId  | String | ID of the recipe to bookmark |

### Response

```json
{
    "message": "Successful",
    "data": {
        // New bookmark object
    }
}
```

## Remove Recipe from Bookmark

Removes a recipe from a student's bookmarks.

-   **URL:** `/student/:id/remove-bookmark` or `/:id/remove-bookmark`
-   **Method:** `DELETE`
-   **Auth Required:** Yes
-   **Permissions:** Student only

### URL Parameters

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| id        | String | Student's ID |

### Query Parameters

| Parameter | Type   | Description                               |
| --------- | ------ | ----------------------------------------- |
| recipeId  | String | ID of the recipe to remove from bookmarks |

### Response

```json
{
    "message": "Successfully removed bookmark",
    "data": {
        // Result of the delete operation
    }
}
```

## Like Management

## Get Like Status

Checks if a student liked a specific recipe.

-   **URL:** `/student/:id/like` or `/:id/like`
-   **Method:** `GET`
-   **Auth Required:** Yes
-   **Permissions:** Student only

### URL Parameters

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| id        | String | Student's ID |

### Query Parameters

| Parameter | Type   | Description                               |
| --------- | ------ | ----------------------------------------- |
| recipeId  | String | ID of the recipe to check like status for |

### Response

```json
{
    "message": "Successful",
    "data": {
        // Liked document details if available
    }
}
```

## Get All Liked Recipes

Fetches all recipes liked by the student.

-   **URL:** `/student/:id/likes` or `/:id/likes`
-   **Method:** `GET`
-   **Auth Required:** Yes
-   **Permissions:** Student only

### URL Parameters

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| id        | String | Student's ID |

### Response

```json
{
    "message": "Successful",
    "data": [
        // Array of liked recipes
    ]
}
```

## Add Like to a Recipe

Adds a like to a specific recipe.

-   **URL:** `/student/:id/add-like` or `/:id/add-like`
-   **Method:** `POST`
-   **Auth Required:** Yes
-   **Permissions:** Student only

### URL Parameters

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| id        | String | Student's ID |

### Query Parameters

| Parameter | Type   | Description              |
| --------- | ------ | ------------------------ |
| recipeId  | String | ID of the recipe to like |

### Response

```json
{
    "message": "Successfully added like and updated recipe",
    "data": {
        // Liked document and updated recipe details
    }
}
```

## Remove Like from a Recipe

Removes a like from a specific recipe.

-   **URL:** `/student/:id/remove-like` or `/:id/remove-like`
-   **Method:** `DELETE`
-   **Auth Required:** Yes
-   **Permissions:** Student only

### URL Parameters

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| id        | String | Student's ID |

### Query Parameters

| Parameter | Type   | Description                |
| --------- | ------ | -------------------------- |
| recipeId  | String | ID of the recipe to unlike |

### Response

```json
{
    "message": "Successfully removed like.",
    "data": {
        // Result of the unlike operation
    }
}
```

## Recipe Rating Management

## Get Recipe Ratings

Fetches all ratings given by a student for recipes.

-   **URL:** `/student/:id/rating/recipe` or `/:id/rating/recipe`
-   **Method:** `GET`
-   **Auth Required:** Yes
-   **Permissions:** Student only

### URL Parameters

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| id        | String | Student's ID |

### Response

```json
{
    "message": "Successful",
    "data": [
        // Array of ratings given by the student
    ]
}
```

## Add Recipe Rating

Adds a rating to a specific recipe.

-   **URL:** `/student/:id/rating/recipe` or `/:id/rating/recipe`
-   **Method:** `POST`
-   **Auth Required:** Yes
-   **Permissions:** Student only

### URL Parameters

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| id        | String | Student's ID |

### Body Parameters

| Parameter | Type   | Description        |
| --------- | ------ | ------------------ |
| recipeId  | String | ID of the recipe   |
| rating    | Number | Rating value (1-5) |
| message   | String | Additional message |

### Response

```json
{
    "message": "Successful",
    "data": {
        // Created rating document
    }
}
```

## Edit Recipe Rating

Updates a rating given by the student for a specific recipe.

-   **URL:** `/student/:id/rating/recipe` or `/:id/rating/recipe`
-   **Method:** `PATCH`
-   **Auth Required:** Yes
-   **Permissions:** Student only

### URL Parameters

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| id        | String | Student's ID |

### Query Parameters

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| docId     | String | ID of the rating document |

### Body Parameters

| Parameter | Type   | Description            |
| --------- | ------ | ---------------------- |
| rating    | Number | New rating value (1-5) |
| message   | String | Updated message        |

### Response

```json
{
    "message": "Rating updated successfully",
    "data": {
        // Updated rating document
    }
}
```

## Remove Recipe Rating

Removes a rating from a specific recipe.

-   **URL:** `/student/:id/rating/recipe` or `/:id/rating/recipe`
-   **Method:** `DELETE`
-   **Auth Required:** Yes
-   **Permissions:** Student only

### URL Parameters

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| id        | String | Student's ID |

### Query Parameters

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| docId     | String | ID of the rating document |

### Response

```json
{
    "message": "Successfully removed rating.",
    "data": {
        // Result of the remove operation
    }
}
```

## Chef Review Management

## Get Chef Reviews by Student

Fetches all reviews given by a student for chefs.

-   **URL:** `/student/:id/review/chef` or `/:id/review/chef`
-   **Method:** `GET`
-   **Auth Required:** Yes
-   **Permissions:** Student only

### URL Parameters

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| id        | String | Student's ID |

### Response

```json
{
    "message": "Successful",
    "data": [
        // Array of reviews for chefs
    ]
}
```

## Add Chef Review

Adds a review for a specific chef.

-   **URL:** `/student/:id/review/chef` or `/:id/review/chef`
-   **Method:** `POST`
-   **Auth Required:** Yes
-   **Permissions:** Student only

### URL Parameters

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| id        | String | Student's ID |

### Body Parameters

| Parameter | Type   | Description        |
| --------- | ------ | ------------------ |
| chefId    | String | ID of the chef     |
| rating    | Number | Rating value (1-5) |
| message   | String | Additional message |

### Response

```json
{
    "message": "Successful",
    "data": {
        // Created review document
    }
}
```

## Edit Chef Review

Updates a review given by the student for a specific chef.

-   **URL:** `/student/:id/review/chef` or `/:id/review/chef`
-   **Method:** `PATCH`
-   **Auth Required:** Yes
-   **Permissions:** Student only

### URL Parameters

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| id        | String | Student's ID |

### Query Parameters

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| docId     | String | ID of the review document |

### Body Parameters

| Parameter | Type   | Description            |
| --------- | ------ | ---------------------- |
| rating    | Number | New rating value (1-5) |
| message   | String | Updated message        |

### Response

```json
{
    "message": "Review updated successfully",
    "data": {
        // Updated review document
    }
}
```

## Delete Chef Review

Removes a review from a specific chef.

-   **URL:** `/student/:id/review/chef` or `/:id/review/chef`
-   **Method:** `DELETE`
-   **Auth Required:** Yes
-   **Permissions:** Student only

### URL Parameters

| Parameter | Type   | Description  |
| --------- | ------ | ------------ |
| id        | String | Student's ID |

### Query Parameters

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| docId     | String | ID of the review document |

### Response

```json
{
    "message": "Successfully removed review.",
    "data": {
        // Result of the remove operation
    }
}
```
