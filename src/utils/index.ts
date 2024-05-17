import { settings } from "../config";

const md5 = require("md5");
const punycode = require("punycode/");

export function hashOf(content: string, digits = 4, suffix = true): string {
    const hash = md5(content);
    if (suffix) return hash.slice(hash.length - digits, hash.length);
    else return hash.slice(0, digits);
}

export function feedbackUrl(curatorId: string, noteId: string) {
    if (settings.botConfig.prod === false) {
        // return `https://colib-home.vercel.app/community/${cid}/record/${rid}`;
        return `https://colib-home.vercel.app/curation/${curatorId}-${noteId}`;
    } else {
        return `https://colib.app/curation/${curatorId}-${noteId}`;
    }
}
