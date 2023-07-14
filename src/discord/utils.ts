import { Message } from "discord.js";

export function mentionsBot(message: Message, clientId: string) {
    return message.mentions.users.has(clientId);
}
