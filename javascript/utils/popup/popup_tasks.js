var PopupTasks = {
    changeID: function (event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        let id = popup.getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value;
        if (Whiteboard.visibleNodeWithId(Whiteboard.currentNode)) {
            Notify.createNotice("Nodes within the same layout cannot have the same id", Notify.NEGATIVE, 5000);
            return;
        } else if (Whiteboard.unlinkedNodeWithId(id)) {
            Notify.createNotice("Nodes that have equal ids and are in different layouts must have the same type", Notify.NEGATIVE, 5000);
            return;
        }
        Whiteboard.currentNode.setId(id);
        Load.findLinkedNodes();
        Popup.closePopup(popup);
    },

    changeColor: function (event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        let color = popup.getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value;
        Whiteboard.currentNode.setColor(color);
        Popup.closePopup(popup);
    },

    changeHighlightColor: function (event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        let color = popup.getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value;
        Whiteboard.currentNode.setHighlightColor(color);
        Popup.closePopup(popup);
    },

    setDraggableSize: function (event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        let size = popup.getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value;
        size = size.split(/[Xx]/);
        width = parseInt(size[0]);
        height = parseInt(size[1]);
        if (isNaN(width) || isNaN(height)) {
            Notify.createNotice("Invalid node size", Notify.NEGATIVE, 5000);
        } else {
            Whiteboard.currentNode.setSize(new Positioning.Vector2d(width, height));
            Popup.closePopup(popup);
        }
    },

    setPosition: function (event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        const x = parseInt(document.getElementById("x-pose-input").getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value);
        const y = parseInt(document.getElementById("y-pose-input").getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value);
        if (isNaN(x) || isNaN(y)) {
            Notify.createNotice("Invalid position", Notify.NEGATIVE, 5000);
        } else {
            Whiteboard.currentNode.setPosition(new Positioning.Vector2d(x, y));
            Popup.closePopup(popup);
        }
    },

    setType: function (type) {
        Whiteboard.logChange();
        Whiteboard.currentNode.configureType(type);
        Load.findLinkedNodes();
        Popup.closePopup(document.getElementById("type-setter"));
    },

    defineSelectables: function (event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        let input = document.getElementById("draggable-selectable-field").value;
        try {
            let names = input.split(",");
            for (let i = 0; i < names.length; i++) {
                names[i] = names[i].trim();
                names[i] = names[i].replace(/[\n\r\t]/, "");
            }
            Whiteboard.currentNode.generateSelectorHTML(names);
            Popup.closePopup(popup);
        } catch {
            Notify.createNotice("Invalid input", Notify.NEGATIVE, 5000);
        }
    },

    setStreamURL: function (event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        let url = popup.getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value;
        Whiteboard.currentNode.setStreamURL(url);
        Popup.closePopup(popup);
    },

    setStreamSize: function (event) {
        let popup = Popup.getPopupFromChild(event.target);
        let size = popup.getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value;
        size = size.split(/[Xx]/);
        width = parseInt(size[0]);
        height = parseInt(size[1]);
        if (isNaN(width) || isNaN(height)) {
            Notify.createNotice("Invalid stream size", Notify.NEGATIVE, 5000);
        } else {
            Whiteboard.logChange();
            Whiteboard.currentNode.setStreamSize(new Positioning.Vector2d(width, height));
            Popup.closePopup(popup);
        }
    },

    configureNodeBorder: function(event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
    },

    setFontSize: function(event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        let size = popup.getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value;
        if (isNaN(parseInt(size))) {
            Notify.createNotice("Invalid font size", Notify.NEGATIVE, 5000);
        } else {
            Whiteboard.currentNode.setFontSize(size);
            Popup.closePopup(popup);
        }
    },

    setWhiteboardBorderSize: function (event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        let size = popup.getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value;
        size = size.split(/[Xx]/);
        let border = document.getElementById(Whiteboard.WHITEBOARD_BORDER_ID);
        if (isNaN(parseFloat(size[0])) || isNaN(parseFloat(size[1]))) {
            Notify.createNotice("Invalid size", Notify.NEGATIVE, 5000);
        } else {
            border.style.width = Positioning.toHTMLPositionPX(size[0]);
            border.style.height = Positioning.toHTMLPositionPX(size[1]);
            Popup.closePopup(popup);
        }
    },

    renameLayout: function (event) {
        let toBeRenamed;
        if (Popup.selected == null) {
            toBeRenamed = Load.currentLayoutName;
        } else {
            toBeRenamed = Popup.selected.innerHTML;
        }
        let popup = Popup.getPopupFromChild(event.target);
        let name = popup.getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value;
        try {
            let layoutNames = Load.listLayoutNames();
            let duplicateName = false;
            for (let i = 0; i < layoutNames.length; i++) {
                if (layoutNames[i] === name) {
                    duplicateName = true;
                }
            }
            if (duplicateName) {
                Notify.createNotice("That layout name already exists!", Notify.NEGATIVE, 2500);
                return;
            } else {
                if (Load.currentLayoutName === toBeRenamed) {
                    Load.updateCurrentLayout(name);
                }
                data = localStorage.getItem("webdashboard-layout:" + toBeRenamed);
                localStorage.removeItem("webdashboard-layout:" + toBeRenamed);
                localStorage.setItem("webdashboard-layout:" + name, data);
                Load.displayLayouts();
            }

        } catch (err) {
            console.log(err);
            Notify.createNotice("Could not rename layout!  Try reloading the page.", Notify.NEGATIVE, 2500);
        }
        Popup.closePopup(popup);
    },

    populatePositionInfo: function() {
        Popup.getInput("x-pose-input").value = Whiteboard.currentNode.configuration.position.x;
        Popup.getInput("y-pose-input").value = Whiteboard.currentNode.configuration.position.y;
    },

    populatePathPointInfo: function() {
        let pathPoint = Whiteboard.currentPathPoint;
        Popup.getInput("path-point-x").value = pathPoint.fieldVector.x;
        Popup.getInput("path-point-y").value = pathPoint.fieldVector.y;
        Popup.getInput("path-point-radius").value = pathPoint.followRadius;
        if (pathPoint.targetFollowRotation == null) {
            Popup.getInput("target-follow-rotation").value = "NaN";
        } else { 
            Popup.getInput("target-follow-rotation").value = pathPoint.targetFollowRotation * 180 / Math.PI
        };
        if (pathPoint.targetEndRotation == null) {
            Popup.getInput("target-end-rotation").value = "NaN";
        } else { 
            Popup.getInput("target-end-rotation").value = pathPoint.targetEndRotation * 180 / Math.PI
        };
        Popup.getInput("max-velocity").value = pathPoint.maxVelocity;
    },

    populatePathTimeout() {
        if (Whiteboard.currentNode.configuration.followTimeout != undefined)  {
            document.getElementById("path-timeout-setter").getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value = Whiteboard.currentNode.configuration.followTimeout;
        }
    },

    populateNodeId: function() {
        Popup.getInput("draggable-id").value = Whiteboard.currentNode.configuration.id;
    },

    populateNodeSize: function() {
        Popup.getInput("node-size-input").value = `${Whiteboard.currentNode.configuration.size.x}x${Whiteboard.currentNode.configuration.size.y}`;
    },

    populateNodeColor: function() {
        Popup.getInput("node-color-input").value = Whiteboard.currentNode.configuration.color;
    },

    populateNodeHighlightColor: function() {
        Popup.getInput("node-highlight-color-input").value = Whiteboard.currentNode.configuration.highlightColor;
    },

    populateFontSize: function() {
        let popupInput = Popup.getInput("font-size-input");
        popupInput.value = Whiteboard.currentNode.configuration.fontSize;
    },

    populateNodeStreamUrl: function() {
        Popup.getInput("stream-url-input").value = Whiteboard.currentNode.configuration.streamURL;
    },

    populateStreamSize: function() {
        let size = Whiteboard.currentNode.configuration.streamSize;
        Popup.getInput("stream-size-input").value = `${size.x}x${size.y}`;
    },

    populateDistanceToPixels: function() {
        Popup.getInput("d-to-p-input").value = Whiteboard.currentNode.configuration.distanceToPixels;
    },

    populateSelectableNames: function() {
        let textField = document.getElementById("draggable-selectable-field");
        let group = Whiteboard.currentNode.selectableGroup;
        let nameStr = "";
        for (let i = 0; i < group.selectables.length; i++) {
            nameStr += group.selectables[i].name;
            if (i != group.selectables.length - 1) {
                nameStr += ", ";
            }
        }
        textField.value = nameStr;
    },

    populateNodeBorder: function() {
        Popup.getInput("draggable-border-color").value = Whiteboard.currentNode.configuration.borderColor;
        Popup.getInput("draggable-border-width").value = Whiteboard.currentNode.configuration.borderWidth;
    },

    populateWhiteboardBorderSize: function() {
        let popupInput = Popup.getInput("border-size-input");
        let border = document.getElementById("whiteboard-border");
        let width = border.clientWidth;
        let height = border.clientHeight;
        popupInput.value = `${width}x${height}`;
    },

    setPathTimeout() {
        let popup = Popup.getPopupFromChild(event.target);
        let timeout = popup.getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value;
        Whiteboard.currentNode.configuration.followTimeout = timeout;
        Popup.closePopup(popup);
    },

    setDistanceToPixels: function(event) {
        let popup = Popup.getPopupFromChild(event.target);
        let distanceToPixels = parseFloat(popup.getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value);
        if (isNaN(distanceToPixels)) {
            Notify.createNotice("Not a number", Notify.NEGATIVE, 5000);
        } else {
            Whiteboard.currentNode.configuration.distanceToPixels = distanceToPixels;
            Popup.closePopup(popup);
        }
    },

    configureBorder: function(event) {
        let popup = Popup.getPopupFromChild(event.target);
        let color = Popup.getInput("draggable-border-color").value;
        let width = parseFloat(Popup.getInput("draggable-border-width").value);
        if (isNaN(width)) {
            Notify.createNotice("Invalid border width", Notify.NEGATIVE, 5000);
        } else {
            Whiteboard.logChange();
            Whiteboard.currentNode.configureBorder(color, width);
            Popup.closePopup(popup);
        }
    },

    configurePathPoint: function(event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        let pathPoint = Whiteboard.currentPathPoint;
        let x = parseFloat(Popup.getInput("path-point-x").value);
        let y = parseFloat(Popup.getInput("path-point-y").value);
        let radius = parseFloat(Popup.getInput("path-point-radius").value);
        let targetFollowRotation = parseFloat(Popup.getInput("target-follow-rotation").value);
        if (isNaN(targetFollowRotation)) {
            targetFollowRotation = null;
        }
        let targetEndRotation = parseFloat(Popup.getInput("target-end-rotation").value);
        if (isNaN(targetEndRotation)) {
            targetEndRotation = null;
        }
        let maxVelocity = parseFloat(Popup.getInput("max-velocity").value);
        pathPoint.followRadius = radius;
        pathPoint.targetFollowRotation = targetFollowRotation / 180 * Math.PI;
        pathPoint.targetEndRotation = targetEndRotation / 180 * Math.PI;
        pathPoint.maxVelocity = maxVelocity;
        pathPoint.setFieldPosition(new Positioning.Vector2d(x, y));
        Popup.closePopup(popup);
    }

}

window.PopupTasks = PopupTasks || {};