const express = require('express');
const app = express();
const puppeteer = require('puppeteer-core');
const path = require('path');
const { executablePath } = require('puppeteer');
const fs = require('fs');
const ejs = require('ejs');
const templatePath = path.join(__dirname, 'template.ejs');
const templateContent = fs.readFileSync(templatePath, 'utf8');

// Route to generate dynamic images
app.get('/generate', async (req, res) => {
    try {
        const { imageUrl, title, description } = req.query;

        // Launch headless browser
        const browser = await puppeteer.launch({ headless: false, executablePath: executablePath() });
        const page = await browser.newPage();

        // Set viewport size
        await page.setViewport({ width: 700, height: 400 });

        // Render EJS template with dynamic data within browser context
        const content = await page.evaluate(async (templateContent, imageUrl, title, description) => {
            // Function to render EJS template within browser context
            function renderTemplate(template, data) {
                const keys = Object.keys(data);
                return keys.reduce((html, key) => {
                    return html.replace(new RegExp(`<%=\\s*${key}\\s*%>`, 'g'), data[key]);
                }, template);
            }

            // Render the template with dynamic data
            return renderTemplate(templateContent, { imageUrl, title, description });
        }, templateContent, imageUrl, title, description);

        // Set content of the page
        await page.setContent(content);

        // Generate screenshot of the rendered HTML
        const screenshot = await page.screenshot({ type: 'jpeg' });

        // Close the browser
        await browser.close();

        // Send image as API response
        res.set('Content-Type', 'image/jpeg');
        res.send(screenshot);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});