const express = require('express');
const https = require('https');
const http = require('http');
const aiRoutes = require("./routes/AiRoutes");
const fs = require('fs');
const userRoutes = require("./routes/UserRoutes");
const authRoutes = require("./routes/AuthRoutes");
const wallatRoutes = require("./routes/WallatRoutes");
const paymentRoutes = require("./routes/PaymentRoutes");
const cropRoutes = require("./routes/CropRoutes");
const authToken = require('./middleware/authenticateToken');
const profileCompletion = require('./middleware/profileCompltion');
const contractsRoutes = require('./routes/ContractsRoutes');
const socketIo = require('socket.io');
const cors = require('cors'); 

const sslOptions = {
  cert: fs.readFileSync('/etc/letsencrypt/live/platform.krishibharat.site/fullchain.pem'),
    key: fs.readFileSync('/etc/letsencrypt/live/platform.krishibharat.site/privkey.pem')
};

const app = express();
const server = https.createServer(sslOptions, app);
const PORT_HTTP = 5040;
const PORT_HTTPS = 8855; 
app.use(cors());
app.use(express.json());
app.use('/api/ai',aiRoutes);
app.use('/api/contracts',contractsRoutes);
app.use('/api/users', authToken, userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wallat',profileCompletion, wallatRoutes);
app.use('/api/payment',profileCompletion, paymentRoutes);
app.use('/api/crops',profileCompletion, cropRoutes);
const httpServer = http.createServer(app);
const CropController = require('./controllers/Crop');
const cropController = new CropController();
const jwt = require('jsonwebtoken');
const SECRET_KEYS = require('./config/config').SECRET_KEYS;
const ioHttp = socketIo(httpServer, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    },

    allowRequest: (req, callback) => {
        const token = req.headers['authorization'];
        if (!token) {
            return callback('Authentication error: Token missing', false);
        }

        const jwtToken = token.split(' ')[1]; 

        jwt.verify(jwtToken, SECRET_KEYS.JWT_SECRET, (err, decoded) => {
            if (err) {
                return callback('Authentication error: Invalid token', false);
            }
            req.user = decoded; // Attach user info to the request object
            callback(null, true); 
        });
    }
});

const zoneSockets = {}; // Store sockets per zone
const clients = {}; 

ioHttp.on('connection', (socket) => {
    const user = socket.request.user;

    if (!user) {
        console.log('User data not found');
        socket.disconnect();
        return;
    }
    clients[socket.id] = null;

    socket.on('set_zone', (zoneId) => {
        clients[socket.id] = zoneId; // Update the zone ID for this client
        console.log(`Client ${socket.id} set zone ID to ${zoneId}`);
    });

    console.log(`User connected to the HTTP server: ${user.userId}`);
    const checkForUpdates = async () => {
        try {
            for (const [clientId, zoneId] of Object.entries(clients)) {
                if (zoneId !== null) {
                    const crops = await cropController.getCropsByZone(zoneId);
                    ioHttp.to(clientId).emit('crops_data_update', crops);
                }
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
        }
    };
    
    // Poll every 10 seconds
    setInterval(checkForUpdates, 1000);
    // Handle real-time crop data updates
    socket.on('message', (message) => {
        console.log('message');

        const [eventName, data] = message.split(':');
        console.log(eventName,data);
        
        if (eventName === 'get_crops_by_zone') {
            const zone_id = parseInt(data);
            console.log(zone_id);

            // Register socket in zoneSockets
            if (!zoneSockets[zone_id]) {
                zoneSockets[zone_id] = new Set();
            }
            zoneSockets[zone_id].add(socket);

            cropController.getCropsByZone(zone_id)
                .then(crops => {
                    socket.emit('crops_data', crops);
                    console.log(crops);
                })
                .catch(error => {
                    socket.emit('error', 'Error fetching crops data');
                });
        }

        // Handle other events similarly
    });

    socket.on('place_bid', async (bidData) => {
        try {
            console.log(" called ");
            
            const updatedCrop = await cropController.placeBid(null, null, bidData);
            
            // Broadcast updated crop data to all sockets in the same zone
            const { zone_id } = updatedCrop; // Assuming updatedCrop contains the zone_id
            if (zoneSockets[zone_id]) {
                zoneSockets[zone_id].forEach(s => {
                    s.emit('bid_updated', updatedCrop);
                });
            }
        } catch (error) {
            socket.emit('error', 'Error placing bid');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected from the HTTP server');
        delete clients[socket.id]; // Remove the client from the list on disconnect
        Object.keys(zoneSockets).forEach(zone_id => {
            zoneSockets[zone_id].delete(socket);
            if (zoneSockets[zone_id].size === 0) {
                delete zoneSockets[zone_id];
            }
        });
    });
});

httpServer.listen(PORT_HTTP, () => {
    console.log(`HTTP Server started on localhost:${PORT_HTTP}`);
});

// Existing code

const ioHttps = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins
        methods: ["GET", "POST"]
    },

    allowRequest: (req, callback) => {
        const token = req.headers['authorization'];
        if (!token) {
            return callback('Authentication error: Token missing', false);
        }

        const jwtToken = token.split(' ')[1];

        jwt.verify(jwtToken, SECRET_KEYS.JWT_SECRET, (err, decoded) => {
            if (err) {
                return callback('Authentication error: Invalid token', false);
            }
            req.user = decoded; // Attach user info to the request object
            callback(null, true); // Accept the connection
        });
    }
});

ioHttps.on('connection', (socket) => {
    const user = socket.request.user;

    if (!user) {
        console.log('User data not found');
        socket.disconnect();
        return;
    }
    clients[socket.id] = null;

    socket.on('set_zone', (zoneId) => {
        clients[socket.id] = zoneId; // Update the zone ID for this client
        console.log(`Client ${socket.id} set zone ID to ${zoneId}`);
    });

    console.log(`User connected to the HTTPS server: ${user.userId}`);
    const checkForUpdates = async () => {
        try {
            for (const [clientId, zoneId] of Object.entries(clients)) {
                if (zoneId !== null) {
                    const crops = await cropController.getCropsByZone(zoneId);
                    ioHttps.to(clientId).emit('crops_data_update', crops); // Send update to the specific client
                }
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
        }
    };

    // Poll every 10 seconds
    setInterval(checkForUpdates, 1000);
    // Handle real-time crop data updates
    socket.on('message', (message) => {
        console.log('message');

        const [eventName, data] = message.split(':');

        if (eventName === 'get_crops_by_zone') {
            const zone_id = parseInt(data);
            console.log(zone_id);

            // Register socket in zoneSockets
            if (!zoneSockets[zone_id]) {
                zoneSockets[zone_id] = new Set();
            }
            zoneSockets[zone_id].add(socket);

            cropController.getCropsByZone(zone_id)
                .then(crops => {
                    socket.emit('crops_data', crops);
                    console.log(crops);
                })
                .catch(error => {
                    socket.emit('error', 'Error fetching crops data');
                });
        }

        // Handle other events similarly
    });

    socket.on('place_bid', async (bidData) => {
        try {
            const updatedCrop = await cropController.placeBid(null, null, bidData);

            // Broadcast updated crop data to all sockets in the same zone
            const { zone_id } = updatedCrop; // Assuming updatedCrop contains 
            // the zone_id
            console.log("updateing...");
            
            if (zoneSockets[zone_id]) {
                zoneSockets[zone_id].forEach(s => {
                    s.emit('bid_updated', updatedCrop);
                });
            }
        } catch (error) {
            socket.emit('error', 'Error placing bid');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected from the HTTPS server');
        delete clients[socket.id]; // Remove the client from the list on disconnect
        Object.keys(zoneSockets).forEach(zone_id => {
            zoneSockets[zone_id].delete(socket);
            if (zoneSockets[zone_id].size === 0) {
                delete zoneSockets[zone_id];
            }
        });
    });
});

server.listen(PORT_HTTPS, () => {
    console.log(`HTTPS Server started on port ${PORT_HTTPS}`);
});
