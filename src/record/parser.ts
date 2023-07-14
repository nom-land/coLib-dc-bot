import { Record } from "./types";
import { extract } from "@extractus/article-extractor";

export async function parseRecord(url: string) {
    const article = await extract(url);
    console.log("article title", article?.title);
    if (article) {
        let { content, ...articleAttrs } = article;
        // TODO: maybe save content somewhere else...
        return {
            url,
            ...articleAttrs,
            record_type: "article", // TODO: support book?
            parsed: true,
        } as Record;
    } else {
        return {
            url,
            parsed: false,
        } as Record;
    }
}
