require('dotenv').config();
const http = require('http');
const app = require('./index');

const server = http.createServer(app);
const port = process.env.PORT;
server.listen(port, () => {
    console.log("Server running in port: " + port);
});