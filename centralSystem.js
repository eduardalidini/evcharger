const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const http = require('http');
const enqueueLog = require('./dataBatchSender').enqueueLog;     //from dataBatchSender.js
require('dotenv').config();

const wss = new WebSocket.Server({ port: 8080 });

// HTTP server for Laravel API commands
const httpServer = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Node-Connector-Token');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    // Normalize path (ignore query)
    let pathname = '/';
    try {
        const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        pathname = u.pathname || '/';
    } catch (e) {
        pathname = (req.url || '/').split('?')[0] || '/';
    }

    // Shared-secret validation (same token used for Node->Laravel logs)
    const expectedToken = String(process.env.NODE_CONNECTOR_TOKEN || '').trim();
    const providedToken = String(req.headers['x-node-connector-token'] || '').trim();
    if (expectedToken) {
        if (!providedToken || providedToken !== expectedToken) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Unauthorized (invalid X-Node-Connector-Token)' }));
            return;
        }
    }

    if (req.method === 'POST' && pathname === '/api/ocpp/remote-start') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { cpId, idTag, connectorId = 1 } = data;
                
                if (!cpId) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'cpId is required' }));
                    return;
                }

                console.log(`🚀 API: Remote start requested for ${cpId} (connector ${connectorId})`);
                remoteStartTransaction(cpId, idTag || cpId, connectorId);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Remote start command sent' }));
            } catch (error) {
                console.error('API Error:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
            }
        });
    } else if (req.method === 'POST' && pathname === '/api/ocpp/remote-stop') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { cpId, transactionId } = data;
                
                if (!cpId || !transactionId) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'cpId and transactionId are required' }));
                    return;
                }

                console.log(`🛑 API: Remote stop requested for ${cpId} (transaction ${transactionId})`);
                remoteStopTransaction(cpId, transactionId);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Remote stop command sent' }));
            } catch (error) {
                console.error('API Error:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Not found' }));
    }
});

httpServer.listen(8888, '0.0.0.0', () => {
    console.log('🌐 HTTP API server running on http://0.0.0.0:8888');
});


// Laravel Reverb connection
let reverbWs = null; 
let reverbHeartbeatInterval = null;
let reverbIsAlive = false;
const REVERB_HOST = process.env.REVERB_HOST_NODE_CONNECTOR; 
const REVERB_PORT = process.env.REVERB_PORT_NODE_CONNECTOR; 
const REVERB_APP_KEY = process.env.REVERB_APP_KEY_NODE_CONNECTOR;


function connectToReverb() { 
    const reverbUrl = `ws://${REVERB_HOST}:${REVERB_PORT}/app/${REVERB_APP_KEY}`; 
    console.log(`Connecting to Laravel Reverb at ${reverbUrl}`); 
    // Clean up any previous heartbeat
    if (reverbHeartbeatInterval) {
        clearInterval(reverbHeartbeatInterval);
        reverbHeartbeatInterval = null;
    }
    reverbWs = new WebSocket(reverbUrl); 
    reverbWs.on('open', () => { 
        console.log('Connected to Laravel Reverb'); 
        reverbIsAlive = true;
        // Subscribe to both typical public naming schemes
        try { reverbWs.send(JSON.stringify({ event: 'pusher:subscribe', data: { channel: 'public:charging.global' } })); } catch (e) {}
        try { reverbWs.send(JSON.stringify({ event: 'pusher:subscribe', data: { channel: 'charging.global' } })); } catch (e) {}
        // Heartbeat: ping every 25s, terminate if no pong since last ping
        reverbHeartbeatInterval = setInterval(() => {
            if (!reverbWs || reverbWs.readyState !== WebSocket.OPEN) return;
            if (!reverbIsAlive) {
                console.warn('Reverb heartbeat failed; terminating to trigger reconnect');
                try { reverbWs.terminate(); } catch (e) {}
                return;
            }
            reverbIsAlive = false;
            try { reverbWs.ping(); } catch (e) {}
        }, 25000);
    }); 
    // Respond to Pusher ping frames and route custom events
    reverbWs.on('message', (raw) => {
        try {
            const msg = JSON.parse(raw.toString());
            if (msg && msg.event === 'pusher:ping') {
                try { reverbWs.send(JSON.stringify({ event: 'pusher:pong', data: {} })); } catch (e) {}
                return;
            }
            if (msg && (msg.event === 'pusher_internal:subscription_succeeded' || msg.event === 'pusher:subscription_succeeded')) {
                console.log('Reverb: subscription succeeded for channel', (msg.channel || (msg.data && msg.data.channel) || 'unknown'));
                return;
            }
            // Global handler also installed below; keep this lightweight
        } catch (e) {}
    });
    reverbWs.on('pong', () => { 
        reverbIsAlive = true; 
    });
    reverbWs.on('close', () => { 
        console.log('Disconnected from Laravel Reverb'); 
        if (reverbHeartbeatInterval) { clearInterval(reverbHeartbeatInterval); reverbHeartbeatInterval = null; }
        setTimeout(connectToReverb, 5000); 
    }); 
    reverbWs.on('error', (error) => { 
        console.error('Reverb connection error:', error); 
        // Force close to ensure reconnect if stuck
        try { if (reverbWs && reverbWs.readyState !== WebSocket.CLOSED) reverbWs.terminate(); } catch (e) {}
    }); 
}

// Connect to Reverb
connectToReverb();

console.log("?? OCPP Central System running at ws://localhost:8080/ocpp/{StationId}");

let chargePoints = {};
let transactions = {}; // { transactionId: { cpId, idTag, startTime, stopTime, meterStart, meterStop } }
let transactionCounter = 1;

//create a log file for each charger
const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
const logLine = (cpId, obj) => {
  const file = path.join(LOG_DIR, `${cpId}.log`);
  const line = JSON.stringify({ ts: new Date().toISOString(), cpId, ...obj }) + '\n';
  fs.appendFile(file, line, e => e && console.error('log write error:', e));

  enqueueLog(cpId, line.trim());   //from dataBatchSender.js to laravel db ocpp_logs

};

wss.on('connection', (ws, req) => {
    const urlParts = req.url.split('/');
    const cpId = urlParts[urlParts.length - 1];

    chargePoints[cpId] = ws;
    console.log(`?? Charger connected: ${cpId} (path: ${req.url})`);
    logLine(cpId, { event: 'connected', path: req.url });


    ws.on('message', (message) => {
        const raw = message.toString();
        console.log(`?? From ${cpId}: ${raw}`);
        logLine(cpId, { dir: '←', raw });

        try {
            const data = JSON.parse(raw);
            const [messageType, uniqueId, action, payload] = data;

            if (messageType === 3) { // CALLRESULT from charger
                if (action === 'GetConfiguration') {
                    const configInfo = {
                        configurationKey: payload.configurationKey,
                        unknownKey: payload.unknownKey
                    };
                    logLine(cpId, { dir: '←', type: 'CALLRESULT', uniqueId, payload: data[2] });
                    console.log(`?? CALLRESULT received from ${cpId} (uniqueId: ${uniqueId})`);
                    logLine(cpId, { type: 'GetConfigurationResponse', fields: configInfo, full: payload });
                    console.log(`? GetConfiguration response received from ${cpId} - ${payload.configurationKey?.length || 0} configuration keys`);
                }
            }

            if (messageType === 2) { // CALL from charger
                if (action === 'BootNotification') {
                    const k = {
                        chargePointVendor: payload.chargePointVendor,
                        chargePointModel: payload.chargePointModel,
                        chargePointSerialNumber: payload.chargePointSerialNumber,
                        chargeBoxSerialNumber: payload.chargeBoxSerialNumber,
                        firmwareVersion: payload.firmwareVersion,
                        iccid: payload.iccid,
                        imsi: payload.imsi,
                        meterType: payload.meterType,
                        meterSerialNumber: payload.meterSerialNumber
                    };
                    logLine(cpId, { type: 'BootNotification', fields: k, full: payload });

                    const response = [
                        3,
                        uniqueId,
                        {
                            currentTime: new Date().toISOString(),
                            interval: 60,
                            status: "Accepted"
                        }
                    ];
                    ws.send(JSON.stringify(response));
                    console.log(`? BootNotification Accepted for ${cpId}`);
                    logLine(cpId, { dir: '→', type: 'CALLRESULT', action, uniqueId, payload: response[2] });

                    // Request configuration after successful boot notification
                    setTimeout(() => {
                        const configUniqueId = uuidv4();
                        const configRequest = [
                            2,
                            configUniqueId,
                            "GetConfiguration",
                            { key: [] } // Empty array requests all configuration keys
                        ];
                        ws.send(JSON.stringify(configRequest));
                        console.log(`? Sent GetConfiguration request to ${cpId}`);
                        logLine(cpId, { dir: '→', type: 'CALL', action: 'GetConfiguration', uniqueId: configUniqueId, payload: { key: [] } });
                    }, 1000);
                }

                if (action === 'StatusNotification') {
                    const statusInfo = {
                        connectorId: payload.connectorId,
                        errorCode: payload.errorCode,
                        status: payload.status,
                        timestamp: payload.timestamp
                    };
                    logLine(cpId, { type: 'StatusNotification', fields: statusInfo, full: payload });

                    // Realtime push to Laravel for broadcasting
                    try {
                        const base = (process.env.LARAVEL_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
                        const url = `${base}/api/ocpp/events/status`;
                        const token = process.env.NODE_CONNECTOR_TOKEN;
                        axios.post(url, {
                            identifier: cpId,
                            connectorId: payload.connectorId,
                            status: payload.status,
                            timestamp: payload.timestamp,
                        }, {
                            headers: {
                                'X-Node-Connector-Token': token,
                                'Content-Type': 'application/json',
                            },
                            timeout: 4000,
                        }).catch(e => {
                            console.warn('Realtime status push failed:', e.message);
                        });
                    } catch (e) {}

                    const response = [
                        3,
                        uniqueId,
                        {}
                    ];
                    ws.send(JSON.stringify(response));
                    console.log(`? StatusNotification received from ${cpId} - Connector ${payload.connectorId}: ${payload.status}`);
                    logLine(cpId, { dir: '→', type: 'CALLRESULT', action, uniqueId, payload: response[2] });
                }

                if (action === 'MeterValues') {
                    const meterInfo = {
                        connectorId: payload.connectorId,
                        transactionId: payload.transactionId,
                        meterValue: payload.meterValue
                    };
                    logLine(cpId, { type: 'MeterValues', fields: meterInfo, full: payload });

                    const response = [
                        3,
                        uniqueId,
                        {}
                    ];
                    ws.send(JSON.stringify(response));
                    console.log(`? MeterValues received from ${cpId} - Connector ${payload.connectorId}`);
                    logLine(cpId, { dir: '→', type: 'CALLRESULT', action, uniqueId, payload: response[2] });
                }

                if (action === 'FirmwareStatusNotification') {
                    const firmwareInfo = {
                        status: payload.status
                    };
                    logLine(cpId, { type: 'FirmwareStatusNotification', fields: firmwareInfo, full: payload });

                    const response = [
                        3,
                        uniqueId,
                        {}
                    ];
                    ws.send(JSON.stringify(response));
                    console.log(`? FirmwareStatusNotification received from ${cpId} - Status: ${payload.status}`);
                    logLine(cpId, { dir: '→', type: 'CALLRESULT', action, uniqueId, payload: response[2] });
                }

                if (action === 'DiagnosticsStatusNotification') {
                    const diagnosticsInfo = {
                        status: payload.status
                    };
                    logLine(cpId, { type: 'DiagnosticsStatusNotification', fields: diagnosticsInfo, full: payload });

                    const response = [
                        3,
                        uniqueId,
                        {}
                    ];
                    ws.send(JSON.stringify(response));
                    console.log(`? DiagnosticsStatusNotification received from ${cpId} - Status: ${payload.status}`);
                    logLine(cpId, { dir: '→', type: 'CALLRESULT', action, uniqueId, payload: response[2] });
                }

                if (action === 'DataTransfer') {
                    const dataTransferInfo = {
                        vendorId: payload.vendorId,
                        messageId: payload.messageId,
                        data: payload.data
                    };
                    logLine(cpId, { type: 'DataTransfer', fields: dataTransferInfo, full: payload });

                    const response = [
                        3,
                        uniqueId,
                        { status: "Accepted" }
                    ];
                    ws.send(JSON.stringify(response));
                    console.log(`? DataTransfer received from ${cpId} - Vendor: ${payload.vendorId}, Message: ${payload.messageId}`);
                    logLine(cpId, { dir: '→', type: 'CALLRESULT', action, uniqueId, payload: response[2] });
                }

                if (action === 'SecurityEventNotification') {
                    const securityInfo = {
                        type: payload.type,
                        timestamp: payload.timestamp,
                        techInfo: payload.techInfo
                    };
                    logLine(cpId, { type: 'SecurityEventNotification', fields: securityInfo, full: payload });

                    const response = [
                        3,
                        uniqueId,
                        {}
                    ];
                    ws.send(JSON.stringify(response));
                    console.log(`? SecurityEventNotification received from ${cpId} - Type: ${payload.type}`);
                    logLine(cpId, { dir: '→', type: 'CALLRESULT', action, uniqueId, payload: response[2] });
                }

                if (action === 'Authorize') {
                    const authorizeInfo = {
                        idTag: payload.idTag,
                        idTagInfo: payload.idTagInfo,
                        parentIdTag: payload.parentIdTag
                    };
                    logLine(cpId, { type: 'Authorize', fields: authorizeInfo, full: payload });

                    const response = [
                        3,
                        uniqueId,
                        { idTagInfo: { status: "Accepted" } }
                    ];
                    ws.send(JSON.stringify(response));
                    console.log(`? Authorize received from ${cpId} - ID Tag: ${payload.idTag}`);
                    logLine(cpId, { dir: '→', type: 'CALLRESULT', action, uniqueId, payload: response[2] });
                }

                if (action === 'ChangeAvailability') {
                    const availabilityInfo = {
                        connectorId: payload.connectorId,
                        type: payload.type
                    };
                    logLine(cpId, { type: 'ChangeAvailability', fields: availabilityInfo, full: payload });

                    const response = [
                        3,
                        uniqueId,
                        { status: "Accepted" }
                    ];
                    ws.send(JSON.stringify(response));
                    console.log(`? ChangeAvailability received from ${cpId} - Connector: ${payload.connectorId}, Type: ${payload.type}`);
                    logLine(cpId, { dir: '→', type: 'CALLRESULT', action, uniqueId, payload: response[2] });
                }

                if (action === 'ChangeConfiguration') {
                    const configChangeInfo = {
                        key: payload.key,
                        value: payload.value
                    };
                    logLine(cpId, { type: 'ChangeConfiguration', fields: configChangeInfo, full: payload });

                    const response = [
                        3,
                        uniqueId,
                        { status: "Accepted" }
                    ];
                    ws.send(JSON.stringify(response));
                    console.log(`? ChangeConfiguration received from ${cpId} - Key: ${payload.key}, Value: ${payload.value}`);
                    logLine(cpId, { dir: '→', type: 'CALLRESULT', action, uniqueId, payload: response[2] });
                }

                if (action === 'Heartbeat') {
                    const response = [
                        3,
                        uniqueId,
                        { currentTime: new Date().toISOString() }
                    ];
                    ws.send(JSON.stringify(response));
                    console.log(`?? Heartbeat response sent to ${cpId}`);
                }

                if (action === 'StartTransaction') {
                    const txId = transactionCounter++;
                    transactions[txId] = {
                        cpId,
                        idTag: payload.idTag,
                        startTime: payload.timestamp,
                        meterStart: payload.meterStart,
                        stopTime: null,
                        meterStop: null
                    };

                    const startTransactionInfo = {
                        connectorId: payload.connectorId,
                        idTag: payload.idTag,
                        timestamp: payload.timestamp,
                        meterStart: payload.meterStart,
                        reservationId: payload.reservationId,
                        transactionId: txId
                    };
                    logLine(cpId, { type: 'StartTransaction', fields: startTransactionInfo, full: payload });

                    const response = [
                        3,
                        uniqueId,
                        {
                            transactionId: txId,
                            idTagInfo: { status: "Accepted" }
                        }
                    ];
                    ws.send(JSON.stringify(response));
                    console.log(`?? Transaction ${txId} started on ${cpId} - Connector: ${payload.connectorId}, ID Tag: ${payload.idTag}`);
                    logLine(cpId, { dir: '→', type: 'CALLRESULT', action, uniqueId, payload: response[2] });
                }

                if (action === 'StopTransaction') {
                    const txId = payload.transactionId;
                    if (transactions[txId]) {
                        transactions[txId].stopTime = payload.timestamp;
                        transactions[txId].meterStop = payload.meterStop;
                    }

                    const stopTransactionInfo = {
                        transactionId: payload.transactionId,
                        timestamp: payload.timestamp,
                        meterStop: payload.meterStop,
                        reason: payload.reason,
                        idTag: payload.idTag,
                        transactionData: transactions[txId] || null
                    };
                    logLine(cpId, { type: 'StopTransaction', fields: stopTransactionInfo, full: payload });

                    const response = [
                        3,
                        uniqueId,
                        { idTagInfo: { status: "Accepted" } }
                    ];
                    ws.send(JSON.stringify(response));
                    console.log(`?? Transaction ${txId} stopped on ${cpId} - Reason: ${payload.reason || 'Unknown'}, Meter Stop: ${payload.meterStop}`);
                    logLine(cpId, { dir: '→', type: 'CALLRESULT', action, uniqueId, payload: response[2] });
                }
            }
        } catch (err) {
            console.error("? Invalid OCPP message:", err);
        }
    });

    ws.on('close', () => {
        console.log(`? Charger disconnected: ${cpId}`);
        delete chargePoints[cpId];
    });
});

function remoteStartTransaction(cpId, idTag) {
    if (!chargePoints[cpId]) {
        console.log(`? Charger ${cpId} not connected`);
        return;
    }
    const uniqueId = uuidv4();
    const msg = [
        2,
        uniqueId,
        "RemoteStartTransaction",
        {
            idTag: idTag,
            connectorId: 1
        }
    ];
    logLine(cpId, { dir: '→', type: 'CALL', action: 'RemoteStartTransaction', uniqueId, payload: msg[3] });
    chargePoints[cpId].send(JSON.stringify(msg));
    console.log(`?? Sent RemoteStartTransaction to ${cpId}`);
}

function remoteStopTransaction(cpId, transactionId) {
    if (!chargePoints[cpId]) {
        console.log(`? Charger ${cpId} not connected`);
        return;
    }
    const uniqueId = uuidv4();
    const msg = [
        2,
        uniqueId,
        "RemoteStopTransaction",
        { transactionId: transactionId }
    ];
    logLine(cpId, { dir: '→', type: 'CALL', action: 'RemoteStopTransaction', uniqueId, payload: msg[3] });
    chargePoints[cpId].send(JSON.stringify(msg));
    console.log(`?? Sent RemoteStopTransaction to ${cpId}`);
}

