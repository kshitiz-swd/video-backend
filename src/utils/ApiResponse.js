class ApiResponse {
    constructor(
        message = "success",
        data,
        statusCode
    ) {
        this.message = message
        this.statusCode = statusCode
        this.data = data
        this.success = statusCode < 400
    }
}

export { ApiResponse }