// keyValueStore.ts
import { table } from "console";
import * as fs from "fs";
import * as path from "path";

const rootPath = path.resolve("./");

const getFilePath = (table?: string) => {
    let fileName: string;
    if (table) {
        fileName = `store/${table}.json`;
    } else {
        fileName = "store/keyValueStore.json";
    }
    return path.join(rootPath, fileName);
};

export function addKeyValue(
    key: string,
    value: string,
    table?: string
): boolean {
    const filePath = getFilePath(table);

    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, "{}");
        }

        const data = fs.readFileSync(filePath, "utf-8");
        let store: Record<string, string> = {};

        if (data) {
            store = JSON.parse(data);
        }

        store[key] = value;
        fs.writeFileSync(filePath, JSON.stringify(store, null, 2));

        return true;
    } catch (err) {
        throw err;
    }
}

export function loadKeyValuePairs(
    targetMap: Map<string, string>,
    table?: string
): void {
    const filePath = getFilePath(table);

    try {
        if (!fs.existsSync(filePath)) {
            return;
        }

        const data = fs.readFileSync(filePath, "utf-8");
        let store: Record<string, string> = {};

        if (data) {
            store = JSON.parse(data);
        }

        for (const [key, value] of Object.entries(store)) {
            targetMap.set(key, value);
        }
    } catch (err) {
        throw err;
    }
}
