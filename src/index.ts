import express from 'express';
import { env } from './config/env.js';
import type { Request, Response, NextFunction } from 'express';

const app = express();

app.get("/", (req, res) => {
    res.send('<h1>Welcome to the Express Server!</h1>');
})

app.use((req, res) => {
    res.status(404).send('<h1>404 Not Found</h1>');
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('<h1>500 Internal Server Error</h1>');
});

app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
});