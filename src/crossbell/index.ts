import {
    AttributesMetadata,
    CharacterMetadata,
    CharacterOperatorPermission,
    Contract,
} from "crossbell";
import { Wallet } from "ethers";
import { Account } from "./types";
import { Record } from "../record/types";
import { encode, hashOf } from "../utils";

type CharacterPermissionKey = keyof typeof CharacterOperatorPermission;

export type Attrs = Exclude<AttributesMetadata["attributes"], null | undefined>;

const formatHandle = (acc: Account) => {
    const guildCode = encode(acc.guildId ?? acc.handle);
    const userCode = encode(acc.handle);
    let tmpHandle = userCode + "-" + guildCode;

    const suffix = hashOf(tmpHandle);

    tmpHandle = tmpHandle.slice(0, 31 - 5) + "-" + suffix;

    let handle = "";
    for (let i = 0; i < Math.min(31, tmpHandle.length); i++) {
        const c = tmpHandle[i];
        if (
            (c >= "a" && c <= "z") ||
            (c >= "0" && c <= "9") ||
            c == "_" ||
            c == "-"
        ) {
            handle += c;
            continue;
        } else {
            handle += "-";
        }
    }
    return handle;
};

const createNewCharacter = async (
    c: Contract,
    admin: `0x${string}`,
    handle: string,
    acc: Account
) => {
    const profile = {
        connected_accounts: [
            "csb://account:" + acc.handle + "@" + acc.platform.toLowerCase(),
        ],
    } as CharacterMetadata;
    const { nickname, avatar, banner } = acc;
    if (nickname) profile.name = nickname;
    if (avatar) profile.avatars = [avatar];
    if (acc.dao) (profile as any).variant = "dao";
    if (banner)
        profile.banners = [
            {
                address: banner,
                mime_type: "media/image", //TODO
            },
        ];
    const { data } = await c.character.create({
        owner: admin,
        handle,
        metadataOrUri: profile,
    });
    return data;
};

export const createNewRecordIfNotExist = async (
    c: Contract,
    admin: `0x${string}`,
    handle: string,
    rec: Record
) => {
    const { data } = await c.character.getByHandle({ handle });
    if (data.characterId) {
        return data.characterId;
    } else {
        return createNewRecord(c, admin, handle, rec);
    }
};

export const createNewRecord = async (
    c: Contract,
    admin: `0x${string}`,
    handle: string,
    rec: Record
) => {
    const profile = {
        ...rec,
        variant: "record",
    } as CharacterMetadata;

    const { data } = await c.character.create({
        owner: admin,
        handle,
        metadataOrUri: profile,
    });
    return data;
};

export const getPermission = async (
    c: Contract,
    characterId: number,
    admin: `0x${string}`
) => {
    const permissions = await c.operator.getPermissionsForCharacter({
        characterId,
        operator: admin,
    });
    return permissions;
};

// if the character bound to account is not existed, create it;
// if it has been existed, return the character id
export const createCharacterIfNotExist = async (
    c: Contract,
    admin: `0x${string}`,
    acc: Account
) => {
    const handle = formatHandle(acc);
    let existed = true;
    const { data } = await c.character.getByHandle({ handle });
    let characterId = data.characterId;
    if (!characterId) {
        existed = false;
        characterId = await createNewCharacter(c, admin, handle, acc);
    }

    return { characterId, existed };
};

// if the character bound to account is not existed, create it;
// if it has been existed, check if the admin has required permissions
// return that character id
export const getCharacter = async (
    c: Contract,
    admin: `0x${string}`,
    acc: Account,
    requiredPermissions: CharacterPermissionKey[]
) => {
    const { characterId, existed } = await createCharacterIfNotExist(
        c,
        admin,
        acc
    );

    if (existed) {
        let characterOwner = admin;
        try {
            characterOwner = await c.contract.read.ownerOf([characterId]);
        } catch (e) {
            // non existed character
        }
        if (characterOwner !== admin) {
            const permissions = (
                await getPermission(c, Number(characterId), admin)
            ).data;
            for (const p of requiredPermissions) {
                if (!permissions.includes(p)) {
                    throw new Error(
                        characterId +
                            "(account:" +
                            acc.handle +
                            ") not authorized"
                    );
                }
            }
        }
    }

    return characterId;
};

export const setup = async (priKey: `0x${string}`) => {
    const admin = (await new Wallet(priKey).getAddress()) as `0x${string}`;
    const contract = new Contract(priKey);
    return { admin, contract };
};

// export async function useCrossbell(
//     username: string,
//     authorId: string,
//     authorAvatar: string,
//     banner: string,
//     guildName: string,
//     title: string,
//     publishedTime: string,
//     tags: string[],
//     content: string,
//     attachments: NoteMetadataAttachmentBase<"address">[],
//     curatorId: string,
//     curatorUsername: string,
//     curatorAvatar: string,
//     curatorBanner: string,
//     attributes?: Attrs
// ) {
//     // If the author has not been created a character, create one first
//     // Otherwise, post note directly
//     const priKey = process.env.adminPrivateKey;
//     if (!priKey) throw Error("Admin has not been set up.");
//     const { admin, contract } = await setup(priKey);
//     const handle = formatHandle(authorId, guildName);

//     const curatorHandle = formatHandle(curatorId, guildName);

//     //TODO: is valid handle?
//     if (handle.length < 3) {
//         throw new Error("handle length is wrong");
//     }

//     const characterId = await createCharacterIfNotExist(
//         contract,
//         admin,
//         handle,
//         username,
//         authorAvatar,
//         authorId,
//         banner
//     );

//     let curatorCharacterId = characterId;
//     if (curatorHandle !== handle) {
//         curatorCharacterId = await createCharacterIfNotExist(
//             contract,
//             admin,
//             curatorHandle,
//             curatorUsername,
//             curatorAvatar,
//             curatorId,
//             curatorBanner,
//             false
//         );
//     }

//     const attrs = attributes || [];

//     const note = {
//         sources: [
//             "cori",
//             "Telegram: " + guildName,
//             // "Topic: " + channelName, // TODO
//         ],
//         title,
//         content,
//         tags,
//         attachments,
//         date_published: new Date(publishedTime).toISOString(),
//         attributes: [
//             {
//                 trait_type: "curator",
//                 value:
//                     "csb://account:character-" +
//                     curatorCharacterId +
//                     "@crossbell",
//             },
//             ...attrs,
//         ],
//     } as NoteMetadata;
//     console.debug("[DEBUG]", note);
//     const noteId = (await contract.postNote(characterId, note)).data.noteId;
//     return { characterId, noteId };
// }
