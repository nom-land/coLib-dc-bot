const md5 = require("md5");
const punycode = require("punycode/");

export function hashOf(content: string, digits = 4, suffix = true): string {
    const hash = md5(content);
    if (suffix) return hash.slice(hash.length - digits, hash.length);
    else return hash.slice(0, digits);
}

export function encode(content: string | undefined) {
    let str = punycode.encode(content);
    // remove " " and "\n"
    str = str.replace(/[\s\n]/g, "");
    // if char is not in [a-z0-9-_], replace it with "-"
    str = str.replace(/[^a-z0-9-_]/g, "-");
    // remove all "-" at the beginning
    str = str.replace(/^-+/g, "");
    return str;
}

export function feedbackUrl(cid: string, rid: string) {
    return `https://colib-home.vercel.app/community/${cid}/record/${rid}`;
}
