"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.electronI18n = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ElectronI18n {
    constructor() {
        this.currentLang = 'en';
        this.translations = {};
        this.loadTranslations(this.currentLang);
    }
    loadTranslations(lang) {
        try {
            const localePath = path.join(__dirname, 'locales', `${lang}.json`);
            if (fs.existsSync(localePath)) {
                this.translations = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
                this.currentLang = lang;
            }
            else {
                console.warn(`Translation file not found: ${localePath}`);
            }
        }
        catch (error) {
            console.error('Failed to load translations:', error);
        }
    }
    t(key) {
        try {
            const keys = key.split('.');
            let value = this.translations;
            for (const k of keys) {
                value = value?.[k];
            }
            return value || key;
        }
        catch (error) {
            console.error('Translation error:', error);
            return key;
        }
    }
    getLanguage() {
        return this.currentLang;
    }
}
exports.electronI18n = new ElectronI18n();
