import { REST, Routes } from "discord.js";
import commands from "./commands";

import { config } from "dotenv";

let prod = false;
let envPath = ".env.test";
if (process.env.PROD === "true") {
    prod = true;
    envPath = ".env";
}

config({
    path: envPath,
});

// flatten the commands object into an array
const commandsArr = [] as string[];
console.log(Object.values(commands)[0].data.toJSON());
Object.values(commands).forEach((c) => commandsArr.push(c.data.toJSON()));

const botToken = process.env["botToken"] || "";
const clientId = process.env["clientId"] || "";

console.log(envPath, botToken);

// console.log(commands["help"].execute());
// Construct and prepare an instance of the REST module
const rest = new REST().setToken(botToken);

(async () => {
    try {
        console.log(
            `Started refreshing ${commandsArr.length} application (/) commands.`
        );

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(Routes.applicationCommands(clientId), {
            body: commandsArr,
        });

        console.log(
            `Successfully reloaded ${
                (data as any).length
            } application (/) commands.`
        );
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();
