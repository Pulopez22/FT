const mode = (process.env.HOST_MODE || '').toLowerCase();

if (mode === 'frontend') {
    console.log('🌐 Starting Square Foot Printing FRONTEND mode');
    require('./frontend-server');
} else {
    console.log('⚙️ Starting Square Foot Printing BACKEND mode');
    require('./server');
}