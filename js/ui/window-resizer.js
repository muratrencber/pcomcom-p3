import { UIInterface } from "./interface.js";

const RESIZE_TARGET = {
    NONE: "NONE",
    LEFT: "LEFT",
    RIGHT: "RIGHT",
    TOP: "TOP",
    BOTTOM: "BOTTOM",
    VERTICAL: "VERTICAL",
    HORIZONTAL: "HORIZONTAL",
}
let OFFSET = 22;
const MIN_SIZE = 20;
const MAX_SIZE = 100 - MIN_SIZE;
const BORDER_OFFSET = 2;
const SNAP_AMOUNT = 1;
export class WindowResizer extends UIInterface
{
    /**
     * 
     * @param {string[]} obstructors 
     */
    constructor(obstructors = [])
    {
        super()
        obstructors.forEach(o => {
            const elem = document.getElementById(o);
            if(!elem) return;
            elem.addEventListener("mousedown", e => {
                e.obstructorApplied = true;
            });
            elem.addEventListener("mousemove", e => {
                e.obstructorApplied = true;
            })
        })
    }
    /**
     * 
     * @param {import("./uicontext").UIContext} context 
     */
    setup(context)
    {
        this.resizing = false;
        this.resizeTarget = RESIZE_TARGET.TOP;
        this.window = window;
        this.element = document.querySelector(".panels");
        this.element.style.gridTemplateColumns = "50% 50%";
        this.element.style.gridTemplateRows = "50% 50%";
        this.window.addEventListener("mousemove", e => {
            if(e.obstructorApplied)
                return;
            let savedTarget = this.resizeTarget;
            this.setResizeTarget(e.clientX, e.clientY);
            let cursorName = "default";
            if(this.resizeTarget == RESIZE_TARGET.LEFT || this.resizeTarget == RESIZE_TARGET.RIGHT || this.resizeTarget == RESIZE_TARGET.VERTICAL)
                cursorName = "row-resize";
            else if(this.resizeTarget == RESIZE_TARGET.TOP || this.resizeTarget == RESIZE_TARGET.BOTTOM || this.resizeTarget == RESIZE_TARGET.HORIZONTAL)
                cursorName = "col-resize";
            document.body.style.cursor = cursorName;
            this.resizeTarget = savedTarget;
        })
        const mouseMoveEventListener = (e) => {
            this.resize(e.clientX, e.clientY);
        };
        const moveFinishEventListener = (e) => {
            this.window.removeEventListener("mousemove", mouseMoveEventListener);
            this.window.removeEventListener("mouseup", moveFinishEventListener);
        };
        this.panels = this.element.querySelectorAll(".panels > div");
        this.topHandleRatio = 50;
        this.bottomHandleRatio = 50;
        this.leftHandleRatio = 50;
        this.rightHandleRatio = 50;
        this.setupPanels();
        this.window.addEventListener("mousedown", e => {
            if(e.obstructorApplied)
                return;
            this.setResizeTarget(e.clientX, e.clientY);
            if(this.resizeTarget == RESIZE_TARGET.NONE) return;
            e.stopPropagation();
            e.preventDefault();
            mouseMoveEventListener(e);
            this.window.addEventListener("mousemove", mouseMoveEventListener);
            this.window.addEventListener("mouseup", moveFinishEventListener);
        });
    }

    setupPanels()
    {
        const [topLeft, topRight, bottomLeft, bottomRight] = this.panels;
        topLeft.style.width = `calc(50% - ${BORDER_OFFSET}px)`;
        topLeft.style.height = `calc(50% - ${BORDER_OFFSET}px)`;
        topLeft.style.top = `0px`;
        topLeft.style.left = `0px`;

        topRight.style.width = `calc(50% - ${BORDER_OFFSET}px)`;
        topRight.style.height = `calc(50% - ${BORDER_OFFSET}px)`;
        topRight.style.top = `0px`;
        topRight.style.right = `0px`;

        bottomLeft.style.width = `calc(50% - ${BORDER_OFFSET}px)`;
        bottomLeft.style.height = `calc(50% - ${BORDER_OFFSET}px)`;
        bottomLeft.style.bottom = `0px`;
        bottomLeft.style.left = `0px`;

        bottomRight.style.width = `calc(50% - ${BORDER_OFFSET}px)`;
        bottomRight.style.height = `calc(50% - ${BORDER_OFFSET}px)`;
        bottomRight.style.bottom = `0px`;
        bottomRight.style.right = `0px`;
    }

    setResizeTarget(mouseX, mouseY)
    {
        let rect = this.element.getBoundingClientRect();
        this.resizeTarget = RESIZE_TARGET.VERTICAL;
        let leftRightSnapped = Math.abs(this.leftHandleRatio - this.rightHandleRatio) < SNAP_AMOUNT;
        let topBottomSnapped = Math.abs(this.topHandleRatio - this.bottomHandleRatio) < SNAP_AMOUNT;
        let leftHandleY = rect.top + rect.height * this.leftHandleRatio / 100;
        let rightHandleY = rect.top + rect.height * this.rightHandleRatio / 100;
        let topHandleX = rect.left + rect.width * this.topHandleRatio / 100;
        let bottomHandleX = rect.left + rect.width * this.bottomHandleRatio / 100;
        if(topBottomSnapped)
        {
            if(mouseY < leftHandleY + OFFSET && mouseY > leftHandleY - OFFSET && mouseX < bottomHandleX)
            {
                this.resizeTarget = RESIZE_TARGET.LEFT;
                return;
            }
            else if(mouseY < rightHandleY + OFFSET && mouseY > rightHandleY - OFFSET && mouseX > bottomHandleX)
            {
                this.resizeTarget = RESIZE_TARGET.RIGHT;
                return;
            }
        }
        if(leftRightSnapped)
        {
            if(mouseX < topHandleX + OFFSET && mouseX > topHandleX - OFFSET && mouseY < rightHandleY)
            {
                this.resizeTarget = RESIZE_TARGET.TOP;
                return;
            }
            else if(mouseX < bottomHandleX + OFFSET && mouseX > bottomHandleX - OFFSET && mouseY > rightHandleY)
            {
                this.resizeTarget = RESIZE_TARGET.BOTTOM;
                return;
            }
        }
        if(topBottomSnapped && mouseX < topHandleX + OFFSET && mouseX > topHandleX - OFFSET)
        {
            this.resizeTarget = RESIZE_TARGET.HORIZONTAL;
            return;
        }
        if(leftRightSnapped && mouseY < leftHandleY + OFFSET && mouseY > leftHandleY - OFFSET)
        {
            this.resizeTarget = RESIZE_TARGET.VERTICAL;
            return;
        }
        this.resizeTarget = RESIZE_TARGET.NONE;
    }

    applyHandles()
    {
        const [topLeft, topRight, bottomLeft, bottomRight] = this.panels;
        topLeft.style.width = `calc(${this.topHandleRatio}% - ${BORDER_OFFSET}px)`;
        topLeft.style.height = `calc(${this.leftHandleRatio}% - ${BORDER_OFFSET}px)`;

        topRight.style.width = `calc(${100-this.topHandleRatio}% - ${BORDER_OFFSET}px)`;
        topRight.style.height = `calc(${this.rightHandleRatio}% - ${BORDER_OFFSET}px)`;

        bottomLeft.style.width = `calc(${this.bottomHandleRatio}% - ${BORDER_OFFSET}px)`;
        bottomLeft.style.height = `calc(${100-this.leftHandleRatio}% - ${BORDER_OFFSET}px)`;

        bottomRight.style.width = `calc(${100-this.bottomHandleRatio}% - ${BORDER_OFFSET}px)`;
        bottomRight.style.height = `calc(${100-this.rightHandleRatio}% - ${BORDER_OFFSET}px)`;
    }

    resize(mouseX, mouseY)
    {
        let rect = this.element.getBoundingClientRect();
        let width = rect.width;
        let height = rect.height;
        mouseX = mouseX - rect.left;
        if(mouseX < 0) mouseX = 0;
        if(mouseX > width) mouseX = width;
        mouseY = mouseY - rect.top;
        if(mouseY < 0) mouseY = 0;
        if(mouseY > height) mouseY = height;
        switch(this.resizeTarget)
        {
            case RESIZE_TARGET.TOP:
                this.topHandleRatio = mouseX / width * 100;
                if(this.topHandleRatio < MIN_SIZE) this.topHandleRatio = MIN_SIZE;
                if(this.topHandleRatio > MAX_SIZE) this.topHandleRatio = MAX_SIZE;
                if(Math.abs(this.topHandleRatio - this.bottomHandleRatio) < SNAP_AMOUNT)
                    this.topHandleRatio = this.bottomHandleRatio;
                break;
            case RESIZE_TARGET.RIGHT:
                this.rightHandleRatio = mouseY / height * 100;
                if(this.rightHandleRatio < MIN_SIZE) this.rightHandleRatio = MIN_SIZE;
                if(this.rightHandleRatio > MAX_SIZE) this.rightHandleRatio = MAX_SIZE;
                if(Math.abs(this.rightHandleRatio - this.leftHandleRatio) < SNAP_AMOUNT)
                    this.rightHandleRatio = this.leftHandleRatio;
                break;
            case RESIZE_TARGET.LEFT:
                this.leftHandleRatio = mouseY / height * 100;
                if(this.leftHandleRatio < MIN_SIZE) this.leftHandleRatio = MIN_SIZE;
                if(this.leftHandleRatio > MAX_SIZE) this.leftHandleRatio = MAX_SIZE;
                if(Math.abs(this.leftHandleRatio - this.rightHandleRatio) < SNAP_AMOUNT)
                    this.leftHandleRatio = this.rightHandleRatio;
                break;
            case RESIZE_TARGET.BOTTOM:
                this.bottomHandleRatio = mouseX / width * 100;
                if(this.bottomHandleRatio < MIN_SIZE) this.bottomHandleRatio = MIN_SIZE;
                if(this.bottomHandleRatio > MAX_SIZE) this.bottomHandleRatio = MAX_SIZE;
                if(Math.abs(this.bottomHandleRatio - this.topHandleRatio) < SNAP_AMOUNT)
                    this.bottomHandleRatio = this.topHandleRatio;
                break;
            case RESIZE_TARGET.HORIZONTAL:
                this.topHandleRatio = mouseX / width * 100;
                if(this.topHandleRatio < MIN_SIZE) this.topHandleRatio = MIN_SIZE;
                if(this.topHandleRatio > MAX_SIZE) this.topHandleRatio = MAX_SIZE;
                this.bottomHandleRatio = this.topHandleRatio;
                break;
            case RESIZE_TARGET.VERTICAL:
                this.leftHandleRatio = mouseY / height * 100;
                if(this.leftHandleRatio < MIN_SIZE) this.leftHandleRatio = MIN_SIZE;
                if(this.leftHandleRatio > MAX_SIZE) this.leftHandleRatio = MAX_SIZE;
                this.rightHandleRatio = this.leftHandleRatio;
                break;
        }
        this.applyHandles();
    }
}