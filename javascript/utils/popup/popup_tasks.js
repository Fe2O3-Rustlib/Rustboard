var PopupTasks = {
    changeID: function (event) {
        Whiteboard.logChange();
        let popup = Popup.getPopupFromChild(event.target);
        let id = popup.getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value;
        if (Whiteboard.visibleNodeWithId(id)) {
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
            Notify.createNotice("Illegal input!", Notify.NEGATIVE, 3000);
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

    setPathTimeout() {
        let popup = Popup.getPopupFromChild(event.target);
        let timeout = popup.getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value;
        Whiteboard.currentNode.configuration.followTimeout = timeout;
        Popup.closePopup(popup);
    },

    setDistanceToPixels: function() {
        let popup = Popup.getPopupFromChild(event.target);
        let distanceToPixels = parseFloat(popup.getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value);
        if (isNaN(distanceToPixels)) {
            Notify.createNotice("Not a number", Notify.NEGATIVE, 5000);
        } else {
            Whiteboard.currentNode.configuration.distanceToPixels = distanceToPixels;
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
        if (targetFollowRotation == undefined) {
            targetFollowRotation = null;
        }
        let targetEndRotation = parseFloat(Popup.getInput("target-end-rotation").value);
        if (targetEndRotation == undefined) {
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