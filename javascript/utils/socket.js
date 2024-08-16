var Socket = {
    websocket: null,
    lastMessageTimestamp: 0,
    connecting: false,
    connected: false,
    log: "",
    uuid: "",

    initializeSocket: function () {
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

    sendLayout: function () {
        let message = { 
            action: "client_details",
            utc_time: Date.now(),
            uuid: Socket.uuid,
            nodes: Load.getLayoutObject().nodeData,
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
        let log = localStorage.getItem("webdashboard-log");
        if (log != undefined) {
            Socket.log = log;
        }
        try {
            Socket.websocket = new WebSocket("ws://192.168.43.1:5801"/*WhiteboardSettings.websocketURL*/);
        } catch {
            console.error("Error creating websocket")
        }
        Socket.websocket.onopen = () => {
            Socket.connecting = false;
            Socket.connected = true;
            Notify.createNotice("Connected to the robot", "positive", 8000);
            document.getElementById("status-container").style.backgroundColor = "limegreen";
            document.getElementById("status").innerHTML = "queued";
            Socket.sendLayout();
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
        if (message.action === "set_active") {
            document.getElementById("status").innerHTML = "connected";
        } else if (message.action === "update_nodes") {
            try {
                for (let i = 0; i < message.nodes.length; i++) {
                    toUpdate = message.nodes[i];
                    Whiteboard.updateNodeState(toUpdate.id, toUpdate.type, toUpdate.state);
                    console.log("successfully update nodes");
                }
            } catch (error) {
                console.warn(error);
            }
        } else if (message.action === "create_notice") {
            Notify.createNotice(message.notice_message, message.notice_type, parseInt(message.notice_duration));
        } else if (message.action === "console_log") {
            console.log(message.info);
        } else if (message.action === "clear_log") {
            Socket.log = "";
        } else if (message.action === "log") {
            Socket.log += "\n" + message.value;
            localStorage.setItem("webdashboard-log", Socket.log);
        }
    },

    downloadRobotLog: function() {
        const file = new File([Socket.log], "log.txt", { type: 'text/plain' });
        const fileUrl = URL.createObjectURL(file);
        let anchor = document.createElement("a");
        anchor.href = fileUrl;
        anchor.target = "blank";
        anchor.click();
    }

};

window.Socket = Socket || {};