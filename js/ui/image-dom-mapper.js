export class ImageDOMMapper
{
    /**
     * 
     * @param {number} imageWidth 
     * @param {number} imageHeight 
     * @param {Element} element 
     */
    constructor(imageWidth, imageHeight, element)
    {
        this.element = element;
        this.rect = element.getBoundingClientRect();
        /**
         * @type {number}
         */
        this.imageWidth = imageWidth;
        /**
         * @type {number}
         */
        this.imageHeight = imageHeight;
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y
     * @returns {{x: number, y: number}}
     */
    imageToDOMPosition(x, y)
    {
        this.rect = this.element.getBoundingClientRect();
        const xRatio = this.rect.width / this.imageWidth;
        const yRatio = this.rect.height / this.imageHeight;
        const translatedX = x * xRatio;
        const translatedY = y * yRatio;
        return { x: this.rect.left + translatedX, y: this.rect.top + translatedY };
    }
}