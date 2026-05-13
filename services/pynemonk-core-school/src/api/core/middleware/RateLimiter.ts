import rateLimit from "express-rate-limit";

/**
 * Standard API rate limiter.
 * 1000 requests per 15 minutes by default.
 */
export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: {
        success: false,
        message: "Too many requests from this IP, please try again after 15 minutes"
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Sensitive operation rate limiter (e.g. login, destructive actions).
 * 100 requests per 15 minutes.
 */
export const sensitiveRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
        success: false,
        message: "Too many sensitive operations, please try again after 15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
});
