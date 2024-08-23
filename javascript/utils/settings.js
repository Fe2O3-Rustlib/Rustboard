window.getModifier = function (baseClass, suffix) {
    return baseClass + suffix;
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
        },

        MR_BLUE: {
            suffix: "-blue",
            attributes: {
                closeSrc: "./images/close-blue.svg",
                nodeHover: "black",
                draggableLabelBackground: "white",
                draggableLabelColor: "#0098cb",
            }
        },
        CHARCOAL: {
            suffix: "-dark",
            attributes: {
                closeSrc: "./images/close-dark.svg",
                nodeHover: "black",
                draggableLabelBackground: "#39303b",
                draggableLabelColor: "#f5770a",
            }
        },
        LIGHT: {
            suffix: "-light",
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
        let theme = SettingsManager.Themes.selectedTheme;
        let baseTheme = SettingsManager.Themes.BASE;
        let keys = Object.keys(baseTheme);
        for (let i = 0; i < keys.length; i++) {
            theme[keys[i]] = baseTheme[keys[i]] + theme.suffix;
        }
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

    setTheme: function () {
        let theme = SettingsManager.Themes.selectedTheme;
        SettingsManager.addStyleClass("default-text", theme.defaultText);
        document.getElementById("menu").classList.add(theme.menu);
        document.getElementById("transition").classList.add(theme.menuTransition);
        document.getElementById("whiteboard").classList.add(theme.whiteboard);
        SettingsManager.addStyleClass("menu-button", theme.menuBtn);
        SettingsManager.addStyleClass("dropdown-button", theme.menuBtn);
        SettingsManager.addStyleClass("dropdown", theme.menuBtn);
        SettingsManager.addStyleClass("dropdown-option", theme.menuBtn);
        document.getElementById("layout-name-container").classList.add(theme.layoutName);
        document.getElementById("layout-name").classList.add(theme.layoutNameTxt);
        SettingsManager.addStyleClass("popup", theme.popup);
        SettingsManager.addStyleClass("input-label", theme.inputLabel);
        SettingsManager.addStyleClass("popup-input", theme.popupInput);
        SettingsManager.addStyleClass("apply", theme.applyBtn);
        Array.from(document.getElementsByClassName("close")).forEach((img) => { img.setAttribute("src", theme.attributes.closeSrc) });
        SettingsManager.addStyleClass("prompt", theme.prompt);
        document.getElementById("draggable-selectable-field").classList.add(theme.draggableField);
    },

};

window.SettingsManager = SettingsManager || {};

SettingsManager.Themes.selectedTheme = SettingsManager.Themes.CHARCOAL;