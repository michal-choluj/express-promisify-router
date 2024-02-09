const express = require('express');
const { typeOf, findNext, findResponse, findError } = require('./utils');

module.exports = {
    Router: function asyncRouter() {
        return wrapRouter(express.Router.apply(express, arguments));
    },
    wrapRouter,
    wrapFunction
};

/**
 * This function wraps the provided router in various ways, similar to how Express.js does.
 * It throws an error for unsupported router formats.
 *
 * @param {any} router - The router to be wrapped.
 * @throws {Error} Will throw an error if the provided router format is unsupported.
 */
function wrapRouter(app, methodsSet = new Set(['use', 'get', 'post', 'put', 'patch', 'delete', 'head'])) {
    const routeFn = app.route;
    app.route = function route(...options) {
        return wrapRouter(routeFn.apply(app, options));
    };

    const paramFn = app.param;
    app.param = function param(name, callback) {
        const wrappedCallback = wrapFunction(callback);
        paramFn.call(app, name, wrappedCallback);
    };

    for (const method of methodsSet) {
        const fn = app[method];
        app[method] = function () {
            const args = wrapArgs(arguments);
            return fn.apply(app, args);
        };
    }
    return app;
}

/**
 * This function wraps the provided args in various ways, similar to how Express.js does.
 * It throws an error for unsupported args format.
 *
 * @param {any} middleware - The arg to be wrapped.
 * @throws {Error} Will throw an error if the provided arg format is unsupported.
 */
function wrapArgs(args) {
    const ret = [];
    for (const fn of args) {
        if (fn instanceof RegExp) {
            ret.push(fn);
            continue;
        }
        switch (typeOf(fn)) {
            case 'string':
                ret.push(fn);
                continue;
            case 'array':
                ret.push(wrapArgs(fn));
                return ret;
            case 'function':
                ret.push(wrapFunction(fn));
                continue;
            default:
                throw new Error(`Unsupported argument type: ${typeof args}`);
        }
    }
    return ret;
}

/**
 * This function is intended to handle errors. However, if no error occurred in the previous iteration,
 * it will simply pass through the input as is.
 *
 * @param {Function} fn - The function to be wrapped.
 * @throws {Error} Will throw an error if the provided argument is not a function.
 */
function wrapFunction(fn) {
    if (typeof fn !== 'function') {
        throw new Error('fn must be a function');
    }
    return async function asyncWrapper(...args) {
        const err = findError(args);
        const res = findResponse(args);
        const next = findNext(args);
        if (err) {
            return next(err);
        }
        try {
            const response = await fn(...args);
            if (!res.headersSent && response !== undefined) {
                res.send(response);
            }
        } catch (err) {
            if (!res.headersSent) {
                next(err);
            }
        }
    };
}
