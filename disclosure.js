/*
    CSS selector reference:
        a[href],
        area[href],
        input:not([disabled]),
        select:not([disabled]),
        textarea:not([disabled]),
        button:not([disabled]),
        iframe,
        [tabindex],
        [contentEditable=true]
*/

{
    const validElements = ["a", "area", "input", "select", "textarea", "button", "iframe"];

    function isElementFocusable(element) {
        return (validElements.includes(element.tagName.toLowerCase())
            || element.hasAttribute("tabindex")
            || element.contentEditable === 'true')
            && !element.hasAttribute('disabled');
    }
}


// https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
class disclosureEventHandler {
    trigger;    // the button element that opens disclosure
    disclosure; // the absolutely positioned disclosure element
    wrapper;    // the relatively positioned container element that contains both of the above
    onClose;

    navigableItems;

    isListening = false;

    constructor(disclosure, trigger, wrapper, onClose, navigableItems = []) {
        this.disclosure = disclosure;
        this.validateDisclosure();

        this.trigger = trigger;
        this.validateTrigger();

        this.wrapper = wrapper;
        this.validateWrapper();

        this.onClose = onClose;
        this.validateOnClose();

        this.navigableItems = navigableItems;
        this.validateNavigableItems();
    }

    handleClickOutside = (event) => {
        const isClickInsideDisclosure = this.disclosure.contains(event.target);
        if (!isClickInsideDisclosure) this.removeEventListeners();
    }

    /* close if focus leaves disclosure or trigger button */
    handleFocusOutside = (event) => {
        if(!event.relatedTarget) return;
        
        const isFocusInsideDisclosure = this.disclosure.contains(event.relatedTarget) 
                                        || event.relatedTarget === this.trigger;

        if (!isFocusInsideDisclosure) this.removeEventListeners();
        else console.log("focus is inside disclosure");// need to check for navigableItems focus so index stays consistent
    }

    /*  Escape
            closes menu and reverts focus to right split button
        Arrow keys
            allows for restricted navigation (cannot leave disclosure) between disclosure items
    */
    handleKeyInput = (event) => {
        if (event.key === 'Escape') {
            this.removeEventListeners();
            this.trigger.focus();
        }

        if (false) {
            switch (event.key) {
                case 'ArrowUp' || 'ArrowLeft':
                    event.preventDefault();

                    if (buttonIndex > 0) {
                        --buttonIndex
                    } else {
                        buttonIndex = disclosureButtons.length - 1
                    }

                    disclosureButtons[buttonIndex].focus();
                    break;

                case 'ArrowDown' || 'ArrowRight':
                    event.preventDefault();

                    if (buttonIndex < disclosureButtons.length - 1) {
                        ++buttonIndex
                    } else {
                        buttonIndex = 0;
                    }

                    disclosureButtons[buttonIndex].focus();
                    break;
            }
        }
    }

    toggleEventListeners = () => {
        if (this.isListening) this.removeEventListeners();
        else this.addEventListeners();
    }

    removeEventListeners = () => {
        if (!this.isListening) return;

        document.removeEventListener('click', this.handleClickOutside);
        wrapper.removeEventListener('focusout', this.handleFocusOutside);
        document.removeEventListener('keydown', this.handleKeyInput);

        this.isListening = false;
        this.onClose();
    }

    addEventListeners = () => {
        if (this.isListening) return;

        /* needed otherwise the button will instantly close on click */
        setTimeout(() => {  
            document.addEventListener('click', this.handleClickOutside);
            wrapper.addEventListener('focusout', this.handleFocusOutside);
            document.addEventListener("keydown", this.handleKeyInput);   
        }, 50);

        this.isListening = true;
    }

    validateDisclosure = () => {
        if (!this.disclosure) throw new Error("disclosure is null");
        if (!(this.disclosure instanceof HTMLElement)) throw new Error("disclosure must be an HTMLElement");
    }

    /*
        These a11y requirements should also be present, but are not very 
        practical to check, as it would rely too much on implementation details:
            - button should have an accessible name
            - no focusable elements should be between the button and the disclosure
    */
    validateTrigger = () => {
        if (!this.trigger) throw new Error("trigger is null");
        if (!(this.trigger instanceof HTMLElement)) throw new Error("trigger must be an HTMLElement");
        if (this.disclosure.contains(this.trigger)) throw new Error("trigger cannot be inside disclosure");

        const triggerName = this.trigger.tagName.toLowerCase() + "#" + this.trigger.id;
        if (this.trigger.tagName !== "BUTTON") console.warn(triggerName + " should be a button.");
        if (!this.trigger.ariaExpanded) console.warn(triggerName + " is missing the 'aria-expanded' property.");
    }

    validateWrapper = () => {
        if (!this.wrapper) throw new Error("wrapper is null");
        if (!(this.wrapper instanceof HTMLElement)) throw new Error("wrapper must be an HTMLElement");
        if (!this.wrapper.contains(this.disclosure) || !this.wrapper.contains(this.trigger)) {
            throw new Error("wrapper must contain trigger and disclosure");
        }
    }

    validateOnClose = () => {
        if (!this.onClose) throw new Error("onClose is null");
        if (typeof this.onClose !== 'function') throw new Error("onClose must be a function");
    }

    validateNavigableItems = () => {
        if (!this.navigableItems) throw new Error("navigableItems is null");
        if (!(this.navigableItems instanceof HTMLCollection)) throw new Error("navigableItems must be an HTMLCollection");

        let showButtonLinkWarning = true;
        Array.from(navigableItems).forEach(navigableItem => {
            if (!this.disclosure.contains(navigableItem)) throw new Error("navigableItems must be inside disclosure");
            if (!isElementFocusable(navigableItem)) throw new Error("navigableItems contains non focusable elements");

            if (showButtonLinkWarning && (navigableItem.tagName !== 'BUTTON' && navigableItem.tagName !== 'A')) {
                console.warn("disclosureEventHandler: navigableItems should only contain buttons and/or links");
                showButtonLinkWarning = false;
            }
        });
    }
}



const trigger = document.getElementById("trigger");
const disclosure = document.getElementById("disclosure");
const wrapper = document.getElementById("wrapper");
const navigableItems = document.getElementsByClassName("focus-test");

const showDisclosure = () => {
    disclosure.style.display = '';
    trigger.ariaExpanded = true;
};

const hideDisclosure = () => {
    disclosure.style.display = 'none';
    trigger.ariaExpanded = false;
}

const disclosureHandler = new disclosureEventHandler(disclosure, trigger, wrapper, onClose = () => {
    hideDisclosure();
}, navigableItems);

const toggle = () => {
    if (disclosure.style.display === 'none') showDisclosure();
    else hideDisclosure();

    disclosureHandler.toggleEventListeners();
};

const closeDisclosure = () => {
    hideDisclosure();
    disclosureHandler.removeEventListeners();
};