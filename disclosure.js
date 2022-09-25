
/*
    These requirements should also be present, but are not very practical to check, 
    as it would rely too much on implementation details:
        - button should have an accessible name
        - no focusable elements should be between the button and the disclosure
*/
function checkDisclosureTriggerA11y(trigger) {
    const triggerName = trigger.tagName.toLowerCase() + "#" + trigger.id;
    if (trigger.tagName !== "BUTTON") {
        console.warn(triggerName + " should be a button.");
    }
    if (!trigger.ariaExpanded) {
        console.warn(triggerName + " is missing the 'aria-expanded' property.");
    }
}

class disclosureEventHandler {
    trigger;    // the button element that opens disclosure
    disclosure; // the absolutely positioned disclosure element
    wrapper;    // the relatively positioned container element that contains both of the above
    onClose;

    isListening = false;

    constructor(disclosure, trigger, wrapper, onClose, navigableElements = []) {
        this.disclosure = disclosure;
        this.validateDisclosure();

        this.trigger = trigger;
        this.validateTrigger();
        
        this.wrapper = wrapper;
        this.validateWrapper();

        this.onClose = onClose;
        this.validateOnClose();
    }

    handleClickOutside = (event) => {
        console.log(event);
        console.log(this.disclosure);
        const isClickInsideDisclosure = this.disclosure.contains(event.target);
        if (!isClickInsideDisclosure) this.removeEventListeners();
    }

    // /* close if focus leaves dropdown or right split button */
    // handleFocusOutside(event) {
    //     const isFocusedElementInsideDropdown = dropdown.contains(event.relatedTarget);
    //     const isRightSplitButtonFocused = event.relatedTarget === rightSplitButton;

    //     if (!isFocusedElementInsideDropdown && !isRightSplitButtonFocused) {
    //         $actions.CloseDropdown();
    //         removeEvents();
    //     }
    // }

    // /*  Escape
    //         closes menu and reverts focus to right split button
    //     Arrow keys
    //         allows for restricted navigation (cannot leave dropdown) between dropdown items
    // */
    // //const dropdownButtons = dropdown.getElementsByTagName('button'); // would need to modify this if links are used
    // handleKeyInput(event) {
    //     switch (event.key) {
    //         case 'Escape':
    //             $actions.CloseDropdown();
    //             rightSplitButton.focus();
    //             removeEvents();
    //             break;
    //         /*
    //         case 'ArrowUp':  
    //             event.preventDefault();
     
    //             if(buttonIndex > 0) {
    //                 --buttonIndex
    //             } else {
    //                 buttonIndex = dropdownButtons.length - 1
    //             }
     
    //             dropdownButtons[buttonIndex].focus();
    //             break;
     
    //         case 'ArrowDown': 
    //             event.preventDefault();
     
    //             if(buttonIndex < dropdownButtons.length - 1) {
    //                 ++buttonIndex 
    //             } else {
    //                 buttonIndex = 0;
    //             }
            
    //             dropdownButtons[buttonIndex].focus();
    //             break;    
    //             */
    //     }
    // }

    toggleEventListeners = () => {
        if(this.isListening) this.removeEventListeners();
        else this.addEventListeners();
    }

    removeEventListeners = () => {
        this.isListening = false;
        document.removeEventListener('click', this.handleClickOutside);
        //wrapper.removeEventListener('focusout', onFocusOut);
        //document.removeEventListener('keydown', onKeyDown);

        this.onClose();
    }

    addEventListeners = () => {
        setTimeout(() => {
            this.isListening = true;
            document.addEventListener('click', this.handleClickOutside);
            //wrapper.addEventListener('focusout', onFocusOut);
            //document.addEventListener("keydown", onKeyDown);
        }, 50);
    }

    validateDisclosure = () => {
        if (!this.disclosure) throw new Error("disclosure is null");
        if (!(this.disclosure instanceof HTMLElement)) throw new Error("disclosure must be an HTMLElement"); 
    }

    validateTrigger = () => {
        if (!this.trigger) throw new Error("trigger is null");
        if (!(this.trigger instanceof HTMLElement)) throw new Error("trigger must be an HTMLElement");
        checkDisclosureTriggerA11y(this.trigger);
    }

    validateWrapper = () => {
        console.log(this.wrapper instanceof HTMLElement);
        if (!(this.wrapper instanceof HTMLElement)) throw new Error("wrapper must be an HTMLElement");
        if (!this.wrapper.contains(this.disclosure) || !this.wrapper.contains(this.trigger)) {
            throw new Error("wrapper must contain trigger and disclosure");
        }
    }

    validateOnClose = () => {
        if (!this.onClose) throw new Error("onClose is null");
        if (typeof this.onClose !== 'function') throw new Error("onClose must be a function");
    }
}

const trigger = document.getElementById("trigger");
const disclosure = document.getElementById("disclosure");
const wrapper = document.getElementById("wrapper");

const close = () => {  
    disclosure.style.display = 'none';
    trigger.ariaExpanded = false;
};

const disclosureHandler = new disclosureEventHandler(disclosure, trigger, wrapper, close);

const toggle = () => {  
    if (disclosure.style.display === 'none') {
        disclosure.style.display = '';
        trigger.ariaExpanded = true;
    } else {
        disclosure.style.display = 'none';
        trigger.ariaExpanded = false;
    }

    disclosureHandler.toggleEventListeners();
};

