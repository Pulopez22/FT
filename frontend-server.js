const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

// Evitar exponer archivos internos del proyecto
app.use((req, res, next) => {
    const blocked = [
        '/node_modules',
        '/.git',
        '/.env',
        '/server.js',
        '/launcher.js',
        '/frontend-server.js',
        '/package.json',
        '/package-lock.json'
    ];

    const isBlocked = blocked.some(item =>
        req.path === item ||
        req.path.startsWith(item + '/')
    );

    if (isBlocked) {
        return res.status(404).send('Not Found');
    }

    next();
});

// Servir HTML, JS, CSS, imágenes, carpetas de productos, etc.
app.use(
    express.static(ROOT, {
        index: 'index.html',
        dotfiles: 'deny'
    })
);

app.get('/', (req, res) => {
    res.sendFile(path.join(ROOT, 'index.html'));
});

app.listen(PORT, () => {
    console.log(
        `🌐 Square Foot Printing frontend ready on port ${PORT}`
    );
});