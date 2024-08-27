var Popup = {

    POPUP_INPUT_CLASSNAME: "popup-input",
    CLOSE_BUTTON_CLASSNAME: "close",
    openPopups: 0,

    openPopup: function (id) {
        Popup.openPopups += 1;
        let popup = document.getElementById(id);

        popup.style.display = "block";
        for (let i = 0; i < popup.children.length; i++) {
            popup.children[i].style.opacity = 0;
        }

        let animation = [{ width: "0px", height: "0px" }, { width: popup.style.width, height: popup.style.height }];
        let timing = { duration: 300, iterations: 1 };

        popup.animate(animation, timing).finished.then(() => {
            for (let i = 0; i < popup.children.length; i++) {
                popup.children[i].style.opacity = 1.0;
            }
        });

        popup.setAttribute("z-index", "1");
        Popup.popupBackground.style.display = "block";
        Popup.popupBackground.setAttribute("z-index", "0");

        let onopen = popup.getElementsByClassName("popup-onopen")[0];
        if (onopen != undefined) onopen.click();
    },

    closePopup: function (popup) {
        Popup.openPopups -= 1;
        Popup.selected = null;
        let animation = [{ width: popup.style.width, height: popup.style.height }, { width: "0px", height: "0px" }];
        let timing = { duration: 300, iterations: 1 };
        popup.animate(animation, timing).finished.then(() => popup.style.display = "none");
        for (let i = 0; i < popup.children.length; i++) {
            popup.children[i].style.opacity = 0;
        }
        if (Popup.openPopups == 0) {
            Popup.popupBackground.style.display = "none";
        }
    },

    generateSimpleInputPopup: function (popupName, onApply, input, onOpen) {
        let div = document.createElement("div");
        div.id = popupName;
        div.setAttribute("class", "popup");
        div.style.width = "300px";
        div.style.height = "200px";

        let inputContainer = document.createElement("div");
        inputContainer.setAttribute("class", "absolute-centered-wrapper");
        div.appendChild(inputContainer);
        input.generateHTML(inputContainer);

        let apply = document.createElement("button");
        apply.setAttribute("class", "apply");
        apply.onclick = (event) => onApply(event);
        apply.innerHTML = "apply";
        div.appendChild(apply);

        document.body.appendChild(div);
        Popup.onPopupOpen(popupName, onOpen);
        return div;
    },

    onPopupOpen: function(popupId, onOpenFunction) {
        let popup = document.getElementById(popupId);
        let onOpenAnchor = document.createElement("a");
        onOpenAnchor.classList.add("popup-onopen");
        onOpenAnchor.onclick = getValue(onOpenFunction, () => {});
        popup.appendChild(onOpenAnchor);
    },

    populatePopupClickableList: function (container, selectedName, iterables, getOnclick, unselectedStyle, selectedStyle, isSelectable = false) {
        let group = new Select.SelectableGroup();
        for (let i = 0; i < iterables.length; i++) {
            let selectable = new Select.Selectable(iterables[i], getOnclick(iterables[i], i), unselectedStyle, selectedStyle, isSelectable);
            group.add(selectable);
        }
        group.generateHTML(container);
        group.selectByName(selectedName);
        return group;
    },

    PopupInput: class {
        constructor(placeholder, labelName, id) {
            this.labelName = labelName;
            this.placeholder = placeholder;
            this.id = id;
        }
        generateHTML(container) {
            let inputWrapper = document.createElement("div");
            inputWrapper.setAttribute("class", "simple-input-wrapper");
            inputWrapper.id = this.id;
            container.append(inputWrapper)
            let label = document.createElement("p");
            label.setAttribute("class", "input-label");
            label.innerHTML = this.labelName ?? "set property";
            inputWrapper.appendChild(label);
            let input = document.createElement("input");
            input.setAttribute("type", "text");
            input.setAttribute("placeholder", this.placeholder);
            input.setAttribute("class", Popup.POPUP_INPUT_CLASSNAME);
            inputWrapper.appendChild(input);
        }
    },

    populateVerticalInputs: function (container, ...inputs) {
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].generateHTML(container);
        }
    },

    setOnOpen: function (id, onopen) {
        let popup = document.getElementById(id);
        let anchor = document.createElement("a");
        anchor.onclick = onopen;
        anchor.classList.add("popup-onopen");
        popup.appendChild(anchor);
    },

    initializePopups: function () {
        let popups = document.getElementsByClassName("popup");
        for (let i = 0; i < popups.length; i++) {
            let cls = document.createElement("img");
            cls.setAttribute("class", "close");
            cls.addEventListener("click", () => { Popup.closePopup(Popup.getPopupFromChild(cls)) });
            popups[i].appendChild(cls);
        }
        let inputs = document.getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME);
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener("keydown", (event) => { if (event.key === "Enter" && document.activeElement === inputs[i]) Popup.getPopupFromChild(event.target).getElementsByClassName("apply")[0].click() });
        }
        Popup.popupBackground = document.getElementById("popup-background");
        popupOpeners = document.querySelectorAll("[popup]"); // Grabs all elements with a popup attribute
        for (let i = 0; i < popupOpeners.length; i++) {
            popupOpeners[i].addEventListener("click", () => { Popup.openPopup(popupOpeners[i].getAttribute("popup")) })
        }
    },

    getPopupFromChild: function (element) {
        if (element.classList.contains("popup") || element == null) {
            return element;
        } else {
            return Popup.getPopupFromChild(element.parentElement);
        }
    },

    getInput: function (wrapperId) {
        return document.getElementById(wrapperId).getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0];
    },

    getInputValue: function (wrapperId) {
        return document.getElementById(wrapperId).getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value;
    },

    setInputValue: function (wrapperId, value) {
        document.getElementById(wrapperId).getElementsByClassName(Popup.POPUP_INPUT_CLASSNAME)[0].value = value;
    },

    popupBackground: null,
};

Popup = Popup || {};
