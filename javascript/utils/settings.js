window.getModifier = function (baseClass, key) {
    return baseClass + key;
};

var WhiteboardSettings = {
    dashboardID: "dashboard_0",
    teamNumber: 21865,
    websocketURL: "ws://192.168.43.1:5837",
    defaultDraggable: null,

    Themes: {

        BASE: {
            defaultText: "default-text",
            menu: "menu",
            menuTransition: "transition",
            whiteboard: "whiteboard",
            menuBtn: "menu-button",
            layoutName: "layout-name-container",
            layoutNameTxt: "layout-name",
            popup: "popup",
            inputLabel: "input-label",
            popupInput: "popup-input",
            applyBtn: "apply",
            prompt: "prompt",
            draggableField: "draggable-selectable-field",
            defaultSelectable: "default-selectable",
            defaultSelectableSelected: "default-selectable-selected",
            draggableUnselect: "draggable-unselect",
            draggableSelect: "draggable-select",
            attributes: {
                closeSrc: "./images/close",
                closeImgType: ".svg",
                nodeHover: "black",
                draggableLabelColor: "white",
            }
        },

        MR_BLUE: {
            key: "-blue",
            defaultText: "default-text-blue",
            menu: "menu-blue",
            menuTransition: "transition-blue",
            whiteboard: "whiteboard-blue",
            menuBtn: "menu-button-blue",
            layoutName: "layout-name-container-blue",
            layoutNameTxt: "layout-name-blue",
            popup: "popup-blue",
            inputLabel: "input-label-blue",
            popupInput: "popup-input-blue",
            applyBtn: "apply-blue",
            prompt: "prompt-blue",
            draggableField: "draggable-selectable-field-blue",
            defaultSelectable: "default-selectable-blue",
            defaultSelectableSelected: "default-selectable-selected-blue",
            draggableUnselect: "draggable-unselect-blue",
            draggableSelect: "draggable-select-blue",
            attributes: {
                closeSrc: "./images/close-blue.svg",
                nodeHover: "black",
                draggableLabelColor: "white",
            }
        },
        CHARCOAL: {
            key: "-dark",
            defaultText: "default-text-dark",
            menu: "menu-dark",
            menuTransition: "transition-dark",
            whiteboard: "whiteboard-dark",
            menuBtn: "menu-button-dark",
            layoutName: "layout-name-container-dark",
            layoutNameTxt: "layout-name-dark",
            popup: "popup-dark",
            inputLabel: "input-label-dark",
            popupInput: "popup-input-dark",
            applyBtn: "apply-dark",
            prompt: "prompt-dark",
            draggableField: "draggable-selectable-field-dark",
            defaultSelectable: "default-selectable-dark",
            defaultSelectableSelected: "default-selectable-selected-dark",
            draggableUnselect: "draggable-unselect-dark",
            draggableSelect: "draggable-select-dark",
            attributes: {
                closeSrc: "./images/close-dark.svg",
                nodeHover: "black",
                draggableLabelColor: "#e1e8e3",
            }
        },
        LIGHT: {
            key: "-light",
            defaultText: "default-text-light",
            menu: "menu-light",
            menuTransition: "transition-light",
            whiteboard: "whiteboard-light",
            menuBtn: "menu-button-light",
            layoutName: "layout-name-container-light",
            layoutNameTxt: "layout-name-light",
            popup: "popup-light",
            inputLabel: "input-label-light",
            popupInput: "popup-input-light",
            applyBtn: "apply-light",
            prompt: "prompt-light",
            draggableField: "draggable-selectable-field-light",
            defaultSelectable: "default-selectable-light",
            defaultSelectableSelected: "default-selectable-selected-light",
            draggableUnselect: "draggable-unselect-light",
            draggableSelect: "draggable-select-light",
            attributes: {
                closeSrc: "./images/close-light.svg",
                nodeHover: "black",
                draggableLabelColor: "white",
            }
        },

        selectedTheme: null,
    },

    saveSettings: function (event) {
        let popup = Popup.getPopupFromChild(event.target);
        WhiteboardSettings.teamNumber = Popup.getInputValue("team-number");
        WhiteboardSettings.websocketURL = Popup.getInputValue("websocket-url");
        WhiteboardSettings.dashboardID = Popup.getInputValue("dashboard-id");
        localStorage.setItem("webdashboard-settings", JSON.stringify(WhiteboardSettings));
        Popup.closePopup(popup);
    },

    populateSettingsInfo: function () {
        Popup.setInputValue("dashboard-id", WhiteboardSettings.dashboardID);
        Popup.setInputValue("team-number", WhiteboardSettings.teamNumber);
        Popup.setInputValue("websocket-url", WhiteboardSettings.websocketURL);
    },

    addStyleClass(currentClass, toAdd) {
        try {
            Array.from(document.getElementsByClassName(currentClass)).forEach((element) => {
                element.classList.add(toAdd);
            });
        } catch (err) {
            console.warn(err);
        }
    },

    WhiteboardTheme: class {
        constructor(key, attributes) {
            this.key = key;
            this.attributes = attributes;
        }
    },

    setTheme: function () {
        let theme = WhiteboardSettings.Themes.selectedTheme;
        let baseTheme = WhiteboardSettings.Themes.BASE;
        WhiteboardSettings.addStyleClass("default-text", getModifier(baseTheme.defaultText, theme.key));
        document.getElementById("menu").classList.add(getModifier(baseTheme.menu, theme.key));
        document.getElementById("transition").classList.add(getModifier(baseTheme.menuTransition, theme.key));
        document.getElementById("whiteboard").classList.add(getModifier(baseTheme.whiteboard, theme.key));
        WhiteboardSettings.addStyleClass("menu-button", getModifier(baseTheme.menuBtn, theme.key));
        WhiteboardSettings.addStyleClass("dropdown-button", getModifier(baseTheme.menuBtn, theme.key));
        WhiteboardSettings.addStyleClass("dropdown", getModifier(baseTheme.menuBtn, theme.key));
        WhiteboardSettings.addStyleClass("dropdown-option", getModifier(baseTheme.menuBtn, theme.key));
        document.getElementById("layout-name-container").classList.add(getModifier(baseTheme.layoutName, theme.key));
        document.getElementById("layout-name").classList.add(getModifier(baseTheme.layoutNameTxt, theme.key));
        WhiteboardSettings.addStyleClass("popup", getModifier(baseTheme.popup, theme.key));
        WhiteboardSettings.addStyleClass("input-label", getModifier(baseTheme.inputLabel, theme.key));
        WhiteboardSettings.addStyleClass("popup-input", getModifier(baseTheme.popupInput, theme.key));
        WhiteboardSettings.addStyleClass("apply", getModifier(baseTheme.applyBtn, theme.key));
        Array.from(document.getElementsByClassName("close")).forEach((img) => { img.setAttribute("src", getModifier(baseTheme.attributes.closeSrc, theme.key) + baseTheme.attributes.closeImgType) });
        WhiteboardSettings.addStyleClass("prompt", getModifier(baseTheme.prompt, theme.key));
        document.getElementById("draggable-selectable-field").classList.add(getModifier(baseTheme.draggableField, theme.key));
    },

};

window.WhiteboardSettings = WhiteboardSettings || {};

WhiteboardSettings.Themes.selectedTheme = WhiteboardSettings.Themes.CHARCOAL;