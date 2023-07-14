// import path, fs
import path from "path";
import requireAll from "require-all";

const commandsPath = path.join(__dirname, "");

// require all files under "commands"
export const commands = requireAll({
    dirname: commandsPath,
    filter: (fileName: string) => {
        // remove ".ts"  from file name
        fileName = fileName.slice(0, -3);
        return fileName === "index" ? false : fileName;
    },
    recursive: false,
});

export default commands;
