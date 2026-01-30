// Styles module - custom dance style color management

import { PREDEFINED_STYLES } from './utils.js';

const PALETTE = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
    '#F7DC6F', '#85C1E9', '#F8C471', '#BB8FCE', '#82E0AA', '#F1948A',
    '#F9E79F', '#D7BDE2', '#A9DFBF', '#F5B7B1', '#AED6F1', '#FCF3CF',
    '#E8DAEF', '#ABEBC6', '#FADBD8', '#D6EAF8', '#EBDEF0', '#D5F4E6'
];

export class StyleManager {
    constructor(storage) {
        this.storage = storage;
    }

    getClassName(style) {
        return style.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    isPredefined(style) {
        return PREDEFINED_STYLES.includes(style);
    }

    generateColor(styleName) {
        const customStyles = this.storage.load('customDanceStyles', {});
        if (customStyles[styleName]) return customStyles[styleName];

        const usedColors = new Set(Object.values(customStyles));
        let color = PALETTE.find(c => !usedColors.has(c)) || PALETTE[0];

        if (usedColors.has(color)) {
            let hash = 0;
            for (let i = 0; i < styleName.length; i++) {
                hash = ((hash << 5) - hash) + styleName.charCodeAt(i);
            }
            color = PALETTE[Math.abs(hash) % PALETTE.length];
        }
        return color;
    }

    addCustomStyle(styleClass, styleName) {
        if (document.querySelector(`style[data-custom-style="${styleClass}"]`)) return;

        const color = this.generateColor(styleName);
        const el = document.createElement('style');
        el.setAttribute('data-custom-style', styleClass);
        el.textContent = `.class-item.${styleClass} { background: ${color}; }`;
        document.head.appendChild(el);

        const customStyles = this.storage.load('customDanceStyles', {});
        customStyles[styleName] = color;
        this.storage.save('customDanceStyles', customStyles);
    }

    loadStored() {
        const customStyles = this.storage.load('customDanceStyles', {});
        Object.entries(customStyles).forEach(([name, color]) => {
            const styleClass = this.getClassName(name);
            if (!document.querySelector(`style[data-custom-style="${styleClass}"]`)) {
                const el = document.createElement('style');
                el.setAttribute('data-custom-style', styleClass);
                el.textContent = `.class-item.${styleClass} { background: ${color}; }`;
                document.head.appendChild(el);
            }
        });
    }
}
