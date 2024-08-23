var Socket = {
    websocket: null,
    lastMessageTimestamp: 0,
    connecting: false,
    connected: false,
    log: [],
    uuid: "",
    logKey: "webdashboard-log",

    MessageActions: {
        requestClientDetails: "request_client_details",
        clientDetails: "client_details",
        setActive: "set_active",
        updateNodes: "update_nodes",
        createNotice: "create_notice",
        consoleLog: "console_log",
        consoleWarn: "console_warn",
        newLog: "new_log",
        logMessage: "log_entry"
    },

    JsonKeys: {

    },

    initializeSocket: function () {
        if (localStorage.getItem(Socket.logKey) == undefined) {
            let log = {
                entries: []
            };
            localStorage.setItem(Socket.logKey, log);
        }
        Socket.displayAllLogEntries();
        Socket.sendRustboardDetails(); // Delete later
        loadedUUID = localStorage.getItem("uuid");
        if (loadedUUID == null) {
            loadedUUID = crypto.randomUUID();
            localStorage.setItem("uuid", loadedUUID);
        }
        Socket.uuid = loadedUUID;
        CustomEventChecker.addEventChecker(new CustomEventChecker.EventChecker("disconnected", Socket.disconnected, window));
        addEventListener("disconnected", () => {
            Socket.connected = false;
            document.getElementById("status-container").style.backgroundColor = "red";
            document.getElementById("status").innerHTML = "disconnected";
            if (!Socket.connecting) Socket.openSocket(0);
        });
        Socket.openSocket(0);
    },


    sendRustboard: function() {
        let message = { 
            action: Socket.MessageActions.updateNodes,
            nodes: Whiteboard.getSendableRustboardJson(),
        };
        Socket.sendData(JSON.stringify(message));
    },

    sendRustboardDetails: function () {
        let message = { 
            action: Socket.MessageActions.clientDetails,
            utc_time: Date.now(),
            uuid: Socket.uuid,
            nodes: Whiteboard.getSendableRustboardJson(),
        };
        Socket.sendData(JSON.stringify(message));
    },

    sendData: function (data) {
        try {
            Socket.websocket.send(data);
        } catch {
            if (Socket.connected) Notify.createNotice("Could not properly connect to the robot", "negative", 5000);
        }
    },

    openSocket: function (recursion) {
        try {
            Socket.websocket = new WebSocket(SettingsManager.websocketURL);
        } catch {
            console.error("Error creating websocket")
        }
        Socket.websocket.onopen = () => {
            Socket.connecting = false;
            Socket.connected = true;
            Notify.createNotice("Connected to the robot", "positive", 8000);
            document.getElementById("status-container").style.backgroundColor = "limegreen";
            document.getElementById("status").innerHTML = "queued";
            Socket.sendRustboardDetails();
        };
        Socket.websocket.onmessage = (event) => { Socket.handleMessage(JSON.parse(event.data)) };
        if (recursion == 0) {
            Socket.connecting = true;
            Notify.createNotice("Attempting to connect to the robot...", "neutral", 3000);
            Socket.websocket.onerror = () => { Notify.createNotice("Could not connect to the robot", "negative", 8000); Socket.openSocket(recursion + 1); };
        } else {
            Socket.websocket.onerror = () => { Socket.openSocket(recursion + 1); }
        }
    },

    disconnected: function () {
        return Date.now() - Socket.lastMessageTimestamp > 7500;
    },

    handleMessage: function (message) {
        Socket.lastMessageTimestamp = Date.now();
        if (message.action === Socket.MessageActions.requestClientDetails) {
            Socket.sendRustboardDetails();
        } if (message.action === Socket.MessageActions.setActive) {
            document.getElementById("status").innerHTML = "connected";
        } else if (message.action === Socket.MessageActions.updateNodes) {
            try {
                for (let i = 0; i < message.nodes.length; i++) {
                    toUpdate = message.nodes[i];
                    Whiteboard.updateNodeState(toUpdate.node_id, toUpdate.node_type, toUpdate.node_state);
                }
            } catch (error) {
                console.warn(error);
            }
        } else if (message.action === Socket.MessageActions.createNotice) {
            Notify.createNotice(message.notice_message, message.notice_type, parseInt(message.notice_duration));
        } else if (message.action === Socket.MessageActions.consoleLog) {
            console.log(message.info);
        } else if (message.action === Socket.MessageActions.consoleWarn) {
            console.warn(message.info);
        } else if (message.action === Socket.MessageActions.logMessage) {
            let currentLog = JSON.parse(localStorage.getItem(Socket.logKey));
            currentLog.entries.push(message.entry);
            localStorage.setItem(Socket.logKey, JSON.stringify(currentLog));
            Socket.displayLogEntry(message.entry);
        } else if (message.action === Socket.MessageActions.newLog) {
            localStorage.setItem(Socket.logKey, JSON.stringify(
            {
                entries: message.entries
            }
        ));
        Socket.displayAllLogEntries();
        }
    },

    displayAllLogEntries: function() {
        let log = JSON.parse(localStorage.getItem(Socket.logKey));
        document.getElementById("log-container").innerHTML = "";
        if (log != undefined && log.entries != undefined) {
            for (let i = 0; i < log.entries.length; i++) {
                Socket.displayLogEntry(log.entries[i]);
            }  
        }
    },

    displayLogEntry: function(entry) {
        let logContainer = document.getElementById("log-container");
        let logPre = document.createElement("pre");
        logPre.classList.add("log-entry");
        let color;
        if (entry.tag === "E") {
            color = "red";
        } else if (entry.tag === "W") {
            color = "#ffc90e";
        } else if (entry.tag === "M") {
            color = "white";
        }
        logPre.style.color = color;
        let innerHTML = (new Date(parseInt(entry["time"]))).toString() + " -------- ";
        if (entry.has_json) {
            innerHTML += JSON.stringify(entry.data);
        } else {
            innerHTML += entry.data;
        }
        logPre.innerHTML = innerHTML;
        logContainer.appendChild(logPre);
    }
};

window.Socket = Socket || {};