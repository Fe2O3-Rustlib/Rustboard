window.Draggable =  class {
    static dragOffset = new Positioning.Vector2d(0, 0);
    draggable;
    draggingNode;
    position;
    onDrag = () => {};

    constructor(draggable) {
        this.draggable = draggable;
        this.draggingNode = false;

        this.setDraggablePosition = this.setDraggablePosition.bind(this);
        this.mouseDrag = this.mouseDrag.bind(this);
        this.stopDragging = this.stopDragging.bind(this);

        this.draggable.onmousedown = function (event) {
            event.stopPropagation();
            if (Whiteboard.editingMode && event.button === 0) {
                if (this.draggingNode) {
                    this.stopDragging();
                } else {
                    Draggable.dragOffset = new Positioning.Vector2d(Positioning.mousePosition.x - this.draggable.getBoundingClientRect().left, Positioning.mousePosition.y - this.draggable.getBoundingClientRect().top);
                    addEventListener("mousemove", this.mouseDrag);
                    Whiteboard.logChange();
                    this.draggingNode = true;
                }
            }
        }.bind(this);
        onmouseup = this.stopDragging;
        window.addEventListener("mouseup", this.stopDragging);
        this.draggable.addEventListener("mouseup", this.stopDragging);
    }

    mouseDrag(event) {
        event.stopPropagation();
        this.setDraggablePosition(Positioning.mousePosition.add(new Positioning.Vector2d(-Draggable.dragOffset.x, -Draggable.dragOffset.y)));
        this.onDrag();
    }

    setDraggablePosition(pose, restrictToWindow = true) {
        var x;
        var y;
        if (restrictToWindow) {
            x = Positioning.clamp(pose.x, 25, this.whiteboard.clientWidth - this.div.clientWidth - 25);
            y = Positioning.clamp(pose.y, 65, this.whiteboard.clientHeight - this.div.clientHeight - 50);
        } else {
            x = pose.x;
            y = pose.y;
        }
        this.position = new Positioning.Vector2d(x, y);
        this.draggable.style.left = Positioning.toHTMLPositionPX(x);
        this.draggable.style.top = Positioning.toHTMLPositionPX(y);
    }

    stopDragging() {
        removeEventListener("mousemove", this.mouseDrag);
        Draggable.dragOffset = new Positioning.Vector2d(0, 0);
        this.draggingNode = false;
    }
};

var Whiteboard = {
    PathPoint: class extends Draggable {    

        static fieldLengthIn = 141.167;
        static size = 24;
    
        parentDraggable;
        relativePosition;
        div;
    
        fieldVector; // That is, the position in field coordinates
        followRadius;
        targetFollowRotation; // In radians
        targetEndRotation; // In radians
        maxVelocity;
    
    
        constructor(parentDraggable, relativePosition = new Positioning.Vector2d(0, 0), configuration = {}) {
            let div = document.createElement("div");
            super(div);
            this.div = div;
            this.div.style.width = Positioning.toHTMLPositionPX(Whiteboard.PathPoint.size);
            this.div.style.height = Positioning.toHTMLPositionPX(Whiteboard.PathPoint.size);
            this.div.style.borderRadius = Positioning.toHTMLPositionPX(Whiteboard.PathPoint.size / 2);
            this.div.classList.add("path-point");
            this.whiteboard = document.getElementById("whiteboard");
            this.parentDraggable = parentDraggable;
            this.parentDraggable.draggable.appendChild(this.div);
            this.relativePosition = relativePosition;
            this.bindMethods();
            this.updateFieldVector();
            super.setDraggablePosition(this.relativePosition.add(this.parentDraggable.position));
            super.onDrag = (function() {
                this.relativePosition = this.position.add(new Positioning.Vector2d(-parentDraggable.position.x, -parentDraggable.position.y));
                this.updateFieldVector();
            }).bind(this);
    
            this.followRadius = getValue(configuration.followRadius, 8);
            this.targetFollowRotation = getValue(configuration.targetFollowRotation, null);
            this.targetEndRotation = getValue(configuration.targetFollowRotation, null);
            this.maxVelocity = getValue(configuration.maxVelocity, null);
    
        }
    
        bindMethods() {
            this.setFieldPosition = this.setFieldPosition.bind(this);
        }
    
        setFieldPosition(fieldVector) {
            this.fieldVector = fieldVector;
            let rect = this.parentDraggable.configuration.size;
            this.relativePosition = new Positioning.Vector2d(fieldVector.y / Whiteboard.PathPoint.fieldLengthIn * rect.x - Whiteboard.PathPoint.size / 2, fieldVector.x / Whiteboard.PathPoint.fieldLengthIn * rect.y - Whiteboard.PathPoint.size / 2);
            this.setDraggablePosition(this.relativePosition.add(this.parentDraggable.position));
        }
    
        updateFieldVector() {
            let rect = this.parentDraggable.configuration.size;
            this.fieldVector = new Positioning.Vector2d((this.relativePosition.y + Whiteboard.PathPoint.size / 2) / rect.y * Whiteboard.PathPoint.fieldLengthIn, (this.relativePosition.x + Whiteboard.PathPoint.size / 2)/ rect.x * Whiteboard.PathPoint.fieldLengthIn);
        }
    
        remove() {
            this.parentDraggable.draggable.removeChild(this.div);
        }
    },

    WhiteboardDraggable: class extends Draggable {

        static Types = {
            BUTTON: "button",
            TOGGLE: "toggle",
            SELECTOR: "selector",
            BOOLEAN_TELEMETRY: "boolean telemetry",
            TEXT_TELEMETRY: "text telemetry",
            TEXT_INPUT: "text input",
            CAMERA_STREAM: "camera stream",
            GRAPH: "position graph",
            LABEL: "label",
            PATH: "path",
        };

        arrayIndex;
        pathPoints = [];

        configuration = {
            name: undefined,
            position: new Positioning.Vector2d(50, 50),
            size: new Positioning.Vector2d(100, 100),
            highlightColor: "black",
            color: undefined,
            layer: undefined,
            type: Whiteboard.WhiteboardDraggable.Types.BUTTON,
            id: undefined,
            state: undefined,
            streamURL: undefined,
            streamSize: new Positioning.Vector2d(0, 0),
            selectableNames: undefined,
            fontSize: undefined,
            followTimeout: undefined,
            pathPoints: [],
            showLabel: true,
            distanceToPixels: 5,
            last_node_update: 0,
        };

        constructor(configuration) {
            let div = document.createElement("div");
            div.setAttribute("draggable", false);
            super(div);
            this.bindMethods();
            this.whiteboard = document.getElementById("whiteboard");

            // #region draggable div
            this.div = div;
            this.selectorContainer = document.createElement("div");
            this.selectorContainer.classList.add("draggable-selectable-container");
            this.div.appendChild(this.selectorContainer);
            this.textContainer = document.createElement("div");
            this.textContainer.classList.add("draggable-text-container");
            this.div.appendChild(this.textContainer);
            this.textField = document.createElement("textarea");
            this.textField.classList.add("draggable-text-field");
            this.textField.oninput = this.handleTyping;
            this.div.appendChild(this.textField);
            this.stream = document.createElement("img");
            this.stream.setAttribute("draggable", false);
            this.stream.classList.add("camera-stream");
            this.div.appendChild(this.stream);
            this.canvas = document.createElement("canvas");
            this.canvas.classList.add("canvas");
            this.context = this.canvas.getContext("2d");
            this.context.imageSmoothingEnabled = false;
            this.div.appendChild(this.canvas);
            this.fieldImg = document.createElement("img");
            this.fieldImg.setAttribute("draggable", false);
            this.fieldImg.classList.add("path");
            this.fieldImg.setAttribute("draggable", false);
            this.div.appendChild(this.fieldImg);
            this.container = document.createElement("div");
            this.container.style.overflow = "visible";
            this.label = document.createElement("input");
            this.borderDiv = document.createElement("div");
            this.borderDiv.classList.add("border-div");
            this.container.appendChild(this.borderDiv);
            if (!Whiteboard.editingMode) this.label.readOnly = true;
            this.div.className = Whiteboard.NODE_CLASSNAME;
            this.onDrag = (function() {
                this.configuration.position = this.position;
                this.updateChildPositions();
            }).bind(this);
            // #endregion 

            // #region declare class fields
            this.configuration.type = configuration.type; // initialize the type variable
            this.configuration.last_node_update = getValue(configuration.last_node_update, 0);

            this.updateIndex(Whiteboard.layoutNodeRegistry.length);
            this.configuration.name = configuration.name;
            this.configuration.position = configuration.position;
            this.configureBorder(getValue(configuration.borderColor, "transparent"), getValue(configuration.borderWidth, 0));
            this.setSize(configuration.size, false);
            this.setFontSize(configuration.fontSize);
            this.setColor(configuration.color);
            this.configuration.highlightColor = getValue(configuration.highlightColor, "black");
            this.configuration.streamURL = getValue(configuration.streamURL, "http://192.168.43.1:10000");
            this.setStreamSize(configuration.streamSize);
            this.selectableGroup = null;
            this.configuration.selectableNames = configuration.selectableNames;
            this.configuration.pathPoints = configuration.pathPoints;
            this.configuration.followTimeout = configuration.followTimeout;
            this.configuration.showLabel = getValue(configuration.showLabel, true);
            this.configuration.distanceToPixels = getValue(configuration.distanceToPixels, 5);
            this.displayLabel();


            this.configureType(configuration.type, true);
            this.setId(configuration.id); // Once the type is configured, set the id and the state
            this.setState(configuration.state);
            this.setLayer(configuration.layer, false); // After everything is displayed, set the layer

            // #endregion

            // #region dragging functionality
 
            this.div.onmouseover = (event) => {
                if (Whiteboard.editingMode) {
                    event.target.style.cursor = "move" 
                } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.BUTTON || this.configuration.type === Whiteboard.WhiteboardDraggable.Types.TOGGLE) {
                    event.target.style.cursor = "pointer"; 
                    if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.BUTTON) {
                        event.target.style.background = this.configuration.highlightColor;
                    }
                } else {
                    event.target.style.cursor = "auto";
                }
            }

            this.div.onmouseleave = (event) => { event.target.style.background = this.configuration.color }
            this.div.dispatchEvent(new Event("mouseleave")); //If this event isn't dispatched, the program might glitch and cause the element to think the mouse is over it
            // #endregion

            // #region set initial position
            this.container.appendChild(this.div);
            this.whiteboard.appendChild(this.container);
            this.label.setAttribute("type", "text");
            this.label.className = "whiteboard-label";
            this.label.classList.add(SettingsManager.Themes.selectedTheme.draggableLabel);
            this.label.placeholder = "Untitled";
            this.label.value = this.configuration.name;
            this.container.appendChild(this.label);
            Draggable.dragOffset = new Positioning.Vector2d(0, 0);
            this.setPosition(this.configuration.position);
            this.div.onclick = this.handleClick;
            // #endregion
        }

        bindMethods() {
            this.isType = this.isType.bind(this);
            this.setState = this.setState.bind(this);
            this.handleClick = this.handleClick.bind(this);
            this.setName = this.setName.bind(this);
            this.setPosition = this.setPosition.bind(this);
            this.updateChildPositions = this.updateChildPositions.bind(this);
            this.setSize = this.setSize.bind(this);
            this.setColor = this.setColor.bind(this);
            this.setLayer = this.setLayer.bind(this);
            this.configureType = this.configureType.bind(this);
            this.setId = this.setId.bind(this);
            this.setStreamURL = this.setStreamURL.bind(this);
            this.setStreamSize = this.setStreamSize.bind(this);
            this.setState = this.setState.bind(this);
            this.sendState = this.sendState.bind(this);
            this.handleClick = this.handleClick.bind(this);
            this.handleTyping = this.handleTyping.bind(this);
            this.generateSelectorHTML = this.generateSelectorHTML.bind(this);
            this.getShallowCopy = this.getShallowCopy.bind(this);
            this.transformCanvasCoordinates = this.transformCanvasCoordinates.bind(this);
            this.setFontSize = this.setFontSize.bind(this);
            this.addPathPoint = this.addPathPoint.bind(this);
            this.drawPathLines = this.drawPathLines.bind(this);
            this.getPathPointsSimpleObj = this.getPathPointsSimpleObj.bind(this);
            this.removePathPoint = this.removePathPoint.bind(this);
            this.removeAllPathPoints = this.removeAllPathPoints.bind(this);
            this.mirrorPath = this.mirrorPath.bind(this);
            this.displayLabel = this.displayLabel.bind(this);
            this.toggleLabel = this.toggleLabel.bind(this);
            this.setLastUpdate = this.setLastUpdate.bind(this);
            this.copy = this.copy.bind(this);
            this.drawGraph = this.drawGraph.bind(this);
            this.setBorderWidth = this.setBorderWidth.bind(this);
            this.setBorderColor = this.setBorderColor.bind(this);
            this.findId = this.findId.bind(this);
        }

        setBorderWidth(width) {
            this.configuration.borderWidth = Math.min(width, Math.floor(0.0005 * this.configuration.size.x * this.configuration.size.y));
            this.borderDiv.style.borderStyle = "solid";
            this.borderDiv.style.borderWidth = this.configuration.borderWidth + "px";
        }

        setBorderColor(color) {
            this.configuration.borderColor = color;
            this.borderDiv.style.borderColor = this.configuration.borderColor;
        }

        configureBorder(color, width) {
            this.setBorderColor(color);
            this.setBorderWidth(width);
            this.setSize(this.configuration.size);
        }

        setLastUpdate() {
            this.configuration.last_node_update = Date.now();
        }

        generateSelectorHTML(selectableNames) {
            if (selectableNames == undefined) return;
            this.configuration.selectableNames = selectableNames;
            this.selectorContainer.innerHTML = "";
            this.selectableGroup = new Select.SelectableGroup();
            for (let i = 0; i < selectableNames.length; i++) {
                this.selectableGroup.add(new Select.Selectable(selectableNames[i], (() => { this.configuration.state = selectableNames[i]; this.setLastUpdate(); this.sendState() }).bind(this), () => SettingsManager.Themes.selectedTheme.draggableUnselect, () => SettingsManager.Themes.selectedTheme.draggableSelect, true));
            }
            this.selectableGroup.generateHTML(this.selectorContainer);
        }

        setState(state) {
            try {
                this.configuration.state = state;
                if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.TOGGLE || this.configuration.type === Whiteboard.WhiteboardDraggable.Types.BOOLEAN_TELEMETRY) {
                    this.configuration.state = String(this.configuration.state);
                    if (this.configuration.state === "true") {
                        this.setColor("limegreen");
                    } else {
                        this.setColor("red");
                    }
                } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.TEXT_TELEMETRY) {
                    this.textContainer.innerHTML = state;
                } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.TEXT_INPUT) {
                    this.textField.value = state;
                } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.SELECTOR) {
                    if (this.selectableGroup.selectByName(state)) {
                        this.configuration.state = state;
                    }
                } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.GRAPH) {
                    if (state === "") {
                        state = "x: 0 y: 0.0 heading: 0.0";
                        this.configuration.state = state;
                    }
                    state = state.replace(/\s+/g, "")
                    let x = 0.00;
                    let y = 0.00;
                    let heading = 0.00;
                    try {
                        x = Positioning.round(parseFloat(state.match(/x:-?[0-9.]*/)[0].replace("x:", "")), 4);
                        y = Positioning.round(parseFloat(state.match(/y:-?[0-9.]*/)[0].replace("y:", "")), 4);
                        heading = parseFloat(state.match(/heading:-?[0-9.]*/)[0].replace("heading:", ""));
                    } catch {
                        Notify.createNotice("Failed to parse robot position data", Notify.NEGATIVE, 3000)
                    }
                    this.drawGraph(x, y, heading);
                }
            } catch (err) {
                console.warn(err);
                Notify.createNotice("Could not apply draggable state", Notify.NEGATIVE, 2000);
            }
        }

        drawPathLines() {
            this.context.clearRect(0, 0, (this.configuration.size.x), (this.configuration.size.y));
            if (this.pathPoints.length > 0) {
                this.pathPoints[0].div.style.backgroundColor = "limegreen";
            }
            this.pathPoints[this.pathPoints.length - 1].div.style.backgroundColor = "red";
            for (let i = 0; i < this.pathPoints.length - 1; i++) {
                let point1 = this.pathPoints[i]; 
                if (i != 0) {
                    point1.div.style.backgroundColor = "#f5770a";
                }
                let vector1 = point1.position.add(new Positioning.Vector2d(point1.div.getBoundingClientRect().width / 2, point1.div.getBoundingClientRect().height / 2));
                let point2 = this.pathPoints[i + 1];
                let vector2 = point2.position.add(new Positioning.Vector2d(point2.div.getBoundingClientRect().width / 2, point2.div.getBoundingClientRect().height / 2));
                this.drawLine(vector1.add(new Positioning.Vector2d(-this.position.x, -this.position.y)), vector2.add(new Positioning.Vector2d(-this.position.x, -this.position.y)), "#f5770a", 5);
            }
        }

        reversePathOrder() {
            let temp = [];
            for (let i = 0; i < this.pathPoints.length; i++) {
                temp.push(this.pathPoints[this.pathPoints.length - 1 - i]);
            }
            this.pathPoints = temp;
        }

        drawGraph(botX, botY, heading) {
            const x = 0;
            const y = 0;
            this.context.clearRect(0, 0, (this.configuration.size.x), (this.configuration.size.y));
            let spacing = 25;
            let lineColor = "#f0f0f5";
            for (let i = 0; i < Math.ceil((this.configuration.size.y) / spacing); i++) {
                this.drawLineTransformed(new Positioning.Vector2d(-(this.configuration.size.x) / 2, spacing * i), new Positioning.Vector2d((this.configuration.size.x) / 2, spacing * i), lineColor);
                this.drawLineTransformed(new Positioning.Vector2d(-(this.configuration.size.x) / 2, -spacing * (i + 1)), new Positioning.Vector2d((this.configuration.size.x) / 2, -spacing * (i + 1)), lineColor);
           }
            for (let i = 0; i < Math.ceil((this.configuration.size.x) / spacing); i++) {
                this.drawLineTransformed(new Positioning.Vector2d(spacing * i, -(this.configuration.size.y) / 2), new Positioning.Vector2d(spacing * i, (this.configuration.size.y) / 2), lineColor);
                this.drawLineTransformed(new Positioning.Vector2d(-spacing * (i + 1), -(this.configuration.size.y) / 2), new Positioning.Vector2d(-spacing * (i + 1), (this.configuration.size.y) / 2), lineColor);
            }
            this.context.fillStyle = "#000000";
            this.context.font = "15px Roboto";
            this.context.fillText("x: " + botX, 10, 20);
            this.context.fillText("y: " + botY, 10, 40);
            this.context.fillText("heading: " + Positioning.round((heading * 180 / Math.PI) % 360, 2) + "°", 10, 60);         
            let multiplier = this.configuration.distanceToPixels;
            this.drawRect(new Positioning.Pose2d(new Positioning.Vector2d(botX * multiplier, botY * multiplier), heading), 50, 50, "#3973ac");
            this.drawArrow(new Positioning.Pose2d(new Positioning.Vector2d(botX * multiplier, botY * multiplier), heading), 40, 40, "white");
        }

        transformCanvasCoordinates(pose) {
            let x = pose.x;
            let y = pose.y;
            x += (this.configuration.size.x ) / 2;
            y = (this.configuration.size.y) / 2 - y;
            return new Positioning.Vector2d(x, y); 
        }

        rotate(point1, point2, angle) {
            let x = (point1.x - point2.x) * Math.cos(angle) - (point1.y - point2.y) * Math.sin(angle) + point2.x;
            let y = (point1.x - point2.x) * Math.sin(angle) + (point1.y - point2.y) * Math.cos(angle) + point2.y;
            return new Positioning.Vector2d(x, y);
        }

        drawLine(point1, point2, color="#000000", lineWidth = 1) {
            let oldLineWidth = this.context.lineWidth;
            this.context.lineWidth = lineWidth;
            this.context.strokeStyle = color;
            this.context.beginPath();
            this.context.moveTo(point1.x, point1.y);
            this.context.lineTo(point2.x, point2.y);
            this.context.closePath();
            this.context.stroke();
            this.context.lineWidth = oldLineWidth;
        }

        drawLineTransformed(point1, point2, color="#000000", lineWidth = 1) {
            this.drawLine(this.transformCanvasCoordinates(point1), this.transformCanvasCoordinates(point2), color, lineWidth);
        }

        drawShape(vectors, color="#000000") {
            this.context.fillStyle = color;
            this.context.beginPath();
            this.context.moveTo(vectors[0].x, vectors[0].y);
            for (let i = 1; i < vectors.length; i++) {
                this.context.lineTo(vectors[i].x, vectors[i].y);
            }
            this.context.lineTo(vectors[0].x, vectors[0].y);
            this.context.closePath();
            this.context.fill();
        }


        drawArrow(pose, width, height, color="red") {
            let x = pose.vector.x;
            let y = pose.vector.y;

            let vectors = [
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x - width / 6, y - height / 2), pose.vector, pose.rotation)),
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x - width / 6, y + height / 5), pose.vector, pose.rotation)),
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x - width / 2, y + height / 5), pose.vector, pose.rotation)),
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x, y + height / 2), pose.vector, pose.rotation)),
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x + width / 2, y + height / 5), pose.vector, pose.rotation)),
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x + width / 6, y + height / 5), pose.vector, pose.rotation)),
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x + width / 6, y - height / 2), pose.vector, pose.rotation)),
            ];

            this.drawShape(vectors, color);
        }

        drawRect(pose, width, height, color="#000000") {
            let x = pose.vector.x;
            let y = pose.vector.y;

            let vectors = [
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x - width / 2, y - height / 2), pose.vector, pose.rotation)),
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x - width / 2, y + height / 2), pose.vector, pose.rotation)),
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x + width / 2, y + height / 2), pose.vector, pose.rotation)),
                this.transformCanvasCoordinates(this.rotate(new Positioning.Vector2d(x + width / 2, y - height / 2), pose.vector, pose.rotation)),
            ];

            this.drawShape(vectors, color);
        }

        sendState() {
            let message = {
                action: "update_node",
                node_id: this.configuration.id,
                node_type: this.configuration.type,
                node_state: this.configuration.state,
                last_node_update: this.configuration.last_node_update
            };
            Socket.sendData(JSON.stringify(message));
        }

        handleClick() {
            if (!Whiteboard.editingMode) {
                if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.TOGGLE) {
                    let state = "false";
                    if (this.configuration.state === "false") state = "true";
                    this.setLastUpdate();
                    this.setState(state);
                    this.sendState();
                }
                if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.BUTTON) {
                    let message = {
                        action: "click_button",
                        node_id: this.configuration.id,
                    };
                    Socket.sendData(JSON.stringify(message));
                }
            }
        }

        displayLabel() {
            if (this.configuration.showLabel) {
                this.label.style.display = "block";
            } else {
                this.label.style.display = "none";
            }
        }

        toggleLabel() {
            this.configuration.showLabel = !this.configuration.showLabel;
            this.displayLabel();
            this.setPosition(this.configuration.position);
        }

        setName(name) {
            this.configuration.name = name;
        }

        setPosition(pose) {
            if (pose == undefined || pose == null) {
                pose == new Positioning.Vector2d(0, 0);
            }
            super.setDraggablePosition(pose, false);
            this.configuration.position = this.position;
            const labelOffset = (this.div.offsetWidth - this.label.offsetWidth) / 2;
            this.label.style.left = Positioning.toHTMLPositionPX(this.position.x + labelOffset);
            this.label.style.top = Positioning.toHTMLPositionPX(this.position.y + this.div.offsetHeight + 10);
            const borderOffset = this.configuration.borderWidth;
            this.borderDiv.style.left = Positioning.toHTMLPositionPX(this.position.x - borderOffset);
            this.borderDiv.style.top = Positioning.toHTMLPositionPX(this.position.y - borderOffset);
        }

        updateChildPositions() {
            const labelOffset = (this.div.offsetWidth - this.label.offsetWidth) / 2;
            this.label.style.left = Positioning.toHTMLPositionPX(this.position.x + labelOffset);
            this.label.style.top = Positioning.toHTMLPositionPX(this.position.y + this.div.offsetHeight + 10);
            const borderOffset = this.configuration.borderWidth;
            this.borderDiv.style.left = Positioning.toHTMLPositionPX(this.position.x - borderOffset);
            this.borderDiv.style.top = Positioning.toHTMLPositionPX(this.position.y - borderOffset);
            if (this.isType(Whiteboard.WhiteboardDraggable.Types.PATH)) {
                for (let i = 0; i < this.pathPoints.length; i++) {
                    this.pathPoints[i].setDraggablePosition(this.position.add(this.pathPoints[i].relativePosition));
                }
            }
        }

        isType(type) {
            return this.configuration.type === type;
        }

        getPathPointsSimpleObj() {
            let array = [];
            for (let i = 0; i < this.pathPoints.length; i++) {
                array.push({
                    "relativePosition": this.pathPoints[i].relativePosition,
                    "configuration": {
                        "fieldVector": this.pathPoints[i].fieldVector,
                        "followRadius": this.pathPoints[i].followRadius,
                        "targetFollowRotation": this.pathPoints[i].targetFollowRotation,
                        "targetEndRotation": this.pathPoints[i].targetEndRotation,
                        "maxVelocity": this.pathPoints[i].maxVelocity,
                    },
                });
            }
            return array;
        }

        getSendablePath() {
            let array = [];
            for (let i = 0; i < this.pathPoints.length; i++) {
                array.push({
                    "fieldVector": this.pathPoints[i].fieldVector,
                    "followRadius": this.pathPoints[i].followRadius,
                    "targetFollowRotation": this.pathPoints[i].targetFollowRotation,
                    "targetEndRotation": this.pathPoints[i].targetEndRotation,
                });
            }
            return array;
        }

        getPathPointIndex(pathPointNode) {
            let i = 0;
            while (i < this.pathPoints.length) { // Since both are html objects, the triple equals operator will compare reference only
                if (pathPointNode === this.pathPoints[i].draggable) {
                    break;
                }
                i++;
            }
            return i;
        }

        getPathPointObject(pathPointNode) {
            return this.pathPoints[this.getPathPointIndex(pathPointNode)];
        }

        removePathPoint(pathPointNode) {
            Whiteboard.logChange();
            let index = this.getPathPointIndex(pathPointNode);
            try {
                let temp = [];
                for (let i = 0; i < this.pathPoints.length; i++) {
                    if (i == index) {
                        this.div.removeChild(pathPointNode);
                    } else {
                        temp.push(this.pathPoints[i]);
                    }
                }
                this.pathPoints = temp;
            } catch(error) {
                console.log(error);
            }
        }

        removeAllPathPoints() {
            for (let i = 0; i < this.pathPoints.length; i++) {
                this.div.removeChild(this.pathPoints[i].draggable);
            }
            this.pathPoints = [];
        }

        addPathPointAfter(pathPointNode) {
            Whiteboard.logChange();
            let index = this.getPathPointIndex(pathPointNode);
            let temp = [];
            for (let i = 0; i < this.pathPoints.length; i++) {
                temp.push(this.pathPoints[i])
                if (i == index) {
                    temp.push(new Whiteboard.PathPoint(this));
                }
            }
            this.pathPoints = temp;
        }

        addPathPointBefore(pathPointNode) {
            Whiteboard.logChange();
            let index = this.getPathPointIndex(pathPointNode);
            let temp = [];
            for (let i = 0; i < this.pathPoints.length; i++) {
                if (i == index) {
                    temp.push(new Whiteboard.PathPoint(this));
                }
                temp.push(this.pathPoints[i])
            }
            this.pathPoints = temp;
        }

        copy() {
            localStorage.setItem("copiedNode", JSON.stringify(this.configuration));
            Notify.createNotice("copied", Notify.POSITIVE, 3000);
        }

        setSize(size, restrictSize = true) {
            if (restrictSize) {
            this.configuration.size = new Positioning.Vector2d(Positioning.clamp(size.x, 50, this.whiteboard.clientWidth * 0.85), Positioning.clamp(size.y, 50, this.whiteboard.clientHeight * 0.85));
            } else {
                this.configuration.size = new Positioning.Vector2d(size.x, size.y);
            }
            this.div.style.width = Positioning.toHTMLPositionPX(this.configuration.size.x);
            this.div.style.height = Positioning.toHTMLPositionPX(this.configuration.size.y);
            this.label.style.width = Positioning.toHTMLPositionPX(Positioning.clamp(this.configuration.size.x * 0.75, 75, Number.POSITIVE_INFINITY));
            Draggable.dragOffset = new Positioning.Vector2d(0, 0); // Calling setPosition() will take into account the dragOffset variable.  This isn't desirable here, so it is set to (0, 0)
            this.setPosition(this.configuration.position); // If this method is not called, the position of the label relative to that of the div will be wrong
            let childWidth = this.configuration.size.x;
            let childHeight = this.configuration.size.y;
            this.borderDiv.style.width = Positioning.toHTMLPositionPX(childWidth);
            this.borderDiv.style.height = Positioning.toHTMLPositionPX(childHeight);
            this.borderDiv.style.borderRadius = Positioning.toHTMLPositionPX(7 + this.configuration.borderWidth);
            this.canvas.style.width = Positioning.toHTMLPositionPX(childWidth);
            this.canvas.style.height = Positioning.toHTMLPositionPX(childHeight);
            this.canvas.width = childWidth;
            this.canvas.height = childHeight;
            this.fieldImg.style.width = Positioning.toHTMLPositionPX(childWidth);
            this.fieldImg.style.height = Positioning.toHTMLPositionPX(childHeight);
            if (this.isType(Whiteboard.WhiteboardDraggable.Types.GRAPH)) {
                this.drawGraph(0, 0, 0);
            } else if (Whiteboard.WhiteboardDraggable.Types.PATH) {
                for (let i = 0; i < this.pathPoints.length; i++) {
                    this.pathPoints[i].setFieldPosition(this.pathPoints[i].fieldVector);
                }
            }   
        }

        setFontSize(size) {
            if (size == undefined) {
                size = 15;
            }
            this.configuration.fontSize = size;
            this.textContainer.style.fontSize = Positioning.toHTMLPositionPX(size);
            this.textField.style.fontSize = Positioning.toHTMLPositionPX(size);
        }

        setColor(color) {
            this.configuration.color = color;
            this.div.style.background = color;
        }

        setHighlightColor(highlightColor) {
            this.configuration.highlightColor = highlightColor;
        }

        setLayer(layer, arrangeOthers = true) {
            if (layer === this.configuration.layer) return;
            this.container.style.zIndex = 1000 + layer;
            if (this.configuration.layer != undefined && arrangeOthers) { // this.configuration.layer is equivalent to the prior draggable layer, and layer is equivalent to the new layer
                if (layer > this.configuration.layer) {
                    for (let i = layer; i > this.configuration.layer; i--) {
                        if (Whiteboard.layoutNodeRegistry[i] !== this) {
                            Whiteboard.layoutNodeRegistry[i].setLayer(i - 1, false);
                        }
                    }
                } else {
                    for (let i = layer; i < this.configuration.layer; i++) {
                        if (Whiteboard.layoutNodeRegistry[i] !== this) {
                            Whiteboard.layoutNodeRegistry[i].setLayer(i + 1, false);
                        }
                    }
                }
            }
            this.configuration.layer = layer;
        }

        handleTyping() {
            this.configuration.state = this.textField.value;
            this.setLastUpdate();
            this.sendState();
        }

        mirrorPath() {
            Whiteboard.logChange();
            for (let i = 0; i < this.pathPoints.length; i++) {
                let pathPoint = this.pathPoints[i];
                pathPoint.setFieldPosition(new Positioning.Vector2d(pathPoint.fieldVector.x, PathPoint.fieldLengthIn - pathPoint.fieldVector.y));
                pathPoint.targetFollowRotation = Math.PI - pathPoint.targetFollowRotation;
                pathPoint.targetEndRotation = Math.PI - pathPoint.targetEndRotation;
            }
        }

        sendPath() {
            let message = {
                action: "save_path",
                node_id: this.configuration.id,
                path: {
                    "points": this.getSendablePath(),
                    "timeout": this.configuration.followTimeout,
                }
            };
            Socket.sendData(JSON.stringify(message));
        }

        sendInput() {
            let message = {
                action: "save_value",
                node_id: this.configuration.id,
                value: this.configuration.state,
            };
            Socket.sendData(JSON.stringify(message));
        }

        configureType(type, newObject = false) {
            this.textContainer.style.display = "none";
            this.textField.style.display = "none";
            this.selectorContainer.innerHTML = "";
            this.selectorContainer.style.display = "none";
            this.stream.style.display = "none";
            this.stream.src = "";
            this.canvas.style.display = "none";
            this.fieldImg.style.display = "none";
            clearInterval(this.drawPathLines, 20);
            clearInterval(this.sendState, 1000);
            if (this.configuration.type != type && this.configuration.type != undefined) {
                this.configuration.state = "";
            }
            if (type == undefined || type == null) {
                type = "button";
            }
            this.configuration.type = type;
            if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.BUTTON) {

            } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.TOGGLE) {
                this.setColor("red");
            } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.SELECTOR) {
                this.selectorContainer.style.display = "grid";
                this.generateSelectorHTML(this.configuration.selectableNames);
            } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.TEXT_TELEMETRY) {
                this.textContainer.style.display = "block";
                this.textContainer.innerHTML = this.configuration.state;
            } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.TEXT_INPUT) {
                this.textField.style.display = "block";
                this.textField.innerHTML = this.configuration.state;
                setInterval(this.sendState, 1000);
            } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.BOOLEAN_TELEMETRY) {
                this.setColor("red");
            } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.CAMERA_STREAM) {
                this.stream.style.display = "block";
                this.setStreamURL(this.configuration.streamURL);
            } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.GRAPH) {
                this.setColor("gray");
                this.canvas.style.display = "block";
                this.canvas.style.backgroundColor = "white";
                this.drawGraph(0, 0, 0);
            } else if (this.configuration.type === Whiteboard.WhiteboardDraggable.Types.PATH) {
                this.fieldImg.style.display = "block";
                this.canvas.style.display = "block";
                this.canvas.style.backgroundColor = "transparent";
                this.fieldImg.setAttribute("src", "./game/centerstage.png");
                if (newObject && this.configuration.pathPoints != undefined) {
                    for (let i = 0; i < this.configuration.pathPoints.length; i++) {
                        this.pathPoints.push(new Whiteboard.PathPoint(this, Positioning.Vector2d.from(this.configuration.pathPoints[i].relativePosition), this.configuration.pathPoints[i].configuration));
                    }
                }
                setInterval(this.drawPathLines, 20);
            }
        }

        setStreamSize(size) {
            if (size == undefined) return;
            this.configuration.streamSize = size;
            this.stream.style.width = Positioning.toHTMLPositionPX(size.x);
            this.stream.style.height = Positioning.toHTMLPositionPX(size.y);
        }

        findId(counter = 0) {
            let id = `${Load.currentLayoutName}_${this.configuration.type.replace(" ", "_")}_${this.arrayIndex}_${counter}`; // To minimize collisions
            let layoutNames = Load.listLayoutNames();
            for (let i = 0; i < layoutNames.length; i++) {
                let layout = JSON.parse(localStorage.getItem(Load.LAYOUT_PREFIX + layoutNames[i]));
                for (let ii = 0; ii < layout.nodeData.length; ii++) {
                    if (layout.nodeData[ii].id === id) {
                        return this.findId(counter + 1);
                    }
                }
            }
            return id;
        }

        setId(id) {
            if (id == null || id == "undefined" || id == "") {
                id = this.findId();
            }
            this.div.id = id;
            this.configuration.id = id;
            if (Whiteboard.editingMode) this.div.title = `ID: ${this.configuration.id}`;
        }

        setStreamURL(url) {
            this.configuration.streamURL = url;
            this.stream.src = url;
        }

        addPathPoint() {
            Whiteboard.logChange();
            this.pathPoints.push(new Whiteboard.PathPoint(this));
        }

        updateIndex(index) {
            this.arrayIndex = index;
            this.div.setAttribute("index", index);
        }

        delete() {
            var temp = [];
            var updatedIndex = 0;
            for (let i = 0; i < Whiteboard.layoutNodeRegistry.length; i++) {
                if (i != this.arrayIndex) {
                    temp.push(Whiteboard.layoutNodeRegistry[i]);
                    Whiteboard.layoutNodeRegistry[i].updateIndex(updatedIndex); // Resets the index variable of the node so the node can find itself in the new layoutNodeRegistry array
                    updatedIndex++;
                }
            }
            Whiteboard.layoutNodeRegistry = temp;
            this.div.parentElement.remove();
        }

        getShallowCopy() {
            this.configuration.pathPoints = this.getPathPointsSimpleObj();
            return this.configuration;
        }
    },

    getNodeIndex: function (node) {
        return parseInt(node.getAttribute("index"));
    },

    addDefaultNode: function () {
        Whiteboard.logChange();
        let configuration = {
            "name": "",
            "position": new Positioning.Vector2d(100, 100),
            "size": new Positioning.Vector2d(100, 100),
            "color": "#0098cb",
            "layer": Whiteboard.layoutNodeRegistry.length,
            "type": "button",
            "id": null,
        };
        if (Whiteboard.editingMode) Whiteboard.layoutNodeRegistry.push(new Whiteboard.WhiteboardDraggable(configuration));
    },

    duplicate: function (draggable, keepPosition = false) {
        let myPosition = new Positioning.Vector2d(0, 0);
        if (keepPosition) {
            myPosition = draggable.configuration.position;
        }
        let name;
        try {
            name = this.getDraggableName(draggable);
        } catch {
            name = draggable.configuration.name;
        }
        let newConfiguration = structuredClone(draggable.configuration);
        newConfiguration.position = myPosition;
        newConfiguration.name = name;
        newConfiguration.id = "";
        newConfiguration.pathPoints = draggable.getPathPointsSimpleObj();
        newConfiguration.layer = Whiteboard.layoutNodeRegistry.length;
        Whiteboard.layoutNodeRegistry.push(new Whiteboard.WhiteboardDraggable(newConfiguration));
    },

    getDraggableAncestor: function (element, recursion) {
        if (recursion == undefined) recursion = 0;
        if (element == null || element.classList.contains(Whiteboard.NODE_CLASSNAME)) {
            return element;
        } else if (recursion < 10) {
            return Whiteboard.getDraggableAncestor(element.parentElement, recursion + 1);
        }
        return null;
    },

    // #region undo/redo
    logChange: function () {
        Socket.sendRustboard();
        let state = new Whiteboard.WhiteboardState();
        if (Whiteboard.States.stateIndex != Whiteboard.States.timeline.length) {
            Whiteboard.States.timeline = Whiteboard.States.timeline.slice(0, Whiteboard.States.stateIndex); // If the state index is not at the very end of the timeline, the user must have undone some tasks.  It doesn't make sense to keep those tasks as part of the timeline (they technically don't exist, because they have been undone), so they are deleted.
            Whiteboard.States.endState = null;
        }
        Whiteboard.States.timeline.push(state);
        Whiteboard.States.stateIndex += 1;
    },

    States: {
        timeline: [],
        stateIndex: 0,
        endState: null,
        clearTimeline: function () {
            Whiteboard.States.timeline = [];
            Whiteboard.States.stateIndex = 0;
            Whiteboard.States.endState = null;
        }
    },

    WhiteboardState: class {

        constructor() {
            this.state = Load.getLayoutJSONString();
        }

        restore() {
            Load.openJSON(this.state);
        }
    },

    getNodeById: function (id) {
        for (let i = 0; i < Whiteboard.layoutNodeRegistry.length; i++) {
            if (Whiteboard.layoutNodeRegistry[i].configuration.id === id) {
                return Whiteboard.layoutNodeRegistry[i];
            }
        }
        return null;
    },

    undoChange: function () {
        if (!Whiteboard.editingMode) {
            return;
        }
        if (Whiteboard.States.timeline.length == 0) return;
        if (Whiteboard.States.stateIndex == Whiteboard.States.timeline.length) {
            Whiteboard.States.endState = new Whiteboard.WhiteboardState();
        }
        if (Whiteboard.States.stateIndex > 0) {
            Whiteboard.States.stateIndex -= 1;
        }
        if (Whiteboard.States.timeline[Whiteboard.States.stateIndex].state == Load.getLayoutJSONString() && Whiteboard.States.stateIndex > 0) {
            Whiteboard.States.stateIndex -= 1;
        }
        Whiteboard.States.timeline[Whiteboard.States.stateIndex].restore();
        Load.findLinkedNodes();
        Socket.sendRustboard();
    },

    redoChange: function () {
        if (!Whiteboard.editingMode) {
            return;
        }
        if (Whiteboard.States.timeline.length > Whiteboard.States.stateIndex) {
            Whiteboard.States.stateIndex += 1;
        }
        try {
            if (Whiteboard.States.timeline[Whiteboard.States.stateIndex].state == Load.getLayoutJSONString() && Whiteboard.States.timeline.length > Whiteboard.States.stateIndex) {
                Whiteboard.States.stateIndex += 1;
            }
        } catch { }
        if (Whiteboard.States.stateIndex == Whiteboard.States.timeline.length) {
            if (Whiteboard.States.endState != null) Whiteboard.States.endState.restore();
        } else {
            Whiteboard.States.timeline[Whiteboard.States.stateIndex].restore();
        }
        Load.findLinkedNodes();
        Socket.sendRustboard();
    },

    clearTimeline: function() {
        Whiteboard.States.timeline = [];
    },
    // #endregion

    toggleEditingMode: function () {
        var editingToggle = document.getElementById(Whiteboard.EDITING_TOGGLE_ID);
        var labels = document.getElementsByClassName("whiteboard-label");
        var editModeOnlyBtns = document.getElementsByClassName("edit-mode-only");
        var border = document.getElementById("whiteboard-border");
        if (Whiteboard.editingMode) {
            border.style.display = "none";
            editingToggle.innerHTML = "enable editing";
            Array.from(labels).forEach((label) => label.readOnly = true);
            Array.from(editModeOnlyBtns).forEach((button) => button.style.display = "none");
            this.layoutNodeRegistry.forEach((node) => { node.div.title = "" });
        } else {
            border.style.display = "block";
            editingToggle.innerHTML = "disable editing";
            Array.from(labels).forEach((label) => label.readOnly = false);
            Array.from(editModeOnlyBtns).forEach((button) => button.style.display = "block");
            this.layoutNodeRegistry.forEach((node) => { node.div.title = `ID: ${node.configuration.id}` });
        }
        Whiteboard.editingMode = !Whiteboard.editingMode;
    },

    updateNodeState: function(nodeId, type, state) {
        const node = Whiteboard.getNodeById(nodeId);
        if (node != null && node.configuration.type === type) {
            node.setState(state);
        }
    },

    visibleNodeWithId: function(node) {
        for (let i = 0; i < Whiteboard.layoutNodeRegistry.length; i++) {
            if (Whiteboard.layoutNodeRegistry[i].configuration.id === node.configuration.id && Whiteboard.layoutNodeRegistry[i] !== node) {
                return true;
            }
        }
        return false;
    },

    unlinkedNodeWithId: function(id) {
        const layoutNames = Load.listLayoutNames();
        for (let i = 0; i < layoutNames.length; i++) {
            if (layoutNames[i] !== Load.currentLayoutName) {
                try {
                    let nodeData = JSON.parse(localStorage.get(Load.LAYOUT_PREFIX + layoutNames[i])).nodeData;
                    for (let ii = 0; ii < nodeData.length; ii++) {
                        if (nodeData[ii].id === id && nodeData[ii].type !== type) {
                            return true;
                        }
                    }
                } catch (e) {
                    console.warn(e);
                }
            }
        }        
        return false;
    },

    getSendableRustboardJson: function() {
        let nodes = new Map();
        let layoutNames = Load.listLayoutNames();
        for (let i = 0; i < layoutNames.length; i++) {
            if (layoutNames[i] !== Load.currentLayoutName) {
                let layoutObject = JSON.parse(localStorage.getItem(Load.LAYOUT_PREFIX + layoutNames[i]));
                for (let ii = 0; ii < layoutObject.nodeData.length; ii++) {
                    let nodeConfiguration = layoutObject.nodeData[ii];
                    nodes.set(
                        nodeConfiguration.id,
                        {
                            node_id: nodeConfiguration.id,
                            node_type: nodeConfiguration.type,
                            node_state: nodeConfiguration.state,
                            last_node_update: nodeConfiguration.last_node_update,
                        }
                    );
                }
            }
        }
        for (let i = 0; i < Whiteboard.layoutNodeRegistry.length; i++) {
            let nodeConfiguration = Whiteboard.layoutNodeRegistry[i].configuration;
            nodes.set(
                nodeConfiguration.id,
                {
                    node_id: nodeConfiguration.id,
                    node_type: nodeConfiguration.type,
                    node_state: nodeConfiguration.state,
                    last_node_update: nodeConfiguration.last_node_update,
                }
            );
        }
        return Array.from(nodes.values());
    },

    layoutNodeRegistry: [],
    currentNode: null,
    currentPathPoint: null,
    editingMode: false,
    EDITING_TOGGLE_ID: "editingToggle",
    NODE_CLASSNAME: "whiteboard-draggable",
    NODE_LABEL_CLASSNAME: "whiteboard-label",
    WHITEBOARD_BORDER_ID: "whiteboard-border"
};

window.Whiteboard = Whiteboard || {};