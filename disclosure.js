/*
    CSS selector reference:
        a[href],
        area[href],
        input:not([disabled]),
        select:not([disabled]),
        textarea:not([disabled]),
        button:not([disabled]),
        details,
        iframe,
        [tabindex],
        [contentEditable=true]
*/

{
    const focusableElements = ["a", "area", "input", "select", "textarea", "button", "iframe", "details"];

    function isFocusableElement(element) {
        return (focusableElements.includes(element.tagName.toLowerCase())
            || element.hasAttribute("tabindex")
            || element.contentEditable === 'true')
            && !element.hasAttribute('disabled');
    }

    const typableElements = ["input", "select", "textarea"];

    function isTypeableElement(element) {
        return typableElements.includes(element.tagName.toLowerCase())
            || element.contentEditable === 'true';
    }
}




// https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
class disclosureEventHandler {
    trigger;    // the button element that opens disclosure
    disclosure; // the absolutely positioned disclosure element
    wrapper;    // the relatively positioned container element that contains both of the above
    onClose;

    navigableItems;
    navigableItemsIndex = -1;

    preventFocusEvent = false;  // prevent focus event from firing after calling .focus()
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

    set newNavigableItems(navigableItems) {
        this.navigableItemsIndex = -1;
        this.navigableItems = navigableItems;
        this.validateNavigableItems();
    }

    handleClickOutside = (event) => {
        const isClickInsideDisclosure = this.disclosure.contains(event.target);
        if (!isClickInsideDisclosure) this.removeEventListeners();
    }

    //  close if focus leaves disclosure or trigger button
    //  Otherwise, update navigableItemsIndex to stay consistent with arrow key navigation
    handleFocusOutside = (event) => {
        if (!event.relatedTarget || this.preventFocusEvent) return;

        const isFocusInsideDisclosure = this.disclosure.contains(event.relatedTarget)
            || event.relatedTarget === this.trigger;

        if (!isFocusInsideDisclosure) this.removeEventListeners();
        else if (navigableItems) this.navigableItemsIndex = Array.from(navigableItems).indexOf(event.relatedTarget);
    }

    /*  Escape
            closes menu and reverts focus to right split button
        Arrow keys
            allows for restricted navigation (cannot leave disclosure) between disclosure items
    */
    handleKeyInput = (event) => {
        // doesn't allow closing with Esc while typing, not sure if this matters
        if (isTypeableElement(document.activeElement)) return;

        // Until this function ends, do not fire handleFocusOutside from calling .focus()
        this.preventFocusEvent = true;
        
        if (event.key === 'Escape') {
            this.removeEventListeners();
            this.trigger.focus();
        }

        if (this.navigableItems) {
            switch (event.key) {
                case 'ArrowUp': case 'ArrowLeft':
                    event.preventDefault();

                    if (this.navigableItemsIndex > 0) {
                        --this.navigableItemsIndex
                    } else {
                        this.navigableItemsIndex = this.navigableItems.length - 1;
                    }

                    this.navigableItems[this.navigableItemsIndex].focus();
                    break;

                case 'ArrowDown': case 'ArrowRight':
                    event.preventDefault();

                    if (this.navigableItemsIndex < this.navigableItems.length - 1) {
                        ++this.navigableItemsIndex;
                    } else {
                        this.navigableItemsIndex = 0;
                    }

                    this.navigableItems[this.navigableItemsIndex].focus();
                    break;

                case 'Home':
                    this.navigableItemsIndex = 0;
                    this.navigableItems[this.navigableItemsIndex].focus();

                    break;

                case 'End':
                    this.navigableItemsIndex = this.navigableItems.length - 1;
                    this.navigableItems[this.navigableItemsIndex].focus();

                    break;
            }
        }

        this.preventFocusEvent = false;
    }

    toggleEventListeners = () => {
        if (this.isListening) this.removeEventListeners();
        else this.addEventListeners();
    }

    removeEventListeners = () => {
        if (!this.isListening) return;

        document.removeEventListener('click', this.handleClickOutside);
        document.removeEventListener('keydown', this.handleKeyInput);
        wrapper.removeEventListener('focusout', this.handleFocusOutside);

        this.isListening = false;
        this.navigableItemsIndex = -1;

        this.onClose();
    }

    addEventListeners = () => {
        if (this.isListening) return;

        /* needed otherwise the button will instantly close on click */
        setTimeout(() => {
            document.addEventListener('click', this.handleClickOutside);
            document.addEventListener("keydown", this.handleKeyInput);
            wrapper.addEventListener('focusout', this.handleFocusOutside);
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
        if (!(this.navigableItems instanceof HTMLCollection) && !(this.navigableItems instanceof NodeList)) {
            throw new Error("navigableItems must be an HTMLCollection or NodeList");
        }

        let showButtonLinkWarning = true;
        Array.from(navigableItems).forEach(navigableItem => {
            if (!this.disclosure.contains(navigableItem)) throw new Error("navigableItems must be inside disclosure");
            if (!isFocusableElement(navigableItem)) throw new Error("navigableItems contains non focusable elements");

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
    trigger.focus();
    disclosureHandler.removeEventListeners();
};

const updateNavigableItems = () => {
    const newItems = document.querySelectorAll("button.focus-test");
    
    disclosureHandler.newNavigableItems = newItems;
};