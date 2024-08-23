var Socket = {
    websocket: null,
    lastMessageTimestamp: 0,
    connecting: false,
    connected: false,
    log: [],
    UUID: "",
    LOG_KEY: "webdashboard-log",
    UUID_KEY: "uuid",

    DISCONNECTED_STATUS_STRING: "disconnected",
    QUEUED_STATUS_STRING: "queued",
    CONNECTED_STATUS_STRING: "connected",
    CONNECTED_STATUS_COLOR: "limegreen",

    ElementIds: {
        STATUS_CONTAINER: "status-container",
        STATUS: "status",
        LOG_CONTAINER: "log-container"
    },

    MessageActions: {
        REQUEST_CLIENT_DETAILS: "request_client_details",
        CLIENT_DETAILS: "client_details",
        SET_ACTIVE: "set_active",
        UPDATE_NODES: "update_nodes",
        CREATE_NOTICE: "create_notice",
        CONSOLE_LOG: "console_log",
        CONSOLE_WARN: "console_warn",
        NEW_LOG: "new_log",
        LOG_MESSAGE: "log_entry"
    },

    JsonKeys: {
        MESSAGE_ACTION_KEY: "action",
        NODES_KEY: "nodes",
        NODE_ID_KEY: "node_id",
        NODE_TYPE_KEY: "node_type",
        NODE_STATE_KEY: "node_state",
        ENTRIES_KEY: "entries",
        ENTRY_KEY: "entry",
        TAG_KEY: "tag",
        TIME_KEY: "time",
        HAS_JSON_KEY: "has_json",
        ENTRY_DATA_KEY: "data",
        NOTICE_MESSAGE_KEY: "notice_message",
        NOTICE_TYPE_KEY: "notice_type",
        NOTICE_DURATION_KEY: "notice_duration",
        INFO_KEY: "info"
    },

    initializeSocket: function () {
        if (localStorage.getItem(Socket.LOG_KEY) == undefined) {
            let log = {
                entries: []
            };
            localStorage.setItem(Socket.LOG_KEY, log);
        }
        Socket.displayAllLogEntries();
        loadedUUID = localStorage.getItem(Socket.UUID_KEY);
        if (loadedUUID == null) {
            loadedUUID = crypto.randomUUID();
            localStorage.setItem(Socket.UUID_KEY, loadedUUID);
        }
        Socket.UUID = loadedUUID;
        CustomEventChecker.addEventChecker(new CustomEventChecker.EventChecker("disconnected", Socket.disconnected, window));
        addEventListener("disconnected", () => {
            Socket.connected = false;
            document.getElementById(Socket.ElementIds.STATUS_CONTAINER).style.backgroundColor = "red";
            document.getElementById(Socket.ElementIds.STATUS).innerHTML = Socket.DISCONNECTED_STATUS_STRING;
            if (!Socket.connecting) Socket.openSocket(0);
        });
        Socket.openSocket(0);
    },


    sendRustboard: function() {
        let message = { 
            action: Socket.MessageActions.UPDATE_NODES,
            nodes: Whiteboard.getSendableRustboardJson(),
        };
        Socket.sendData(JSON.stringify(message));
    },

    sendRustboardDetails: function () {
        let message = { 
            action: Socket.MessageActions.CLIENT_DETAILS,
            utc_time: Date.now(),
            uuid: Socket.UUID,
            nodes: Whiteboard.getSendableRustboardJson(),
        };
        Socket.sendData(JSON.stringify(message));
    },

    sendData: function (data) {
        try {
            Socket.websocket.send(data);
        } catch {
            if (Socket.connected) Notify.createNotice("Could not properly connect to the robot", Notify.NEGATIVE, 5000);
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
            Notify.createNotice("Connected to the robot", Notify.POSITIVE, 8000);
            document.getElementById(Socket.ElementIds.STATUS_CONTAINER).style.backgroundColor = Socket.CONNECTED_STATUS_COLOR;
            document.getElementById(Socket.ElementIds.STATUS).innerHTML = Socket.QUEUED_STATUS_STRING;
            Socket.sendRustboardDetails();
        };
        Socket.websocket.onmessage = (event) => { Socket.handleMessage(JSON.parse(event.data)) };
        if (recursion == 0) {
            Socket.connecting = true;
            Notify.createNotice("Attempting to connect to the robot...", Notify.NEUTRAL, 3000);
            Socket.websocket.onerror = () => { Notify.createNotice("Could not connect to the robot", Notify.NEGATIVE, 8000); Socket.openSocket(recursion + 1); };
        } else {
            Socket.websocket.onerror = () => { Socket.openSocket(recursion + 1); }
        }
    },

    disconnected: function () {
        return Date.now() - Socket.lastMessageTimestamp > 7500;
    },

    handleMessage: function (message) {
        Socket.lastMessageTimestamp = Date.now();
        if (message[Socket.JsonKeys.MESSAGE_ACTION_KEY] === Socket.MessageActions.REQUEST_CLIENT_DETAILS) {
            Socket.sendRustboardDetails();
        } if (message[Socket.JsonKeys.MESSAGE_ACTION_KEY] === Socket.MessageActions.SET_ACTIVE) {
            document.getElementById(Socket.ElementIds.STATUS).innerHTML = Socket.CONNECTED_STATUS_STRING;
        } else if (message[Socket.JsonKeys.MESSAGE_ACTION_KEY] === Socket.MessageActions.UPDATE_NODES) {
            try {
                for (let i = 0; i < message[Socket.JsonKeys.NODES_KEY].length; i++) {
                    toUpdate = message[Socket.JsonKeys.NODES_KEY][i];
                    Whiteboard.updateNodeState(toUpdate[Socket.JsonKeys.NODE_ID_KEY], toUpdate[Socket.JsonKeys.NODE_TYPE_KEY], toUpdate[Socket.JsonKeys.NODE_STATE_KEY]);
                }
            } catch (error) {
                console.warn(error);
            }
        } else if (message[Socket.JsonKeys.MESSAGE_ACTION_KEY] === Socket.MessageActions.CREATE_NOTICE) {
            Notify.createNotice(message[Socket.JsonKeys.NOTICE_MESSAGE_KEY], message[Socket.JsonKeys.NOTICE_TYPE_KEY], parseInt(message[Socket.JsonKeys.NOTICE_DURATION_KEY]));
        } else if (message[Socket.JsonKeys.MESSAGE_ACTION_KEY] === Socket.MessageActions.CONSOLE_LOG) {
            console.log(message[Socket.JsonKeys.INFO_KEY]);
        } else if (message[Socket.JsonKeys.MESSAGE_ACTION_KEY] === Socket.MessageActions.CONSOLE_WARN) {
            console.warn(message[Socket.JsonKeys.INFO_KEY]);
        } else if (message[Socket.JsonKeys.MESSAGE_ACTION_KEY] === Socket.MessageActions.LOG_MESSAGE) {
            let currentLog = JSON.parse(localStorage.getItem(Socket.LOG_KEY));
            currentLog[Socket.JsonKeys.ENTRIES_KEY].push(message[Socket.JsonKeys.ENTRY_KEY]);
            localStorage.setItem(Socket.LOG_KEY, JSON.stringify(currentLog));
            Socket.displayLogEntry(message[Socket.JsonKeys.ENTRY_KEY]);
        } else if (message[Socket.JsonKeys.MESSAGE_ACTION_KEY] === Socket.MessageActions.NEW_LOG) {
            let log = {};
            log[Socket.JsonKeys.ENTRIES_KEY] = message[Socket.JsonKeys.ENTRIES_KEY];
            localStorage.setItem(Socket.LOG_KEY, JSON.stringify(log));
            Socket.displayAllLogEntries();
        }
    },

    displayAllLogEntries: function() {
        let log = JSON.parse(localStorage.getItem(Socket.LOG_KEY));
        document.getElementById(Socket.ElementIds.LOG_CONTAINER).innerHTML = "";
        if (log != undefined && log[Socket.JsonKeys.ENTRIES_KEY] != undefined) {
            for (let i = 0; i < log[Socket.JsonKeys.ENTRIES_KEY].length; i++) {
                Socket.displayLogEntry(log[Socket.JsonKeys.ENTRIES_KEY][i]);
            }  
        }
    },

    displayLogEntry: function(entry) {
        let logContainer = document.getElementById(Socket.ElementIds.LOG_CONTAINER);
        let logPre = document.createElement("pre");
        logPre.classList.add("log-entry");
        let color;
        if (entry[Socket.JsonKeys.TAG_KEY] === "E") {
            color = "red";
        } else if (entry[Socket.JsonKeys.TAG_KEY] === "W") {
            color = "#ffc90e";
        } else if (entry[Socket.JsonKeys.TAG_KEY] === "M") {
            color = "white";
        }
        logPre.style.color = color;
        let innerHTML = (new Date(parseInt(entry[Socket.JsonKeys.TIME_KEY]))).toString() + " -------- ";
        if (entry[Socket.JsonKeys.HAS_JSON_KEY]) {
            innerHTML += JSON.stringify(entry[Socket.JsonKeys.ENTRY_DATA_KEY]);
        } else {
            innerHTML += entry[Socket.JsonKeys.ENTRY_DATA_KEY];
        }
        logPre.innerHTML = innerHTML;
        logContainer.appendChild(logPre);
    }
};

window.Socket = Socket || {};