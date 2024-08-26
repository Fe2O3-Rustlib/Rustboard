var Select = {
    SELECTABLE_CLASSNAME_INDICATOR: "selectable",

    Selectable: class {
        static selectableInstances = [];

        constructor(name, onclick, unselectedStyle, selectedStyle, isSelectable) {
            this.isSelected = false;
            this.group = null;
            this.name = name;
            this.anchor = document.createElement("a");
            this.getUnselectedStyle = getValue(unselectedStyle, () => {
                return "default-selectable " + SettingsManager.Themes.selectedTheme.defaultSelectable;
            });
            this.getSelectedStyle = getValue(selectedStyle, () => {
                return "default-selectable-selected " + SettingsManager.Themes.selectedTheme.defaultSelectableSelected;
            });
            this.anchor.innerHTML = name;
            this.anchor.onclick = function () {
                if (isSelectable) {
                    this.group.select(this);
                }
                try {
                    if (!(onclick == null || onclick == undefined)) onclick();
                } catch (e) {
                    console.log(e);
                }
            }.bind(this);
            this.isSelectable = isSelectable;
            this.unselect();
            Select.Selectable.selectableInstances.push(this);
        }

        unselect() {
            this.isSelected = false;
            this.anchor.setAttribute("class", this.getUnselectedStyle() + " " + Select.SELECTABLE_CLASSNAME_INDICATOR);
        }

        select() {
            this.isSelected = true;
            this.anchor.setAttribute("class", this.getUnselectedStyle() + " " + this.getSelectedStyle() + " " + Select.SELECTABLE_CLASSNAME_INDICATOR);
        }

        static refreshAllThemes() {
            for (let i = 0; i < Select.Selectable.selectableInstances.length; i++) {
                let selectableInstance = Select.Selectable.selectableInstances[i];
                if (selectableInstance.isSelected) {
                    selectableInstance.select();
                } else {
                    selectableInstance.unselect();
                }
            }
        }
    },

    SelectableGroup: class {
        selected = null;
        selectables = [];

        constructor() {
            this.select = this.select.bind(this);
            this.selectByName = this.selectByName.bind(this);
            this.add = this.add.bind(this);
            this.generateHTML = this.generateHTML.bind(this);
        }

        select(selectable) {
            this.selected = selectable;
            for (let i = 0; i < this.selectables.length; i++) {
                this.selectables[i].unselect();
            }
            selectable.select();
        }

        selectByName(name) {
            let toSelect = null;
            for (let i = 0; i < this.selectables.length; i++) {
                if (this.selectables[i].name === name) {
                    toSelect = this.selectables[i];
                }
            }
            if (toSelect != null) {
                this.select(toSelect);
                return true;
            }
            return false;
        }

        add(...selectableItems) {
            selectableItems.forEach((selectable) => { this.selectables.push(selectable); selectable.group = this; });
        }

        generateHTML(parent) {
            this.selectables.forEach((selectable) => parent.appendChild(selectable.anchor));
        }
    },
};

window.Select = Select || {};