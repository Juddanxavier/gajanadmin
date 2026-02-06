# Track123 API Guide

Welcome to the Track123 API! This guide walks you through the essential steps to start using Track123's API.

To help you get started with Track123 API, we've prepared a short [YouTube video tutorial](https://www.youtube.com/watch?v=H9hdd67Jw6s\&t) that covers the basics of using the API. The video will walk you through how to obtain your API key, make requests, and configure webhooks.

### 1. Usage Workflow

Track123’s API follows RESTful principles. Here’s a typical workflow:

1. Get an API Key: Authenticate your requests by generating an API key.
2. Integrate the API: Use the API endpoints to manage tracking (e.g., create, update, delete).
3. Handle Webhooks (Optional): Configure webhooks to receive automatic status updates.

### 2. Get Your API Key

To authenticate your API requests, Track123 uses an API key. This key must be included in the request header for every API call.

**Steps to get your API key:**

1. Login to Track123's [Admin Portal](https://member.track123.com/dashboard)
2. Go to [Developers > API](https://member.track123.com/api)
3. Copy and save your API key

### 3. API Endpoints

```
https://api.track123.com/gateway/open-api/
```

**Request HEADERS**

```json http
Track123-Api-Secret: YOUR_API_KEY
Content-Type: application/json
```

### 4. Common Use Cases

**Case 1: Register a New Tracking**

Use Register trackings API:  [https://api.track123.com/gateway/open-api/tk/v2/track/import](https://api.track123.com/gateway/open-api/tk/v2/track/import)

Request:

```curl
curl --request POST \
     --url https://api.track123.com/gateway/open-api/tk/v2/track/import \
     --header 'Track123-Api-Secret: Your_Track123_API_key' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
[
  {
    "trackNo": "771700723045",
    "courierCode": "fedex"
  }
]
'
```

When registering a new tracking, we suggest you provide the tracking number and courier code. But if you don't have such info, you can skip it, and we will try to detect the courier for you.

You can search for the desired courier in the [Carriers List page](https://www.track123.com/carriers). After opening a courier’s page, you can find the courier code in the URL of the page. For example, in the URL [https://www.track123.com/carriers/japan-post](https://www.track123.com/carriers/japan-post), the courier code for Japan Post is japan-post. Alternatively, you can use the [Get Carriers API](https://track123-api.readme.io/reference/get-the-list-of-package-carriers-2) to retrieve a list of couriers along with their official websites and courier codes.

You can also [download the carrier list](https://xinglian-dev-1254213275.cos.accelerate.myqcloud.com/courier-code.csv?sign=q-sign-algorithm%3Dsha1%26q-ak%3DAKIDd7OSsDKFwPbbPzVpxrXx98uJZbQ3UjkX%26q-sign-time%3D1745721901%3B1777257901%26q-key-time%3D1745721901%3B1777257901%26q-header-list%3Dhost%26q-url-param-list%3D%26q-signature%3D193d6a5698749b0cfc0fd82b194db8e92db4da37) as a CSV file.

Note that for some couriers, you may need to provide additional information, such as the postal code or phone number, along with the tracking number to retrieve the tracking details. For more information, please refer to [this guide.](https://track123-api.readme.io/reference/additional-tracking-fields)

**Case 2：Get Tracking Information**

Use Register trackings API: [https://track123-api.readme.io/reference/get-package-trackings](https://track123-api.readme.io/reference/get-package-trackings). You can retrieve the current status and checkpoints for tracking numbers.

**Example Request:**

```curl
curl --request POST \
     --url https://api.track123.com/gateway/open-api/tk/v2/track/query \
     --header 'Track123-Api-Secret: Your_Track123_API_key' \
     --header 'accept: application/json' \
     --header 'content-type: application/json' \
     --data '
{
  "trackNos": [
    "123123122222"
  ]
}
'
```

**Case 3：Webhook Notification for Tracking Updates**

Set up a webhook to receive updates whenever the status of a tracking number changes.

To set up your webhook, go to [Developer > Webhook](https://member.track123.com/notification), enter your server’s endpoint URL, and save it.

When creating a webhook, select **Parcel** for the Webhook Type, unless you need tracking for air cargo or ocean cargo. For the Webhook Status, we recommend checking **All available updates** to receive all tracking updates.
