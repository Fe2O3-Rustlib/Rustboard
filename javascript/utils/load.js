var Load = {
    DEFAULT_LAYOUT_NAME: "default",
    DEFAULT_LAYOUT_KEY: "webdashboard-layout:default",
    LAYOUT_PREFIX: "webdashboard-layout:",
    LAYOUT_PREFIX_REGEX: /webdashboard-layout:/,
    currentLayoutName: "default",
    linkedNodes: {},

    listLayoutNames: function () {
        let layoutNames = [];
        for (let i = 0; i < localStorage.length; i++) {
            if (Load.LAYOUT_PREFIX_REGEX.test(localStorage.key(i))) {
                let layoutName = localStorage.key(i).replace(Load.LAYOUT_PREFIX_REGEX, "");
                if (layoutName !== Load.DEFAULT_LAYOUT_NAME) {
                    layoutNames.push(layoutName);
                }
            }
        }
        layoutNames.sort();
        layoutNames.unshift(Load.DEFAULT_LAYOUT_NAME);
        return layoutNames;
    },

    removeLayout: function (key) {
        try {
            if (key !== Load.DEFAULT_LAYOUT_KEY) {
                localStorage.removeItem(key);
            }
        } catch {
            Notify.createNotice("Could not remove layout!  Try reloading the page.", Notify.NEGATIVE);
        }
    },

    safeDelete: function (event, key) {
        let popup = Popup.getPopupFromChild(event.target);
        Load.removeLayout(key);
        let buttons = Array.from(document.getElementById("open-layout").getElementsByClassName("layout-selectable"));
        buttons.forEach((button) => { if (button.innerHTML === key.replace(Load.LAYOUT_PREFIX_REGEX, "")) { button.remove() } });
        Popup.closePopup(popup);
    },

    removeAllLayouts: function (event) {
        let layoutNames = Load.listLayoutNames();
        for (let i = 0; i < layoutNames.length; i++) {
            Load.removeLayout(Load.LAYOUT_PREFIX + layoutNames[i]);
        }
        Load.openJSONLayout(Load.DEFAULT_LAYOUT_KEY);
        Load.clearLayout();
        Whiteboard.States.clearTimeline();
        Load.defaultSave(notify = false);
        Popup.closePopup(Popup.getPopupFromChild(event.target));
    },

    updateCurrentLayout: function (layoutName) {
        Load.currentLayoutName = layoutName;
        let layoutLabel = document.getElementById("layout-name");
        if (Load.currentLayoutName === Load.DEFAULT_LAYOUT_NAME) {
            layoutLabel.innerHTML = "default layout";
        } else {
            layoutLabel.innerHTML = `layout: ${Load.currentLayoutName}`;
        }
    },

    getDraggableName: function (draggable) {
        let name = draggable.label.value;
        draggable.setName(name);
        return name;
    },

    saveJSON: function (event) {
        let popup = Popup.getPopupFromChild(event.target);
        for (let i = 0; i < Whiteboard.layoutNodeRegistry.length; i++) {
            Load.getDraggableName(Whiteboard.layoutNodeRegistry[i]);
        }
        let name = popup.getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value;
        Load.updateCurrentLayout(name);
        localStorage.setItem(Load.LAYOUT_PREFIX + name, Load.getLayoutJSONString());
        Load.handleNotDefaultBtns(name);
        Popup.closePopup(popup);
    },

    defaultSave: function (notify = true) {
        for (let i = 0; i < Whiteboard.layoutNodeRegistry.length; i++) {
            Load.getDraggableName(Whiteboard.layoutNodeRegistry[i]);
        }
        localStorage.setItem(Load.LAYOUT_PREFIX + Load.currentLayoutName, Load.getLayoutJSONString());
        if (notify) Notify.createNotice("Layout saved", Notify.POSITIVE, 3000);
    },

    newLayout: function () {
        Load.defaultSave();
        let counter = 0;
        let layoutNames = Load.listLayoutNames();
        for (let i = 0; i < layoutNames.length; i++) {
            let match = layoutNames[i].match(/untitled[0-9]*/);
            if (match == null) match = [];
            if (match.length == 1) {
                layoutNumber = Number(match[0].replace(/untitled/, "")); // See https://stackoverflow.com/questions/32978852/is-javascript-new-keyword-optional-for-javascript-api-feature
                if (layoutNumber > counter) {
                    counter = layoutNumber;
                }
            }
        }
        let name = `webdashboard-layout:untitled${counter + 1}`;
        localStorage.setItem(name, "");
        Load.openJSONLayout(name);
    },

    displayLayouts: function () {
        let popup = document.getElementById("open-layout");
        let listContainer = document.getElementById("select-json-container");
        listContainer.innerHTML = "";
        let layoutNames = Load.listLayoutNames();
        Popup.populatePopupClickableList(document.getElementById("select-json-container"), Load.currentLayoutName, layoutNames, (name) => {
            return () => {
                Load.openJSONLayout(`webdashboard-layout:${name}`); Popup.closePopup(popup);
            }
        }, () => "layout-selectable default-selectable " + SettingsManager.Themes.selectedTheme.defaultSelectable);
    },

    getLayoutObject: function () {
        let data = {};
        let nodeData = [];
        Whiteboard.layoutNodeRegistry.forEach((draggable) => nodeData.push(draggable.getShallowCopy()));
        data.nodeData = nodeData;
        let border = document.getElementById("whiteboard-border");
        data.border = { "width": border.style.width, "height": border.style.height };
        data.name = Load.currentLayoutName;
        return data;
    },

    getLayoutJSONString: function () {
        return JSON.stringify(Load.getLayoutObject());
    },

    handleNotDefaultBtns: function (key) {
        let notDefaultBtns = Array.from(document.getElementsByClassName("not-default"));
        if (key.replace(Load.LAYOUT_PREFIX_REGEX, "") === "default") {
            notDefaultBtns.forEach((button) => button.style.display = "none");
        } else {
            notDefaultBtns.forEach((button) => button.style.display = "block");
        }
    },

    openJSONLayout: function (key) {
        if (Whiteboard.layoutNodeRegistry > 0) {
            Load.defaultSave(false);
        }
        Load.handleNotDefaultBtns(key);
        Load.updateCurrentLayout(key.replace(Load.LAYOUT_PREFIX_REGEX, ""));
        Load.clearLayout(logChange = false);
        try {
            let data = localStorage.getItem(key);
            Load.openJSON(data);
        } catch (err) {
            console.warn(err);
            Notify.createNotice("Could not open layout!", Notify.NEGATIVE, 5000);
        }
    },

    getStoredNodeById: function(layout, nodeId) {
        for (let i = 0; i < layout.nodeData.length; i++) {
            let node = layout.nodeData[i];
            if (node.id === nodeId) {
                return node;
            }
        }
        return null;
    },

    findLinkedNodes: function() {
        let linkedNodeData = {
            masterLayout: Load.currentLayoutName,
            linkedNodes: []
        }
        let layoutNames = Load.listLayoutNames();
        for (let i = 0; i < Whiteboard.layoutNodeRegistry.length; i++) {
            let node = Whiteboard.layoutNodeRegistry[i];
            let linkedNodeObject = {
                configuration: {
                    id: node.configuration.id,
                    type: node.configuration.type,
                },
                linkedLayouts: []
            };
            let foundLink = false;
            for (let ii = 0; ii < layoutNames.length; ii++) {
                if (layoutNames[ii] !== Load.currentLayoutName) {
                    try {
                        layoutObject = JSON.parse(localStorage.getItem(`webdashboard-layout:${layoutNames[ii]}`));
                        for (let iii = 0; iii < layoutObject.nodeData.length; iii++) {
                            let toCompare = layoutObject.nodeData[iii];
                            if (toCompare.id === node.configuration.id && toCompare.type === node.configuration.type) {
                                linkedNodeObject.linkedLayouts.push(layoutNames[ii]);
                                foundLink = true;
                            }
                        }
                    } catch (error) {
                        console.warn(error);
                    }        
                }
            }
            if (foundLink) {
                linkedNodeData.linkedNodes.push(linkedNodeObject);
            }
        }
        localStorage.setItem("linkedNodes", JSON.stringify(linkedNodeData));
    },

    updateLinkedNodes: function() {
        let linkedNodeJson = localStorage.getItem("linkedNodes");
        if (linkedNodeJson == undefined) {
            return;
        }
        let linkedNodeData = JSON.parse(linkedNodeJson);
        let masterLayout = JSON.parse(localStorage.getItem(`webdashboard-layout:${linkedNodeData.masterLayout}`));
        let layoutsToModify = {};
        for (let i = 0; i < linkedNodeData.linkedNodes.length; i++) {
            let linkedNode = linkedNodeData.linkedNodes[i];
            for (let ii = 0; ii < linkedNode.linkedLayouts.length; ii++) { // TODO: check ii not i
                let layoutToModify = linkedNode.linkedLayouts[ii];
                if (layoutsToModify[layoutToModify] == undefined) {
                    layoutsToModify[layoutToModify] = [linkedNode.configuration];
                } else {
                    layoutsToModify[layoutToModify].push(linkedNode.configuration);
                }
            }
        }
        let layoutNames = Object.keys(layoutsToModify);
        for (let i = 0; i < layoutNames.length; i++) {
            layout = JSON.parse(localStorage.getItem(`webdashboard-layout:${layoutNames[i]}`)); // TODO: check ii not i
            let nodesToUpdate = layoutsToModify[layoutNames[i]];
            for (let ii = 0; ii < nodesToUpdate.length; ii++) {
                let modifiedNodeConfiguration = nodesToUpdate[ii];
                let nodeToModify = Load.getStoredNodeById(layout, modifiedNodeConfiguration.id);
                let masterNode = Load.getStoredNodeById(masterLayout, modifiedNodeConfiguration.id);
                if (masterNode != null && nodeToModify != null && masterNode.type === nodeToModify.type) {
                    nodeToModify.state = masterNode.state;
                    nodeToModify.pathPoints = masterNode.pathPoints;
                    nodeToModify.last_node_update = masterNode.last_node_update;
                    if (layoutNames[i] === Load.currentLayoutName) {
                        Whiteboard.getNodeById(nodeToModify.id).setState(masterNode.state);
                        Whiteboard.getNodeById(nodeToModify.id).configuration.pathPoints = masterNode.pathPoints;
                    }
                }
            }
            localStorage.setItem(`webdashboard-layout:${layoutNames[i]}`, JSON.stringify(layout));
        }
    },

    openJSON: function (json) {
        Load.clearLayout(logChange = false);
        if (json === "") return;
        json = JSON.parse(json);

        let border = document.getElementById("whiteboard-border");

        if (json.border.width != null) border.style.width = json.border.width;
        if (json.border.height != null) border.style.height = json.border.height;

        for (let i = 0; i < json.nodeData.length; i++) {
            let configuration = json.nodeData[i];
            Whiteboard.layoutNodeRegistry.push(new Whiteboard.WhiteboardDraggable(configuration));
        }
        Load.updateLinkedNodes();
        Load.findLinkedNodes();
        Socket.sendRustboard();
    },

    exportJSON: function (key) {
        let data;
        if (key === Load.DEFAULT_LAYOUT_KEY) {
            data = Load.getLayoutJSONString();
        } else {
            data = localStorage.getItem(key);
        }
        try {
            navigator.clipboard.writeText(data);
            Notify.createNotice("Copied layout JSON to clipboard", Notify.POSITIVE, 3000);
        } catch {
            Notify.createNotice("Could not export layout JSON", Notify.NEGATIVE, 3000);
        }
    },

    pasteNode: function() {
        let copiedNode = localStorage.getItem("copiedNode");
        if (copiedNode == undefined) {
            Notify.createNotice("Nothing to copy ¯\_(ツ)_/¯", Notify.NEGATIVE, 5000);
        } else {
            Whiteboard.logChange();
            nodeConfiguration = JSON.parse(copiedNode);
            nodeConfiguration.id = null;
            nodeConfiguration.position.x += 150;
            nodeConfiguration.position.y += 150;
            nodeConfiguration.layer = Whiteboard.layoutNodeRegistry.length;
            Whiteboard.layoutNodeRegistry.push(new Whiteboard.WhiteboardDraggable(nodeConfiguration));
        }
    },

    importJSON: function (event) {
        Load.defaultSave(false);
        let popup = Popup.getPopupFromChild(event.target);
        let name = document.getElementById("import-layout-name").getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value;
        if (name === "") {
            Notify.createNotice("Illegal layout name", Notify.NEGATIVE, 3000);
            return;
        }
        let json = document.getElementById("import-layout-json").getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value;
        localStorage.setItem(`webdashboard-layout:${name}`, json);
        try {
            Load.openJSON(json);
            Load.updateCurrentLayout(name);
        } catch {
            Notify.createNotice("Could not open layout - Invalid JSON", Notify.NEGATIVE, 3000);
        }
        Popup.closePopup(popup);
    },


    setAsDefault: function (key) {
        try {
            let data = localStorage.getItem(key);
            localStorage.setItem(Load.DEFAULT_LAYOUT_KEY, data);
            Whiteboard.logChange();
            if (Load.currentLayoutName == "default") {
                Load.openJSONLayout(Load.DEFAULT_LAYOUT_KEY);
            }
            Notify.createNotice("Set the current layout as default", Notify.POSITIVE, 3000);
        } catch (err) {
            console.warn(err);
            Notify.createNotice("Could not set as default!", Notify.NEGATIVE, 3000);
        }
    },

    clearLayout: function (logChange = true) {
        if (logChange) Whiteboard.logChange();
        iterations = Whiteboard.layoutNodeRegistry.length; //must be set here, because calling delete() continually updates Draggable.layoutNodeRegistry.length
        for (let i = 0; i < iterations; i++) {
            Whiteboard.layoutNodeRegistry[0].delete(); //Every time delete() is called, a new draggable will fall into the 0 slot in the array
        }
        let border = document.getElementById("whiteboard-border");
        border.style.removeProperty("width");
        border.style.removeProperty("height");
    },

    layoutChanged: function () {
        return Load.getLayoutJSONString() !== localStorage.getItem(`webdashboard-layout:${Load.currentLayoutName}`);
    },

    targetLayout: "",
};

window.Load = Load || {};