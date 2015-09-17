var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var cache = {};  // Object for caching file contents

// Create HTTP server
var server = http.createServer(function (request, response) {
    var filePath = false;

    if (request.url == '/') {
        filePath = 'public/index.html';
    }
    // Form data storage on URL
    else if (request.url.indexOf('?') != -1) {
        filePath = 'public' + request.url.substring(0, request.url.indexOf('?'));
    }
    else {
        filePath = 'public' + request.url;
    }
    var absPath = './' + filePath;
    serveStatic(response, cache, absPath);
});

// Start HTTP server
server.listen(3000, function () {
    console.log("Server listening on port 3000.");
});

// Socket.IO initialization
var chatServer = require('./lib/chat_server');
chatServer.listen(server);

/* Functions */

// Send 404 error
function send404(response) {
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.write('Error 404: File Not Found');
    response.end();
}

// Send file contents
function sendFile(response, filePath, fileContents) {
    response.writeHead(200, { 'content-type': mime.lookup(path.basename(filePath)) });
    response.end(fileContents);
}

// Check if a file is cached
// If yes, return the file
// If no, read the file from disk to cahce and return
// If file not exists, return HTTP 404 error
function serveStatic(response, cache, absPath) {
    if (cache[absPath]) {
        sendFile(response, absPath, cache[absPath]);
    }
    else {
        fs.exists(absPath, function (exists) {
            if (exists) {
                fs.readFile(absPath, function (err, data) {
                    if (err) {
                        send404(response);
                    }
                    else {
                        cache[absPath] = data;
                        sendFile(response, absPath, data);
                    }
                });
            }
            else {
                send404(response);
            }
        });
    }
}