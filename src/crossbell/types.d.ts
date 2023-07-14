export interface Account {
    platform: "Discord" | "Telegram";
    handle: string; // unique handle in that platform
    guildId?: string;
    nickname?: string;
    avatar?: string;
    banner?: string;
    dao?: boolean;
    variant?: string;
}
