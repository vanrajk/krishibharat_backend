
class BaseController {
    
    sendResponse(res, data, statusCode = 200) {
        res.status(statusCode).json(data);
    }

    sendError(res, message, statusCode = 500) {
        res.status(statusCode).json({ error: message });
    }
}

module.exports = BaseController