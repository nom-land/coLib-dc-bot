import { Account } from "../crossbell/types";
import { Record } from "../record/types";

export interface CurationReason {
    comment: string;
    tagSuggestions: string[];
    titleSuggestion?: string;
}

export interface RawCuration {
    content: string; // content will be parsed to record in Curation
    sources: string[];
    date_published: string;
    external_url?: string;
}

export interface Curation {
    curator: Account;
    community: Account;
    list: string;
    reason: CurationReason;
    raw?: RawCuration;
}

export interface NoteId {
    characterId: number | bigint;
    noteId: number | bigint;
}
