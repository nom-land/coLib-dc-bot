import { it } from "vitest";
import { processCuration } from "../src/curation";
import { Curation } from "../src/curation/types";
import { Record } from "../src/record/types";
import fetch from "isomorphic-fetch"; // 或者 'cross-fetch'
import { crossbell } from "crossbell/network";
import { parseRecord } from "../src/record/parser";

// 将 fetch 设为全局变量
global.fetch = fetch;
globalThis.fetch = fetch;
//Localhost
if (process.env.CROSSBELL_RPC_ADDRESS === "http://127.0.0.1:8545") {
    (crossbell.id as any) = 31337;
}
//Localhost End

const mockAdminPrivateKey =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const mockCurationUrl = "https://discord.com/xxx";

const mockParsedRecord = {
    url: mockCurationUrl,
    title: "History of Curation",
    author: "Luc",
    record_type: "article",
    parsed: true,
} as Record;

const rawCuration = {
    content: `${mockCurationUrl}\nThis article has a great insight.`,
    sources: ["channelXXX", "DDAO"],
    date_published: "2023-04-01T00:00:00.000Z",
    external_url: "https://discord.com/xxx",
};

const mockCuration = function () {
    return {
        curator: {
            platform: "Discord",
            guildId: "DDAO",
            handle: "Someone",
        },
        raw: rawCuration,
        record: mockParsedRecord,
        reason: {
            comment: "This article has a great insight.",
            tagSuggestions: ["decentralization", "creator economy"],
        },
        community: {
            platform: "Discord",
            guildId: "DDAO",
            handle: "DDAO",
        },
        list: "all about curation",
    } as Curation;
};

it("curation works", async () => {
    try {
        await processCuration(
            mockCuration(),
            mockCurationUrl,
            mockAdminPrivateKey
        );
    } catch (e) {
        console.log(e);
    }

    // const c = new Contract(mockAdminPrivateKey);
    // c.getLinkKeyForCharacter(communityId.toString());
    // c.linklistContract.getLinkingNotes(communityId);
});

it("parse record works", async () => {
    const res = await parseRecord("https://yesterweb.org/no-to-web3/");
    console.log(res.author);
});

// it("record creation works", async () => {
// const recordNote = await createRecordIfNotExist(mockParsedRecord);
// Read record
// });
