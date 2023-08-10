import { log } from "../utils/log";
import { Record } from "./types";
import { ArticleData, extract } from "@extractus/article-extractor";

// export interface ArticleData {
//     url?: string;
//     links?: string[];
//     title?: string;
//     description?: string;
//     image?: string;
//     author?: string;
//     content?: string;
//     source?: string;
//     published?: string;
//     ttr?: number;
//   }

interface ExtendedArticleData extends ArticleData {
    authors: string[];
    language: string;
    copyright: string;
    derivation: "original" | "translation" | "unknown";
    upstream?: string; // if this is translation, then upstrem is the original record
}

export async function parseRecord(url: string) {
    let article: ArticleData | null = null;
    try {
        article = await extract(url);
    } catch (e) {
        log.error(e);
        article = {
            url,
        };
    }
    const extendedArticleData = {
        authors: [article?.author || ""],
        language: "unknown",
        copyright: "unknown",
        derivation: "unknown",
        ...article,
    } as ExtendedArticleData;
    let { content, author, ...articleAttrs } = extendedArticleData;
    // TODO: maybe save content somewhere else...
    return {
        url,
        ...articleAttrs,
        record_type: "article", // TODO: support book/video?
        parsed: true,
    } as Record;
}
