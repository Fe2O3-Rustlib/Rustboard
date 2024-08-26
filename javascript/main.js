var isFullScreen = false;
var selectNodeTypeGroup;

function inFullScreen() {
    const windowWidth = window.innerWidth * window.devicePixelRatio;
    const windowHeight = window.innerHeight * window.devicePixelRatio;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    return windowWidth / screenWidth >= 0.95 && windowHeight / screenHeight >= 0.95 && windowWidth / screenWidth <= 1.0 && windowHeight / screenHeight <= 1.0;
}

function initialize() { // This is called when the body portion of the html document loads
    SettingsManager.loadSettings();
    if (!localStorage.getItem(Load.DEFAULT_LAYOUT_KEY)) {
        Load.defaultSave();
        console.warn("It looks like this is your first time using the dashboard in this browser.  Welcome!");
        setTimeout(() => Notify.createNotice("Welcome!", Notify.POSITIVE, 5000), 3000);
    }

    Socket.initializeSocket();

    let banner = document.getElementById("banner-container");
    setTimeout(() => { banner.style.top = "-200%"; setTimeout(() => banner.style.display = "none", 2000) }, 500);
    addEventListeners();

    Popup.generateSimpleInputPopup("Load-layout-as", Load.saveJSON, new Popup.PopupInput("Enter the new layout name", "Save as"));
    Popup.generateSimpleInputPopup("layout-renamer", PopupTasks.renameLayout, new Popup.PopupInput("Enter the new layout name", "rename layout"));
    Popup.generateSimpleInputPopup("whiteboard-size-setter", PopupTasks.setWhiteboardBorderSize, new Popup.PopupInput("750x500", "border size"));
    Popup.generateSimpleInputPopup("size-picker", PopupTasks.setDraggableSize, new Popup.PopupInput("100x100", "draggable size"));
    Popup.generateSimpleInputPopup("color-picker", PopupTasks.changeColor, new Popup.PopupInput("#ffffff", "draggable color"));
    Popup.generateSimpleInputPopup("id-changer", PopupTasks.changeID, new Popup.PopupInput("Enter draggable id", "draggable id", "draggable-id"));
    Popup.generateSimpleInputPopup("stream-url-setter", PopupTasks.setStreamURL, new Popup.PopupInput("http://roborio-TEAM-frc.local:1181/?action=stream", "set stream url", "stream-url-input"));
    Popup.generateSimpleInputPopup("stream-size-setter", PopupTasks.setStreamSize, new Popup.PopupInput("width x height", "stream size"));
    Popup.generateSimpleInputPopup("text-telemetry-font-size-setter", PopupTasks.setFontSize, new Popup.PopupInput("15", "font size"));
    Popup.generateSimpleInputPopup("path-timeout-setter", PopupTasks.setPathTimeout, new Popup.PopupInput("10000", "path timeout (milliseconds)"));
    Popup.generateSimpleInputPopup("distance-to-pixels-setter", PopupTasks.setDistanceToPixels, new Popup.PopupInput(5, "distance to pixels constant"));
    Popup.setOnOpen("path-timeout-setter", PopupTasks.populatePathTimeout);

    Popup.setOnOpen("stream-url-setter", () => Popup.getInput("stream-url-input").value = Whiteboard.currentNode.configuration.streamURL);

    let draggableTypes = [];
    Object.keys(Whiteboard.WhiteboardDraggable.Types).forEach((key) => draggableTypes.push(Whiteboard.WhiteboardDraggable.Types[key]));

    selectNodeTypeGroup = Popup.populatePopupClickableList(document.getElementById("select-type-container"), null, draggableTypes, (iterable) => { return () => PopupTasks.setType(iterable) });

    Popup.populateVerticalInputs(document.getElementById("websocket-info-wrapper"), new Popup.PopupInput("21865", "team number", "team-number"), new Popup.PopupInput("ws://192.168.43.1:5837", "websocket url", "websocket-url"));
    let themeWrapper = document.getElementById("theme-wrapper");

    let themes = new Map([
        ["MR_BLUE", "Mr. Blue"],
        ["CHARCOAL", "Charcoal"],
        ["LIGHT", "Snow"],
        ["SLAY", "Slay"],
    ]);

    let group = new Select.SelectableGroup();
    themes.forEach((value, key) => group.add(new Select.Selectable(value, () => SettingsManager.Themes.selectedThemeName = key, null, null, true)));
    group.generateHTML(themeWrapper);
    group.selectByName(themes.get(SettingsManager.Themes.selectedThemeName));

    Popup.populateVerticalInputs(document.getElementById("draggable-position-inputs"), new Popup.PopupInput("0", "x position", "x-pose-input"), new Popup.PopupInput("0", "y position", "y-pose-input"));
    Popup.populateVerticalInputs(document.getElementById("import-json-info"), new Popup.PopupInput("import", "layout name", "import-layout-name"), new Popup.PopupInput("", "layout JSON", "import-layout-json"));
    Popup.populateVerticalInputs(document.getElementById("point-configure-inputs"),
        new Popup.PopupInput("", "x (in)", "path-point-x"),
        new Popup.PopupInput("", "y (in)", "path-point-y"),
        new Popup.PopupInput("", "follow radius (in)", "path-point-radius"),
        new Popup.PopupInput("", "target follow rotation (degrees)", "target-follow-rotation"),
        new Popup.PopupInput("", "target end rotation (degrees)", "target-end-rotation"),
        new Popup.PopupInput("", "max velocity (%)", "max-velocity"),
    );

    Popup.initializePopups();

    SettingsManager.setTheme();
    Load.openJSONLayout("webdashboard-layout:default");
}

function addEventListeners() {
    addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey)) { // the meta key is for MacOS
            if (event.key == "s") {
                event.preventDefault();
                if (event.shiftKey) {
                    Popup.openPopup("Load-layout-as");
                } else {
                    Load.defaultSave();
                }
            } else if (event.key === "z") {
                if (Popup.openPopups == 0) {
                    Whiteboard.undoChange();
                }
            } else if (event.key === "y") {
                if (Popup.openPopups == 0) {
                    Whiteboard.redoChange();
                }
            } else if (event.key === "v" && Whiteboard.editingMode && document.activeElement.nodeName !== "TEXTAREA" && document.activeElement.nodeName !== "INPUT") {
                event.preventDefault();
                Load.pasteNode();
            } else if (event.key === "e") {
                event.preventDefault();
                if (!inFullScreen()) {
                    Whiteboard.toggleEditingMode();
                }
            } else if (event.key === "q" && Whiteboard.editingMode) {
                event.preventDefault();
                Whiteboard.addDefaultNode();
            } else if (event.key === "o") {
                event.preventDefault();
                Popup.openPopup("open-layout");
                Load.displayLayouts();
            }
        }
    });
    addEventListener("mousemove", (event) => { Positioning.mousePosition = new Positioning.Vector2d(event.clientX, event.clientY) });
    oncontextmenu = (event) => generateContextMenu(event), false;
    onmousedown = (event) => removeMenu(event);
    onbeforeunload = () => { 
        if (Load.layoutChanged()) return "Are you sure you want to leave the page?"
    };

    CustomEventChecker.addEventChecker(new CustomEventChecker.EventChecker("enterfullscreen", inFullScreen, window));
    CustomEventChecker.addEventChecker(new CustomEventChecker.EventChecker("exitfullscreen", () => { return !inFullScreen() }, window));

    addEventListener("enterfullscreen", enterFullScreen);
    addEventListener("exitfullscreen", exitFullScreen);
}

function getBorderWidth(element) {
    return element.offsetWidth - element.clientWidth;
}

function removeMenu(event) {
    try {
        if (event == null || !event.target.classList.contains("menu-button")) {
            document.getElementById("menu-container").remove();
        }
    } catch {

    }
}

function generateContextMenuButton(parent, name, onclick) {
    let anchor = document.createElement("a");
    anchor.innerHTML = name;
    anchor.onclick = function () {
        try {
            onclick();
        } finally {
            removeMenu();
        }
    };
    anchor.classList.add("menu-button", SettingsManager.Themes.selectedTheme.menuBtn);
    parent.appendChild(anchor);
}

function generateContextMenu(event) {
    removeMenu();
    event.preventDefault();
    let whiteboard = document.getElementById("whiteboard");
    let container = document.createElement("div");
    container.id = "menu-container";

    let draggableElement = Whiteboard.getDraggableAncestor(event.target);
    if (draggableElement) {
        let node = Whiteboard.layoutNodeRegistry[Whiteboard.getNodeIndex(draggableElement)]
        Whiteboard.currentNode = node;

        if (event.target.classList.contains("path-point")) {
            Whiteboard.currentPathPoint = node.getPathPointObject(event.target);
            generateContextMenuButton(container, "remove", () => node.removePathPoint(event.target));
            generateContextMenuButton(container, "add after", (() => node.addPathPointAfter(event.target)));
            generateContextMenuButton(container, "add before", () => node.addPathPointBefore(event.target));
            generateContextMenuButton(container, "configure", () => Popup.openPopup("path-point-configuration"));
        } else {
            if (node.isType(Whiteboard.WhiteboardDraggable.Types.TEXT_TELEMETRY)) {
                generateContextMenuButton(container, "copy data", () => {navigator.clipboard.writeText(node.configuration.state); Notify.createNotice("copied", Notify.POSITIVE, 3000)});
            }
            if (Whiteboard.editingMode) {
                generateContextMenuButton(container, "remove", () => { if (Whiteboard.editingMode) { Whiteboard.logChange(); node.delete() } });
                generateContextMenuButton(container, "copy node", () => node.copy());
                if (node.configuration.showLabel) {
                    generateContextMenuButton(container, "hide label", () => { if (Whiteboard.editingMode) { Whiteboard.logChange(); node.toggleLabel() } });
                } else {
                    generateContextMenuButton(container, "show label", () => { if (Whiteboard.editingMode) { Whiteboard.logChange(); node.toggleLabel() } });
                }
                generateContextMenuButton(container, "send to front", () => { Whiteboard.logChange(); node.setLayer(Whiteboard.layoutNodeRegistry.length - 1) });
                generateContextMenuButton(container, "send to back", () => { Whiteboard.logChange(); node.setLayer(0) });
                generateContextMenuButton(container, "set id", () => {Popup.openPopup("id-changer"); Popup.getInput("draggable-id").value = node.configuration.id});
                if (node.isType(Whiteboard.WhiteboardDraggable.Types.GRAPH)) {
                    generateContextMenuButton(container, "configure units", () => Popup.openPopup("distance-to-pixels-setter"));
                }
                if (!node.isType(Whiteboard.WhiteboardDraggable.Types.TOGGLE) && !node.isType(Whiteboard.WhiteboardDraggable.Types.BOOLEAN_TELEMETRY)) {
                    generateContextMenuButton(container, "set color", () => Popup.openPopup("color-picker"));
                }
                if (node.isType(Whiteboard.WhiteboardDraggable.Types.TEXT_TELEMETRY) || node.isType(Whiteboard.WhiteboardDraggable.Types.TEXT_INPUT)) {
                    generateContextMenuButton(container, "set font size", () => Popup.openPopup("text-telemetry-font-size-setter"));
                }
                generateContextMenuButton(container, "configure border", () => Popup.openPopup("border-configuration-setter"));
                generateContextMenuButton(container, "set size", () => Popup.openPopup("size-picker"));
                generateContextMenuButton(container, "set position", () => {Popup.openPopup("position-setter"); PopupTasks.populatePositionInfo()});
                if (node.isType(Whiteboard.WhiteboardDraggable.Types.TEXT_INPUT) || node.isType(Whiteboard.WhiteboardDraggable.Types.TOGGLE)) {
                    generateContextMenuButton(container, "save to robot", () => node.sendInput());
                }
                if (node.isType(Whiteboard.WhiteboardDraggable.Types.SELECTOR)) {
                    generateContextMenuButton(container, "define selectables", () => Popup.openPopup("draggable-selector-creator"));
                }
                if (node.isType(Whiteboard.WhiteboardDraggable.Types.CAMERA_STREAM)) {
                    generateContextMenuButton(container, "set stream url", () => Popup.openPopup("stream-url-setter"));
                    generateContextMenuButton(container, "set stream size", () => Popup.openPopup("stream-size-setter"));
                }
                if (node.isType(Whiteboard.WhiteboardDraggable.Types.PATH)) {
                    generateContextMenuButton(container, "clear path", () => node.removeAllPathPoints());
                    generateContextMenuButton(container, "add path point", () => node.addPathPoint());
                    generateContextMenuButton(container, "set path timeout", () => Popup.openPopup("path-timeout-setter"));
                    generateContextMenuButton(container, "mirror path", () => node.mirrorPath());
                    generateContextMenuButton(container, "reverse", () => node.reversePathOrder());
                    generateContextMenuButton(container, "save to robot", () => node.sendPath());
                }
                generateContextMenuButton(container, "set type", () => { selectNodeTypeGroup.selectByName(node.configuration.type); Popup.openPopup("type-setter") });
                generateContextMenuButton(container, "duplicate", () => Whiteboard.duplicate(Whiteboard.layoutNodeRegistry[Whiteboard.getNodeIndex(Whiteboard.currentNode.div)]));
            }
        }
    } else if (event.target.id === "whiteboard-border") {
        if (localStorage.getItem("copiedNode") != undefined) {
            generateContextMenuButton(container, "paste node", () => Load.pasteNode());
        }
        generateContextMenuButton(container, "set whiteboard size", () => { Popup.openPopup("whiteboard-size-setter") });
    } else if (event.target.classList.contains("selectable")) {
        if (event.target.classList.contains("layout-selectable")) {
            Popup.selected = event.target;
            if (event.target.innerHTML !== "default") {
                generateContextMenuButton(container, "delete", () => { Load.targetLayout = event.target.innerHTML; Popup.openPopup("remove-layout") });
                generateContextMenuButton(container, "rename", () => { Popup.openPopup("layout-renamer") });
                generateContextMenuButton(container, "set as default", () => { Load.setAsDefault(`webdashboard:${event.target.innerHTML}`) });
            }
            generateContextMenuButton(container, "export json", () => { Load.exportJSON(`webdashboard:${event.target.innerHTML}`) });
        }
    } 
    document.body.appendChild(container);
    let x = Positioning.toHTMLPositionPX(Positioning.clamp(Positioning.mousePosition.x, 25, whiteboard.clientWidth - container.clientWidth - 25));
    let y = Positioning.toHTMLPositionPX(Positioning.clamp(Positioning.mousePosition.y, 65, whiteboard.clientHeight - container.clientHeight - 25));
    container.style = `left: ${x}; top: ${y}`;
}

function toggleFullScreen() {
    if (isFullScreen) {
        document.exitFullscreen();
        exitFullScreen();
    } else {
        document.documentElement.requestFullscreen();
        enterFullScreen();
    }
}

function enterFullScreen() {
    if (Whiteboard.editingMode) Whiteboard.toggleEditingMode();
    isFullScreen = true;
    document.getElementById("menu").style.display = "none";
    Notify.createNotice("Press f11 to exit full screen", Notify.NEUTRAL, 4000);
}

function exitFullScreen() {
    isFullScreen = false;
    document.getElementById("menu").style.display = "block";
}