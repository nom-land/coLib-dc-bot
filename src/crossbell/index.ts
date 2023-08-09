import {
    AttributesMetadata,
    CharacterMetadata,
    CharacterOperatorPermission,
    Contract,
    createIndexer,
} from "crossbell";
import { Wallet } from "ethers";
import { Account } from "./types";
import { Record } from "../record/types";
import { encode, hashOf } from "../utils";
import { settings } from "../config";

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
    rec: Record,
    curator: bigint
) => {
    const { data } = await c.character.getByHandle({ handle });
    if (data.characterId) {
        return data.characterId;
    } else {
        return createNewRecord(c, admin, handle, rec, curator);
    }
};

export const createNewRecord = async (
    c: Contract,
    admin: `0x${string}`,
    handle: string,
    rec: Record,
    curator: bigint
) => {
    const profile = {
        ...rec,
        original_curator_id: curator.toString(),
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
export const getCharacterByAcc = async (options: {
    c: Contract;
    acc: Account;
    admin?: `0x${string}`;
    createIfNotExist?: true; // if this is true, admin has to be provided
}) => {
    const prefix = settings.botConfig.prod ? "" : "test-";
    const handle = (prefix + formatHandle(options.acc)).slice(0, 31);

    let existed = true;
    const { c, acc, admin, createIfNotExist } = options;
    const { data } = await c.character.getByHandle({ handle });
    let characterId = data.characterId;
    if (!characterId) {
        existed = false;
        if (createIfNotExist && admin)
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
    const { characterId, existed } = await getCharacterByAcc({
        c,
        admin,
        acc,
        createIfNotExist: true,
    });

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

    // All characters created in test env are granted permissions to prod admin
    if (!settings.botConfig.prod) {
        const permissions = (
            await getPermission(c, Number(characterId), settings.prodAddr)
        ).data;
        const requiredPermissions = [
            "POST_NOTE_FOR_NOTE",
            "POST_NOTE_FOR_CHARACTER",
            "POST_NOTE",
            "LINK_NOTE",
            "LINK_CHARACTER",
        ] as CharacterPermissionKey[];
        let missing = false;
        for (const p of requiredPermissions) {
            if (!permissions.includes(p)) {
                missing = true;
                break;
            }
        }
        if (missing)
            await c.operator.grantForCharacter({
                characterId: Number(characterId),
                operator: settings.prodAddr,
                permissions: requiredPermissions,
            });
    }

    return characterId;
};

export const setup = async (priKey?: `0x${string}`) => {
    // if prikey is not provided, use the `0x0`
    if (!priKey) {
        const contract = new Contract(undefined);
        return { admin: "0x0" as `0x${string}`, contract };
    }
    const admin = (await new Wallet(priKey).getAddress()) as `0x${string}`;
    const contract = new Contract(priKey);
    return { admin, contract };
};

// Get all links of an acc
export async function getLinks(acc: Account) {
    const { contract } = await setup();
    const { existed, characterId } = await getCharacterByAcc({
        acc,
        c: contract,
    });

    if (!existed) return { count: 0, list: [] };

    const indexer = createIndexer();
    return await indexer.linklist.getMany(characterId, { limit: 1000 });
    // TODO: add pagination
}
