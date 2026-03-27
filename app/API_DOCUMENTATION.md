# FilmTracker API Documentation

## Base URL
```
http://localhost:5000/api
```

## Response Format
All endpoints return JSON in this format:
```json
{
  "success": true,
  "data": { },
  "error": null,
  "timestamp": "2024-02-19T00:00:00Z"
}
```

---

## Authentication

### Register
**POST** `/auth/register`

Request:
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "securepassword",
  "displayName": "John Doe"
}
```

Response:
```json
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "displayName": "John Doe"
  }
}
```

### Login
**POST** `/auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Get Current User
**GET** `/auth/me`
- Headers: `Authorization: Bearer {token}`

---

## Movies

### Get All Movies
**GET** `/movies`

Query Parameters:
- `page` (default: 1)
- `limit` (default: 20)
- `genre` (optional)
- `year` (optional)
- `type` (movie | series)

### Get Movie Details
**GET** `/movies/:id`

### Search Movies
**GET** `/movies/search?q=inception`

### Get Movies by Genre
**GET** `/movies/genre/:genre`

### Get Trending Movies
**GET** `/movies/trending`

### Get New Releases
**GET** `/movies/new`

---

## Ratings

### Create Rating
**POST** `/ratings`
- Headers: `Authorization: Bearer {token}`

Request:
```json
{
  "movieId": "movie_id",
  "rating": 8,
  "review": "Great movie!",
  "watchedDate": "2024-02-19",
  "isFavorite": false
}
```

### Get User Ratings
**GET** `/ratings`
- Headers: `Authorization: Bearer {token}`

### Update Rating
**PUT** `/ratings/:id`
- Headers: `Authorization: Bearer {token}`

### Delete Rating
**DELETE** `/ratings/:id`
- Headers: `Authorization: Bearer {token}`

---

## Watchlist

### Add to Watchlist
**POST** `/watchlist`
- Headers: `Authorization: Bearer {token}`

Request:
```json
{
  "movieId": "movie_id",
  "priority": "high",
  "notes": "Want to watch this soon"
}
```

### Get User Watchlist
**GET** `/watchlist`
- Headers: `Authorization: Bearer {token}`

### Remove from Watchlist
**DELETE** `/watchlist/:id`
- Headers: `Authorization: Bearer {token}`

---

## Users

### Get User Profile
**GET** `/users/:userId`

### Update Profile
**PUT** `/users/:userId`
- Headers: `Authorization: Bearer {token}`

Request:
```json
{
  "displayName": "New Name",
  "bio": "New bio",
  "favoriteGenres": ["Action", "Sci-Fi"]
}
```

### Get User Statistics
**GET** `/users/:userId/statistics`

---

## Friends

### Send Friend Request
**POST** `/friends/add`
- Headers: `Authorization: Bearer {token}`

Request:
```json
{
  "friendUsername": "username"
}
```

### Get Friends List
**GET** `/friends`
- Headers: `Authorization: Bearer {token}`

### Accept Friend Request
**PUT** `/friends/:requestId/accept`
- Headers: `Authorization: Bearer {token}`

### Remove Friend
**DELETE** `/friends/:friendId`
- Headers: `Authorization: Bearer {token}`

### Get Friend Activity
**GET** `/friends/activity`
- Headers: `Authorization: Bearer {token}`

---

## Recommendations

### Get Personal Recommendations
**GET** `/recommendations/personal`
- Headers: `Authorization: Bearer {token}`

Query Parameters:
- `limit` (default: 10)

### Get Taste Match
**GET** `/recommendations/taste-match/:friendId`
- Headers: `Authorization: Bearer {token}`

### Get Joint Recommendations
**GET** `/recommendations/joint/:friendId`
- Headers: `Authorization: Bearer {token}`

### Get Friend Recommendations
**GET** `/recommendations/friends`
- Headers: `Authorization: Bearer {token}`

---

## Analytics

### Get Dashboard Stats
**GET** `/analytics/dashboard`
- Headers: `Authorization: Bearer {token}`

Response:
```json
{
  "totalWatched": 47,
  "averageRating": 7.8,
  "topGenres": ["Action", "Drama"],
  "monthlyStats": []
}
```

### Get Genre Distribution
**GET** `/analytics/genres`
- Headers: `Authorization: Bearer {token}`

### Get Monthly Statistics
**GET** `/analytics/monthly`
- Headers: `Authorization: Bearer {token}`
- Query: `months` (default: 12)

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication token is invalid or expired"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "An unexpected error occurred"
}
```

---

## Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per user

## Authentication Token
- JWT tokens expire after 7 days
- Include `Authorization: Bearer {token}` in request headers

## Pagination
- Default page size: 20
- Maximum page size: 100
- Use `page` and `limit` query parameters
