/*
Based on Crossbell, process the curation.
*/

import { settings } from "../config";
import { parseRecord } from "../record/parser";
import { Contract, Note, NoteMetadata } from "crossbell";
import { Curation, CurationReason, NoteId, RawCuration } from "./types";
import { getCharacter, setup } from "../crossbell";
import { getRecord } from "../record";
import { Account } from "../crossbell/types";

export async function curateRecordInCommunity(
    c: Contract,
    curator: number,
    communityId: number,
    list: string,
    recordId: number,
    reason: CurationReason,
    rawData: RawCuration
) {
    // 1. Curator 发一条 note，且这个note指向 Record（postnote4note）
    // 2. Community Character 把这个 note 放到 community list 里（link）

    let sources = [settings.appName];
    if (rawData?.sources) sources = sources.concat(rawData.sources);

    const metadata = {
        content: reason.comment,
        sources,
        date_published: rawData?.date_published || new Date().toISOString(), //TODO
        attributes: [
            {
                trait_type: "entity type",
                value: "curation",
            },
            {
                trait_type: "curation content",
                value: rawData?.content,
            },
            {
                trait_type: "curation community",
                value: communityId,
            },
            {
                trait_type: "curation record",
                value: recordId,
            },
        ],
    } as NoteMetadata;

    if (rawData?.external_url) {
        metadata.external_urls = [rawData.external_url];
    }

    const { data } = await c.note.postForCharacter({
        characterId: curator,
        toCharacterId: recordId,
        metadataOrUri: metadata,
    });
    await c.link.linkCharacter({
        fromCharacterId: communityId,
        toCharacterId: recordId,
        linkType: `${settings.appName}-${list}`,
    });

    return data.noteId;
    // const result = await c.note.postForNote(
    //     curator,
    //     metadata,
    //     record.characterId,
    //     record.noteId
    // );
    // await c.link.linkNote(communityId, curator, result.data.noteId, list);
}

export async function processCuration(
    curation: Curation,
    url: string,
    adminPrivateKey: `0x${string}`
) {
    const { curator, community, list, reason, raw: rawData } = curation;
    const { contract, admin } = await setup(adminPrivateKey);
    if (!rawData) throw new Error("rawData is not defined");
    console.log("[DEBUG] Contract has been setup");

    const record = await parseRecord(url);
    console.log("[DEBUG] url has been parsed");

    // create record note on Crossbell
    const recordId = await getRecord(record, contract, admin);
    console.log(
        "[DEBUG] Record has been created, record id is",
        recordId.toString()
    );

    const communityId = await getCharacter(contract, admin, community, [
        "POST_NOTE_FOR_NOTE",
    ]);
    console.log(
        "[DEBUG] Community char has been created, communityId is",
        communityId.toString()
    );

    const curatorId = await getCharacter(contract, admin, curator, [
        "LINK_NOTE",
        "LINK_CHARACTER",
    ]);
    console.log(
        "[DEBUG] Curator char has been created, curatorId is",
        curatorId.toString()
    );

    //community links characterId
    await contract.link.linkCharacter({
        fromCharacterId: communityId,
        toCharacterId: curatorId,
        linkType: `${settings.appName}-members`,
    });
    console.log("[DEBUG] Community char has followed curator char");

    // TODO: admin follows communityId
    // contract.linkCharacter(admin, communityId, "follow")

    // curate
    const noteId = await curateRecordInCommunity(
        contract,
        Number(curatorId),
        Number(communityId),
        list,
        Number(recordId),
        reason,
        rawData
    );
    console.log("[DEBUG] Curation has been finished");
    return {
        cid: communityId.toString(),
        rid: recordId.toString(),
        record,
        curatorId: curatorId.toString(),
        noteId: noteId.toString(),
    };
}

export async function processDiscussion(
    poster: Account,
    msgMetadata: NoteMetadata,
    refNote: NoteId | null,
    adminPrivateKey: `0x${string}`
) {
    const { contract, admin } = await setup(adminPrivateKey);
    const posterId = await getCharacter(contract, admin, poster, [
        "POST_NOTE_FOR_NOTE",
        "POST_NOTE",
    ]);
    const noteOptions = {
        characterId: posterId,
        metadataOrUri: {
            ...msgMetadata,
        },
    };
    let noteId: bigint;
    if (refNote) {
        noteId = (
            await contract.note.postForNote({
                targetCharacterId: refNote.characterId,
                targetNoteId: refNote.noteId,
                ...noteOptions,
            })
        ).data.noteId;
    } else {
        noteId = (await contract.note.post(noteOptions)).data.noteId;
    }
    return { characterId: posterId, noteId } as NoteId;
}
