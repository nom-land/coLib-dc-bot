import {
    ChannelType,
    Guild,
    GuildBasedChannel,
    Interaction,
    SlashCommandBuilder,
} from "discord.js";
import { settings } from "../../config";
import { createCurationList } from "../../curation";
import { parseCommunity } from "../handle";

// Get the curation category channel id. If it doesn't exist, create one.
function getCategoryAndSubChannel(guild: Guild, channelName: string) {
    const colibCategory = guild?.channels.cache.find((channel) => {
        if (
            channel.type == ChannelType.GuildCategory &&
            channel.name == settings.curationCategoryName
        ) {
            return true;
        }
    });

    let curationChannel: GuildBasedChannel | undefined;
    if (colibCategory) {
        curationChannel = guild?.channels.cache.find((channel) => {
            if (
                channel.parentId == colibCategory.id &&
                channel.name == channelName
            ) {
                return true;
            }
        });
    }

    return {
        category: colibCategory,
        channel: curationChannel,
    };
}

// create a new channel named after the list name and under the pre-defined category
async function createListChannelIfNotExisted(guild: Guild, name: string) {
    const { category, channel } = getCategoryAndSubChannel(guild, name);

    let colibCategoryId: string;
    let curationChannelId: string;
    try {
        if (category) {
            colibCategoryId = category.id;
        } else {
            const newChannel = await guild.channels.create({
                name: settings.curationCategoryName,
                type: ChannelType.GuildCategory,
                reason: "New list added to the community library.",
            });
            colibCategoryId = newChannel.id;
        }

        let channelName = "";

        if (channel) {
            curationChannelId = channel.id;

            channelName = channel.name;
        } else {
            const newChannel = await guild.channels.create({
                name: name,
                reason: "New list added to the community library.",
                parent: colibCategoryId,
            });
            curationChannelId = newChannel.id;
            channelName = newChannel.name;
        }

        return { curationChannelId, channelName };

        // TODO: permission control of the new channel
    } catch (e) {
        console.error(e);
        return { curationChannelId: null, channelName: null };
    }
}

// register a "/add" command
module.exports = {
    data: new SlashCommandBuilder()
        .setName("add")
        // add an user option with name "list" and description "The new list name to add to the community library"
        .addStringOption((option) =>
            option
                .setName("list")
                .setDescription(
                    "The new list name to add to the community library."
                )
                .setRequired(true)
        ),

    async execute(interaction: Interaction) {
        if (!interaction.isCommand()) return; // It has to be here...
        const guild = interaction.guild;
        if (!guild) {
            // rely "Error: guild not found"
            interaction.reply("Error: guild not found");
            return;
        }

        // get the user option value
        const listName = interaction.options.get("list")?.value;
        // if list name is not provided, reply "Invalid list name"
        if (!listName || typeof listName !== "string") {
            console.error("Invalid list name");
            interaction.reply("Invalid list name");
            return;
        }
        // else create a linklist on Crossbell
        // and create a channel named after the list name
        await interaction.reply(settings.loadingPrompt);

        const { curationChannelId, channelName } =
            await createListChannelIfNotExisted(guild, listName);

        if (!curationChannelId || !channelName) {
            interaction.editReply("Error: failed to create channel");
            return;
        }

        // create list has been after create channel because discord channel name may be different from the original list name, so we use channel name instead

        try {
            await createCurationList(
                settings.botConfig.adminPrivateKey,
                parseCommunity(guild),
                channelName
            );
        } catch (e) {
            console.error(e);
            interaction.editReply("Error: failed to create list");
            return;
        }

        interaction.editReply(
            `New list added to the community library and <#${curationChannelId}>.`
        );
    },
};
