import { Interaction, SlashCommandBuilder } from "discord.js";

// register a "/ls" command
module.exports = {
    data: new SlashCommandBuilder()
        .setName("ls")
        .setDescription("Show all lists of the community"),
    async execute(interaction: Interaction) {
        if (!interaction.isCommand()) return; // It has to be here...

        interaction.reply("Hey...");
    },
};
