# express-promisify-router

Express-promisify-router is a lightweight JavaScript library with zero dependencies that enables async/await support in Express framework applications. With this library, you can write both middleware and routes using async/await syntax. It allows you to return promises directly from route handlers without the need for a try-catch block, simplifying error handling and data transmission to the client.

## Installation

```
npm i express-promisify-router
```

[![npm version](https://badge.fury.io/js/express-promisify-router.svg)](https://badge.fury.io/js/express-promisify-router)

## Usage:

### Using Router()

Creates a new async router instance using Router(). This method simplifies the process of creating an async router.

```javascript
// Usage Example: use wrapped Router()
const { Router } = require('express-promisify-router');
const router = Router();

router.get('/foo', async (req, res, next) => {
    const user = await UserService.findById();
    if (!user) {
        throw new NotFound('User not found');
    }
    return users;
});
```

### Using wrapRouter()

Wraps an existing Express router instance to add async/await support. This method is useful when you already have an Express router instance and want to add async/await support to it.

```javascript
// Usage Example: use wrapRouter()
const express = require('express');
const { wrapRouter } = require('express-promisify-router');
const router = wrapRouter(express.Router());

router.get('/foo', async (req, res, next) => {
    const user = await UserService.findById();
    if (!user) {
        throw new NotFound('User not found');
    }
    return users;
});
```

### Using route()

Provides a more structured way to define routes and their handlers using the route() method. This method allows you to define multiple HTTP methods for a single route.

```javascript
const { Router } = require('express-promisify-router');
const router = Router();

router
    .route('/foo')
    .get((req, res, next) => {
        return UserService.fetch();
    })
    .post((req, res, next) => {
        return UserService.create();
    });
```

### Returning Data Directly

Allows you to return data directly from the route handler without explicitly calling res.send(). This simplifies the process of sending responses to clients.

```javascript
const express = require('express');
const { wrapRouter } = require('express-promisify-router');
const router = wrapRouter(express.Router());

router.get('/foo', async (req) => {
    return await new Promise((resolve) => {
        resolve({ message: 'Hello!' });
    });
});
```

### Using Array of Middlewares

Enables you to use an array of middleware functions for a single route. Each middleware function in the array will be executed sequentially.

```javascript
const express = require('express');
const { wrapRouter } = require('express-promisify-router');
const router = wrapRouter(express.Router());

router.get('/foo', [
    (req, res, next) => {
        next();
    },
    async (req, res, next) => {
        throw new Error('Exception!');
    }
]);
```

### Using Classic Middleware Approach

Demonstrates the classic middleware approach for defining route handlers. This method is useful when you need more control over the error handling process.

```javascript
const express = require('express');
const { wrapRouter } = require('express-promisify-router');
const router = wrapRouter(express.Router());

router.get('/foo', [
    (req, res, next) => {
        next();
    },
    (req, res, next) => {
        try {
            res.send();
        } catch (err) {
            next(err);
        }
    }
]);
```

## API

### wrapRouter()

The wrapRouter() function is the best way to add async/await support to your Express app or Router.

### wrapFunction()

If you need more control, you can use the wrapFunction() function. This function wraps an async Express middleware and adds async/await support.
