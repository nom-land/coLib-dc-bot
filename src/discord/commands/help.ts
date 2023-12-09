import { Interaction, SlashCommandBuilder } from "discord.js";
import { settings } from "../../config";

// register a "/help" command
module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Help information"),
    async execute(interaction: Interaction) {
        if (!interaction.isCommand()) {
            return;
        }
        interaction.reply(`Hi! I am ${settings.appName}!
         
    ${settings.curatorUsageMsg}
    `);
    },
};
