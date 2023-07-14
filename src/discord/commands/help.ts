import { SlashCommandBuilder } from "discord.js";

// register a "/help" command
module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Help information"),
    async execute() {
        console.log("I am Nunti!");
    },
};
