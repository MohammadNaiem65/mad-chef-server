# Recipe API Documentation

This document outlines the API endpoints related to recipe functionality in the application.

**_The Root URL is `/recipes`_**

## Table of Contents

1. [Search Recipes](#search-recipes)
2. [Get Recipe](#get-recipe)
3. [Get Recipe Ratings](#get-recipe-ratings)
4. [Post Recipe](#post-recipe)
5. [Edit Recipe](#edit-recipe)
6. [Update Recipe Status](#update-recipe-status)
7. [Delete Recipe](#delete-recipe)
8. [Post Recipe Rating](#post-recipe-rating)

## Search Recipes

Search for recipes with optional filters.

-   **URL:** `/` or `/search`
-   **Method:** `GET`
-   **Auth Required:** No
-   **Permissions:** None

### Query Parameters

| Parameter     | Type   | Description                                         |
| ------------- | ------ | --------------------------------------------------- |
| `p`, `page`   | Number | Page number                                         |
| `l`, `limit`  | Number | Limit (number of results per page)                  |
| `data_filter` | Object | Filters for search (e.g., chefId, region)           |
| `sort`        | String | Sorting field (e.g., `updatedAt`)                   |
| `order`       | String | Sorting order (`asc` or `desc`)                     |
| `include`     | String | Comma separated fields to include in the response   |
| `exclude`     | String | Comma separated fields to exclude from the response |
| `role`        | String | Role of the user                                    |

### Response

```json
{
    "data": [
        // Array of recipe objects
    ],
    "meta": {
        "page": 1,
        "totalCount": 100
    }
}
```

## Get Recipe

Fetch a specific recipe by its ID.

-   **URL:** `/recipe/:recipeId` or `/:recipeId`
-   **Method:** `GET`
-   **Auth Required:** No
-   **Permissions:** None

### URL Parameters

| Parameter  | Type   | Description          |
| ---------- | ------ | -------------------- |
| `recipeId` | String | The ID of the recipe |

### Query Parameters

| Parameter | Type   | Description                                           |
| --------- | ------ | ----------------------------------------------------- |
| `include` | String | Fields to include in the response (comma-separated)   |
| `exclude` | String | Fields to exclude from the response (comma-separated) |

### Response

```json
{
    "message": "Successful",
    "data": {
        // Recipe object
    }
}
```

## Get Recipe Ratings

Retrieve all ratings for a specific recipe.

-   **URL:** `/ratings` or `/recipe/:recipeId/ratings`
-   **Method:** `GET`
-   **Auth Required:** No
-   **Permissions:** None

### URL Parameters

| Parameter  | Type   | Description          |
| ---------- | ------ | -------------------- |
| `recipeId` | String | The ID of the recipe |

### Query Parameters

| Parameter      | Type   | Description                                                       |
| -------------- | ------ | ----------------------------------------------------------------- |
| `p` or `page`  | Number | Page number                                                       |
| `l` or `limit` | Number | Limit (number of results per page)                                |
| `data_filter`  | Object | Filter object (e.g., `recipeId`). Accepts `recipeId`, `studentId` |
| `order`        | String | Sorting order (`asc` or `desc`)                                   |
| `include`      | String | Comma separated fields to include in the response                 |
| `exclude`      | String | Comma separated fields to exclude in the response                 |

### Response

```json
{
    "message": "Successful",
    "data": [
        // Array of rating objects
    ],
    "meta": {
        "page": 1,
        "totalCount": 50
    }
}
```

## Post Recipe

Create a new recipe.

-   **URL:** `/recipe`
-   **Method:** `POST`
-   **Auth Required:** Yes
-   **Permissions:** User must be authenticated.

### Request Body

| Parameter      | Type   | Description                                                                                                          |
| -------------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| `title`        | String | The title of the recipe                                                                                              |
| `ingredients`  | Array  | List of ingredients (strings)                                                                                        |
| `method`       | String | Cooking instructions                                                                                                 |
| `recipe-image` | File   | Recipe image                                                                                                         |
| `imgTitle`     | String | An image title (optional)                                                                                            |
| `region`       | String | The region associated with the recipe. Accepts `asia`, `europe`, `america`, `latin america`, `africa`, `middle east` |

### Response

```json
{
    "message": "Recipe created successfully",
    "data": {
        // Recipe details
    }
}
```

## Edit Recipe

Update an existing recipe.

-   **URL:** `/edit-recipe/:recipeId`
-   **Method:** `PATCH`
-   **Auth Required:** Yes
-   **Permissions:** User must be authenticated and authorized to edit the recipe.

### URL Parameters

| Parameter  | Type   | Description                    |
| ---------- | ------ | ------------------------------ |
| `recipeId` | String | The ID of the recipe to update |

### Request Body

| Parameter      | Type   | Description                                                                                                         |
| -------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| `title`        | String | The title of the recipe                                                                                             |
| `ingredients`  | Array  | List of ingredients (strings)                                                                                       |
| `method`       | String | Cooking instructions                                                                                                |
| `recipe-image` | File   | Recipe image                                                                                                        |
| `imgTitle`     | String | An image title (optional)                                                                                           |
| `region`       | String | The region associated with the recipe. Accepts `asia`, `europe`, `america`, `latin america`, `africa`,`middle east` |

### Response

```json
{
    "message": "Recipe updated successfully",
    "data": {
        // Updated recipe details
    }
}
```

## Update Recipe Status

Change the status of a recipe (e.g., published, unpublished).

-   **URL:** `/recipe/:recipeId/update-status`
-   **Method:** `PATCH`
-   **Auth Required:** Yes
-   **Permissions:** User must be authenticated and authorized to change the recipe status.

### URL Parameters

| Parameter  | Type   | Description                    |
| ---------- | ------ | ------------------------------ |
| `recipeId` | String | The ID of the recipe to update |

### Request Body

| Parameter  | Type   | Description                                                                                          |
| ---------- | ------ | ---------------------------------------------------------------------------------------------------- |
| `status`   | String | New status for the recipe (e.g., "published", "rejected"). Accepts `published`, `rejected`, `hidden` |
| `recipeId` | String | The ID of the recipe to update (optional)                                                            |

### Response

```json
{
    "message": "Recipe status updated successfully",
    "data": {
        "recipeId": "12345",
        "newStatus": "published"
    }
}
```

## Delete Recipe

Remove a recipe from the database.

-   **URL:** `/recipe/:recipeId`
-   **Method:** `DELETE`
-   **Auth Required:** Yes
-   **Permissions:** User must be authenticated and authorized to delete the recipe.

### URL Parameters

| Parameter  | Type   | Description                    |
| ---------- | ------ | ------------------------------ |
| `recipeId` | String | The ID of the recipe to delete |

### Response

```json
{
    "message": "Recipe deleted successfully",
    "data": {
        "deleteCount": 1
    }
}
```

## Post Recipe Rating

Submit a rating for a recipe.

-   **URL:** `/recipe/:recipeId/ratings`
-   **Method:** `POST`
-   **Auth Required:** Yes
-   **Permissions:** User must be authenticated to post a rating.

### URL Parameters

| Parameter  | Type   | Description                  |
| ---------- | ------ | ---------------------------- |
| `recipeId` | String | The ID of the recipe to rate |

### Request Body

| Parameter | Type   | Description                 |
| --------- | ------ | --------------------------- |
| `rating`  | Number | Rating value (e.g., 1 to 5) |
| `comment` | String | Comment about the recipe    |

### Response

```json
{
    "message": "Successfully created.",
    "data": {
        // Rating document details
    }
}
```
