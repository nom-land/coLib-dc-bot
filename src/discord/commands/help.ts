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
         
For curators... ${settings.curatorUsageMsg}
For curation managers...
    /ls: You can use /ls to display all current curation lists.
    /add: You can use /add to create new curation lists.
            
    Note: The bot is by default allowing anyone to add lists to the community library, the admin may wants to restrict it to some roles: Server Settings -> Integrations -> Manage -> /add command`);
    },
};
