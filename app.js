// initializing the value of rate limit variable
const createUserLimiter =rateLimit({
    windowMs: 10 * 60  * 1000, // 2 min.
    max: 3 ,     // limit each IP to 3 requests per windowMs
    message: "You have exceeded the 2 minutes limit, please come again later !"
});