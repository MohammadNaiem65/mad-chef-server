# Payment API Documentation

This document outlines the API endpoints related to payment functionality in our application.

**The Root URL is `/payments`**

## Create Payment Intent

Creates a new payment intent using Stripe.

-   **URL:** `/create-payment-intent`
-   **Method:** `POST`
-   **Auth Required:** Yes

### Request Body

| Parameter | Type   | Description                   | Required |
| --------- | ------ | ----------------------------- | -------- |
| `amount`  | Number | Amount to be charged in cents | Yes      |

### Response

```json
{
    "message": "Successful",
    "data": {
        "clientSecret": "stripe_client_secret"
    }
}
```

## Get Payment Receipts

Retrieves a list of payment receipts based on specified criteria.

-   **URL:** `/payment-receipt`
-   **Method:** `GET`
-   **Auth Required:** Yes

### Query Parameters

| Parameter   | Type    | Description               | Default                 |
| ----------- | ------- | ------------------------- | ----------------------- |
| `p`         | Integer | Page number               | `1`                     |
| `page`      | Integer | Alternative for `p`       | `0`                     |
| `l`         | Integer | Number of items per page  | `RECEIPTS_PER_PAGE` env |
| `limit`     | Integer | Alternative for `l`       | `RECEIPTS_PER_PAGE` env |
| `studentId` | String  | MongoDB ID of the student | None                    |
| `filter`    | String  | Filter receipts by status | None                    |

### Response

```json
{
    "data": [
        {
            // Payment receipt object
        }
    ],
    "meta": {
        "page": 1,
        "totalCount": 100
    }
}
```

## Save Payment Receipt

Saves a new payment receipt.

-   **URL:** `/payment-receipt`
-   **Method:** `POST`
-   **Auth Required:** Yes

### Request Body

| Parameter       | Type   | Description               | Required |
| --------------- | ------ | ------------------------- | -------- |
| `studentId`     | String | MongoDB ID of the student | Yes      |
| `username`      | String | Name of the student       | Yes      |
| `email`         | String | Email of the student      | Yes      |
| `pkg`           | String | Package purchased         | Yes      |
| `transactionId` | String | ID of the transaction     | Yes      |
| `amount`        | Number | Amount of the transaction | Yes      |
| `status`        | String | Status of the payment     | Yes      |

### Response

```json
{
    "message": "Successful",
    "data": {
        // Created payment receipt object
    }
}
```

## Delete Payment Receipt

Deletes one or multiple payment receipts.

-   **URL:** `/payment-receipt`
-   **Method:** `DELETE`
-   **Auth Required:** Yes

### Query Parameters

| Parameter   | Type   | Description                    | Required |
| ----------- | ------ | ------------------------------ | -------- |
| `receiptId` | String | MongoDB ID of a single receipt | No       |

### Request Body

| Parameter    | Type     | Description                      | Required |
| ------------ | -------- | -------------------------------- | -------- |
| `receiptIds` | String[] | Array of MongoDB IDs of receipts | No       |

Note: Either `receiptId` in query parameters or `receiptIds` in the request body should be provided.

### Response

```json
{
    "message": "Successfully deleted the payments receipts",
    "data": {
        // Deletion result
    }
}
```

## Notes

-   For the `/create-payment-intent` endpoint, the `amount` must be a number. It will be rounded to two decimal places.
-   In the `/payment-receipt` endpoint:
    -   If `studentId` is provided, it filters receipts for that specific student.
    -   If `filter` is not set to 'all', it filters receipts by the specified status.
-   The `/payment-receipt` endpoint can delete either a single receipt (using `receiptId` in query) or multiple receipts (using `receiptIds` in body).
-   Error responses for all endpoints follow this format:
    ```json
    {
        "message": "Error message",
        "error": "Detailed error description"
    }
    ```
