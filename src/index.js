import express from 'express';
import cors from 'cors'
import clientRoutes from "./routes/clientRoutes.js"
import { query } from "./db.js";
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Health check endpoint

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/health', async (req, res) => {
    try {
        await query('SELECT 1');
        // throw new Error('Simulated DB Failure');
        // throw new Error('Simulated DB Failure');
        const data = { status: 'ok', database: 'connected' };
        
        if (req.accepts('html')) {
            const templatePath = path.join(__dirname, 'templates', 'health.html');
            fs.readFile(templatePath, 'utf8', (err, html) => {
                if (err) {
                    console.error('Error reading template:', err);
                    return res.status(500).send('<h1>Internal Server Error</h1>');
                }
                
                const cssVariables = `
                :root {
                    --status-color: #2ecc71;
                    --status-bg-color: rgba(46, 204, 113, 0.1);
                }`;

                const renderedHtml = html
                    .replace('/* {{CSS_VARIABLES}} */', cssVariables)
                    .replace('{{TITLE}}', 'System Operational')
                    .replace('{{MESSAGE}}', 'All systems are running smoothly.')
                    .replace('{{DB_STATUS}}', 'Connected');
                
                res.send(renderedHtml);
            });
        } else {
            res.status(200).json(data);
        }
    } catch (error) {
        console.error('Health check failed:', error);
        if (req.accepts('html')) {
             const templatePath = path.join(__dirname, 'templates', 'health.html');
             fs.readFile(templatePath, 'utf8', (err, html) => {
                if (err) {
                    // Fallback if template fails
                    return res.status(500).send(`<h1>System Malfunction</h1><p>Database disconnected</p>`);
                }

                const cssVariables = `
                :root {
                    --status-color: #ef4444;
                    --status-bg-color: rgba(239, 68, 68, 0.1);
                }`;

                 const renderedHtml = html
                    .replace('/* {{CSS_VARIABLES}} */', cssVariables)
                    .replace('{{TITLE}}', 'System Malfunction')
                    .replace('{{MESSAGE}}', 'Database connection failure.')
                    .replace('{{DB_STATUS}}', 'Disconnected');
                
                res.status(500).send(renderedHtml);
             });
        } else {
            res.status(500).json({ status: 'error', database: 'disconnected' });
        }
    }
});

app.use('/api', clientRoutes);

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`listening on port ${port}`)
    });
}

export default app;

