class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        stack="",
        errors = []
    ) {
        super(message)
        this.message = message,
        this.statusCode = statusCode,
        this.data = null,
        this.stack = stack,
        this.success = false
        this.errors = errors

    }
}

export {ApiError}