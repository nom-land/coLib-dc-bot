import { Interaction, SlashCommandBuilder } from "discord.js";
import { parseCommunity } from "../handle";
import { settings } from "../../config";
import { getCommunityLists } from "../../curation";

// register a "/ls" command
module.exports = {
    data: new SlashCommandBuilder()
        .setName("ls")
        .setDescription("Show all lists of the community"),
    async execute(interaction: Interaction) {
        if (!interaction.isCommand()) return; // It has to be here...

        await interaction.reply(settings.loadingPrompt);
        const guild = interaction.guild;
        if (!guild) {
            interaction.reply("Error: guild not found");
            return;
        }

        const c = parseCommunity(guild);
        const { count, listNames } = await getCommunityLists(c);

        // Reply there are "count" lists in the community, and list all names
        await interaction.editReply(
            `There are ${count} lists in the community: ${listNames.join(", ")}`
        );
    },
};
