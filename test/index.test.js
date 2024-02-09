const express = require('express');
const supertest = require('supertest');
const { wrapRouter, wrapFunction } = require('../lib');

describe('wrapFunction', () => {
    it('creates a async router', async () => {
        const app = express();
        const router = express.Router();

        router.get(
            '/test',
            wrapFunction(async (req, res, next) => {
                throw new Error('Oops!');
            })
        );

        app.use(router);
        app.use((err, req, res, next) => {
            res.status(500).send(err.message);
        });

        const request = supertest(app);
        const res = await request.get('/test');

        expect(res.constructor.name).toBe('Response');
        expect(res.statusCode).toBe(500);
        expect(res.error.text).toBe('Oops!');
    });
    it('handles requests without errors', async () => {
        const app = express();
        const router = express.Router();

        router.get(
            '/test',
            wrapFunction(async (req, res, next) => {
                res.send('Success!');
            })
        );

        app.use(router);

        const request = supertest(app);
        const res = await request.get('/test');

        expect(res.statusCode).toBe(200);
        expect(res.text).toBe('Success!');
    });
    it('handles app.param', async () => {
        const app = express();
        const router = express.Router();

        router.param(
            'userId',
            wrapFunction(async (req, res, next, userId) => {
                const user = await Promise.resolve({ userId, name: 'John' });
                if (!user) {
                    const error = new Error('User not found');
                    error.status = 404;
                    throw error;
                }
                req.user = user;
                next();
            })
        );

        router.get('/user/:userId', (req, res) => {
            res.json(req.user);
        });

        app.use(router);
        const request = supertest(app);
        const res = await request.get('/user/10');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ name: 'John', userId: '10' });
    });
});

describe('wrapRouter', () => {
    it('creates a async router', async () => {
        const app = express();
        const router = wrapRouter(express.Router());

        router.route('/test').get(async (req, res, next) => {
            throw new Error('Oops!');
        });

        app.use(router);
        app.use((err, req, res, next) => {
            res.status(500).send(err.message);
        });

        const request = supertest(app);
        const res = await request.get('/test');

        expect(res.constructor.name).toBe('Response');
        expect(res.statusCode).toBe(500);
        expect(res.error.text).toBe('Oops!');
    });

    it('handle router.route()', async () => {
        const app = express();
        const router = wrapRouter(express.Router());

        router.get('/test', async (req, res, next) => {
            throw new Error('Oops!');
        });

        app.use(router);
        app.use((err, req, res, next) => {
            res.status(500).send(err.message);
        });

        const request = supertest(app);
        const res = await request.get('/test');

        expect(res.constructor.name).toBe('Response');
        expect(res.statusCode).toBe(500);
        expect(res.error.text).toBe('Oops!');
    });

    it('return proper response', async () => {
        const app = express();
        const router = wrapRouter(express.Router());

        router.get(
            '/test',
            function test1(req, res, next) {
                req.foo = 'Boo!';
                next();
            },
            async function test2(req) {
                const result = await new Promise((resolve) => {
                    resolve('Oops!');
                });
                return { result, context: req.foo };
            }
        );

        app.use(router);
        app.use(function errorHandler(err, req, res, next) {
            res.status(500).send(err.message);
        });

        const request = supertest(app);
        const res = await request.get('/test');

        expect(res.constructor.name).toBe('Response');
        expect(res.statusCode).toBe(200);
        expect(res.body.result).toBe('Oops!');
        expect(res.body.context).toBe('Boo!');
    });

    it('handle a middleware with promise', async () => {
        const app = express();
        const router = wrapRouter(express.Router());

        router.get('/test', async (req, res, next) => {
            const result = await new Promise((resolve) => {
                resolve('Oops!');
            });
            res.send({ result });
        });

        app.use(router);
        app.use((err, req, res, next) => {
            res.status(500).send(err.message);
        });

        const request = supertest(app);
        const res = await request.get('/test');

        expect(res.constructor.name).toBe('Response');
        expect(res.statusCode).toBe(200);
        expect(res.body.result).toBe('Oops!');
    });

    it('handle an array of middlewares as async functions', async () => {
        const app = express();
        const router = wrapRouter(express.Router());

        router.get('/test', [
            async (req, res, next) => {
                next();
            },
            async (req, res, next) => {
                throw new Error('Oops!');
            }
        ]);

        app.use(router);
        app.use((err, req, res, next) => {
            res.status(500).send(err.message);
        });

        const request = supertest(app);
        const res = await request.get('/test');

        expect(res.constructor.name).toBe('Response');
        expect(res.statusCode).toBe(500);
        expect(res.error.text).toBe('Oops!');
    });

    it('handle many middlewares as async functions', async () => {
        const app = express();
        const router = wrapRouter(express.Router());

        router.get(
            '/test',
            async (req, res, next) => {
                next();
            },
            async (req, res, next) => {
                throw new Error('Oops!');
            }
        );

        app.use(router);
        app.use((err, req, res, next) => {
            res.status(500).send(err.message);
        });

        const request = supertest(app);
        const res = await request.get('/test');

        expect(res.constructor.name).toBe('Response');
        expect(res.statusCode).toBe(500);
        expect(res.error.text).toBe('Oops!');
    });

    it('handle an array of middlewares as mixed functions', async () => {
        const app = express();
        const router = wrapRouter(express.Router());

        router.get('/test', [
            (req, res, next) => {
                next();
            },
            async (req, res, next) => {
                next();
            },
            async (req, res, next) => {
                throw new Error('Oops!');
            }
        ]);

        app.use(router);
        app.use((err, req, res, next) => {
            res.status(500).send(err.message);
        });

        const request = supertest(app);
        const res = await request.get('/test');

        expect(res.constructor.name).toBe('Response');
        expect(res.statusCode).toBe(500);
        expect(res.error.text).toBe('Oops!');
    });

    it('handle middleware without async/await block', async () => {
        const app = express();
        const router = wrapRouter(express.Router());

        router.get('/test', [
            (req, res, next) => {
                next();
            },
            (req, res, next) => {
                try {
                    throw new Error('Oops!');
                } catch (error) {
                    next(error);
                }
            }
        ]);

        app.use(router);
        app.use((err, req, res, next) => {
            res.status(500).send(err.message);
        });

        const request = supertest(app);
        const res = await request.get('/test');

        expect(res.constructor.name).toBe('Response');
        expect(res.statusCode).toBe(500);
        expect(res.error.text).toBe('Oops!');
    });
    it('handles POST requests', async () => {
        const app = express();
        const router = wrapRouter(express.Router());

        router.post('/test', async (req, res, next) => {
            res.send('POST request handled');
        });

        app.use(router);

        const request = supertest(app);
        const res = await request.post('/test');

        expect(res.statusCode).toBe(200);
        expect(res.text).toBe('POST request handled');
    });

    it('handles PUT requests', async () => {
        const app = express();
        const router = wrapRouter(express.Router());

        router.put('/test', async (req, res, next) => {
            res.send('PUT request handled');
        });

        app.use(router);

        const request = supertest(app);
        const res = await request.put('/test');

        expect(res.statusCode).toBe(200);
        expect(res.text).toBe('PUT request handled');
    });

    it('handles 404 errors for non-existing routes', async () => {
        const app = express();
        const router = wrapRouter(express.Router());

        app.use(router);
        app.use((req, res, next) => {
            res.status(404).send('Not Found');
        });

        const request = supertest(app);
        const res = await request.get('/non-existing-route');

        expect(res.statusCode).toBe(404);
        expect(res.text).toBe('Not Found');
    });
});
