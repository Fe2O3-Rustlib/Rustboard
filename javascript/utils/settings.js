window.getModifier = function (baseClass, key) {
    return baseClass + key;
};

var SettingsManager = {
    teamNumber: 21865,
    websocketURL: "ws://192.168.43.1:5801",
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
                draggableLabelBackground: "white",
                draggableLabelColor: "#0098cb",
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
                draggableLabelBackground: "#39303b",
                draggableLabelColor: "#f5770a",
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
                draggableLabelBackground: "white",
                draggableLabelColor: "#aeaeae",
            }
        },

        selectedThemeName: null,
        selectedTheme: null
    },

    saveSettings: function (event) {
        let popup = Popup.getPopupFromChild(event.target);
        SettingsManager.teamNumber = Popup.getInputValue("team-number");
        SettingsManager.websocketURL = Popup.getInputValue("websocket-url");
        let storedSettings = {
            teamNumber: SettingsManager.teamNumber,
            websocketURL: SettingsManager.websocketURL,
            selectedThemeName: SettingsManager.Themes.selectedThemeName 
        }
        localStorage.setItem("webdashboard-settings", JSON.stringify(storedSettings));
        Popup.closePopup(popup);
        if (SettingsManager.Themes[SettingsManager.Themes.selectedThemeName] != SettingsManager.Themes.selectedTheme) {
            location.reload();
        }
    },

    loadSettings: function() {
        let storedSettings = getValue(JSON.parse(localStorage.getItem("webdashboard-settings")), {});
        SettingsManager.teamNumber = getValue(storedSettings.teamNumber, 0);
        SettingsManager.websocketURL = getValue(storedSettings.websocketURL, "ws://192.168.43.1:5801");
        SettingsManager.Themes.selectedThemeName = getValue(storedSettings.selectedThemeName, "CHARCOAL");
        SettingsManager.Themes.selectedTheme = SettingsManager.Themes[SettingsManager.Themes.selectedThemeName];
    },

    populateSettingsInfo: function () {
        Popup.setInputValue("team-number", SettingsManager.teamNumber);
        Popup.setInputValue("websocket-url", SettingsManager.websocketURL);
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
        let theme = SettingsManager.Themes.selectedTheme;
        let baseTheme = SettingsManager.Themes.BASE;
        SettingsManager.addStyleClass("default-text", getModifier(baseTheme.defaultText, theme.key));
        document.getElementById("menu").classList.add(getModifier(baseTheme.menu, theme.key));
        document.getElementById("transition").classList.add(getModifier(baseTheme.menuTransition, theme.key));
        document.getElementById("whiteboard").classList.add(getModifier(baseTheme.whiteboard, theme.key));
        SettingsManager.addStyleClass("menu-button", getModifier(baseTheme.menuBtn, theme.key));
        SettingsManager.addStyleClass("dropdown-button", getModifier(baseTheme.menuBtn, theme.key));
        SettingsManager.addStyleClass("dropdown", getModifier(baseTheme.menuBtn, theme.key));
        SettingsManager.addStyleClass("dropdown-option", getModifier(baseTheme.menuBtn, theme.key));
        document.getElementById("layout-name-container").classList.add(getModifier(baseTheme.layoutName, theme.key));
        document.getElementById("layout-name").classList.add(getModifier(baseTheme.layoutNameTxt, theme.key));
        SettingsManager.addStyleClass("popup", getModifier(baseTheme.popup, theme.key));
        SettingsManager.addStyleClass("input-label", getModifier(baseTheme.inputLabel, theme.key));
        SettingsManager.addStyleClass("popup-input", getModifier(baseTheme.popupInput, theme.key));
        SettingsManager.addStyleClass("apply", getModifier(baseTheme.applyBtn, theme.key));
        Array.from(document.getElementsByClassName("close")).forEach((img) => { img.setAttribute("src", getModifier(baseTheme.attributes.closeSrc, theme.key) + baseTheme.attributes.closeImgType) });
        SettingsManager.addStyleClass("prompt", getModifier(baseTheme.prompt, theme.key));
        document.getElementById("draggable-selectable-field").classList.add(getModifier(baseTheme.draggableField, theme.key));
    },

};

window.SettingsManager = SettingsManager || {};

SettingsManager.Themes.selectedTheme = SettingsManager.Themes.CHARCOAL;