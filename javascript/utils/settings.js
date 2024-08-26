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
            listContainer: "list-container",
            selectableContainer: "selectable-container",
            defaultSelectable: "default-selectable",
            defaultSelectableSelected: "default-selectable-selected",
            draggableUnselect: "draggable-unselect",
            draggableSelect: "draggable-select",
            draggableLabel: "draggable-label"
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
        SLAY: {
            suffix: "-pink",
            attributes: {
                closeSrc: "./images/close-pink.svg",
                nodeHover: "#ff3399",
                draggableLabelBackground: "white",
                draggableLabelColor: "#ff3399",
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
        let newTheme = SettingsManager.Themes[SettingsManager.Themes.selectedThemeName];
        if (newTheme != SettingsManager.Themes.selectedTheme) {
            SettingsManager.manageTheme(SettingsManager.Themes.selectedTheme, false);
            SettingsManager.Themes.selectedTheme = newTheme;
            SettingsManager.populateTheme(newTheme);
            SettingsManager.manageTheme(newTheme, true);
            Select.Selectable.refreshAllThemes();
        }
    },

    loadSettings: function() {
        let storedSettings = getValue(JSON.parse(localStorage.getItem("webdashboard-settings")), {});
        SettingsManager.teamNumber = getValue(storedSettings.teamNumber, 0);
        SettingsManager.websocketURL = getValue(storedSettings.websocketURL, "ws://192.168.43.1:5801");
        SettingsManager.Themes.selectedThemeName = getValue(storedSettings.selectedThemeName, "CHARCOAL");
        SettingsManager.Themes.selectedTheme = SettingsManager.Themes[SettingsManager.Themes.selectedThemeName];
        SettingsManager.populateTheme(SettingsManager.Themes.selectedTheme);
    },

    populateSettingsInfo: function () {
        Popup.setInputValue("team-number", SettingsManager.teamNumber);
        Popup.setInputValue("websocket-url", SettingsManager.websocketURL);
    },

    manageStyleClass(identifierClassName, className, add) {
        try {
            let elementsWithClass = Array.from(document.getElementsByClassName(identifierClassName));
            if (add) {
                elementsWithClass.forEach((element) => element.classList.add(className));
            } else {
                elementsWithClass.forEach((element) => element.classList.remove(className));
            }
        } catch (err) {
            console.warn(err);
        }
    },

    manageSingleElementStyleClass: function(id, className, add) {
        if (add) {
            document.getElementById(id).classList.add(className);
        } else {
            document.getElementById(id).classList.remove(className);
        }
    },

    populateTheme: function(theme) {
        let baseTheme = SettingsManager.Themes.BASE;
        let keys = Object.keys(baseTheme);
        for (let i = 0; i < keys.length; i++) {
            theme[keys[i]] = baseTheme[keys[i]] + theme.suffix;
        }
    },

    manageTheme: function (theme, add) {
        SettingsManager.manageStyleClass("default-text", theme.defaultText, add);
        SettingsManager.manageStyleClass("menu-button", theme.menuBtn, add);
        SettingsManager.manageStyleClass("dropdown-button", theme.menuBtn, add);
        SettingsManager.manageStyleClass("dropdown", theme.menuBtn, add);
        SettingsManager.manageStyleClass("dropdown-option", theme.menuBtn, add);
        SettingsManager.manageStyleClass("popup", theme.popup, add);
        SettingsManager.manageStyleClass("input-label", theme.inputLabel, add);
        SettingsManager.manageStyleClass("popup-input", theme.popupInput, add);
        SettingsManager.manageStyleClass("apply", theme.applyBtn, add);
        SettingsManager.manageStyleClass("prompt", theme.prompt, add);
        SettingsManager.manageStyleClass("whiteboard-label", theme.draggableLabel, add);
        SettingsManager.manageStyleClass("list-container", theme.listContainer, add);
        SettingsManager.manageStyleClass("selectable-container", theme.selectableContainer, add);
        SettingsManager.manageSingleElementStyleClass("menu", theme.menu, add);
        SettingsManager.manageSingleElementStyleClass("transition", theme.menuTransition, add);
        SettingsManager.manageSingleElementStyleClass("whiteboard", theme.whiteboard, add);
        SettingsManager.manageSingleElementStyleClass("layout-name-container", theme.layoutName, add);
        SettingsManager.manageSingleElementStyleClass("layout-name", theme.layoutNameTxt, add);
        SettingsManager.manageSingleElementStyleClass("draggable-selectable-field", theme.draggableField, add);
        if (add) {
            Array.from(document.getElementsByClassName("close")).forEach((img) => { img.setAttribute("src", theme.attributes.closeSrc) });
        }
    },

    setTheme: function() {
        SettingsManager.manageTheme(SettingsManager.Themes.selectedTheme, true);
    }
};

window.SettingsManager = SettingsManager || {};

SettingsManager.Themes.selectedTheme = SettingsManager.Themes.CHARCOAL;