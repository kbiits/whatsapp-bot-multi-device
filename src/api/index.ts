import http from "http";
import sock from "../sock";
import logger from "../logger";
const HTTP_PORT = process.env.HTTP_PORT || 3000;

const simpleRouter = {
    "POST:/send-message": (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage> & {
        req: http.IncomingMessage;
    }) => {
        // parse the incoming request data as JSON
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // convert Buffer to string
        });
        req.on('close', async () => {
            let data: Record<string, any>;
            try {
                data = JSON.parse(body);
                if (!data.to || !data.message) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', message: 'Missing "to" or "message" field' }));
                    return;
                }
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
                return;
            }

            try {
                await sock.sendMessage(data.to, data.message)
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', message: 'Message sent successfully' }));
            } catch (error) {
                logger.error(error, 'Error sending message:');
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: 'Failed to send message' }));
            }
        });
    }
};

export default function bootstrapAPI() {
    const httpServer = http.createServer((req, res) => {
        const { url, method } = req;

        const routeKey = `${method}:${url}`;
        const routeHandler = simpleRouter[routeKey];
        if (routeHandler) {
            routeHandler(req, res);
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'error', message: 'Not Found' }));
        }
    });

    return {
        getServer: () => httpServer,
        start: (callback?: () => void) => httpServer.listen(HTTP_PORT, callback),
        stop: (callback?: () => void) => {
            httpServer.close(callback);
        }
    }
}