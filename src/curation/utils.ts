import { Contract, Numberish } from "crossbell";
import { makeListLinkType, getMembersLinkType } from "../utils";

export async function addMember(
    c: Contract,
    communityId: Numberish,
    memberId: Numberish
) {
    return c.link.linkCharacter({
        fromCharacterId: communityId,
        toCharacterId: memberId,
        linkType: getMembersLinkType(),
    });
}

export async function removeMember(
    c: Contract,
    communityId: Numberish,
    memberId: Numberish
) {
    return c.link.unlinkCharacter({
        fromCharacterId: communityId,
        toCharacterId: memberId,
        linkType: getMembersLinkType(),
    });
}

export async function addRecord(
    c: Contract,
    communityId: Numberish,
    recordId: Numberish,
    list: string,
    notWrapLinkType?: boolean
) {
    return c.link.linkCharacter({
        fromCharacterId: communityId,
        toCharacterId: recordId,
        linkType: notWrapLinkType ? list : makeListLinkType(list),
    });
}

export async function removeRecord(
    c: Contract,
    communityId: Numberish,
    recordId: Numberish,
    list: string,
    notWrapLinkType?: boolean
) {
    return c.link.unlinkCharacter({
        fromCharacterId: communityId,
        toCharacterId: recordId,
        linkType: notWrapLinkType ? list : makeListLinkType(list),
    });
}
