import helpWithoutPrefix from "../handlers/helpWithoutPrefix";
import jodohkuHandler from "../handlers/jodohkuHandler";
import mentionEveryone from "../handlers/mentions/mentionEveryone";
import mentionRole from "../handlers/mentions/mentionRole";
import { CommandMap } from "../types/command";

const commandsWithoutPrefix: CommandMap = {
    '@everyone': mentionEveryone,
    '@[A-Za-z]+[\\w-]*': mentionRole,
    'jodohku|jodoh *@.+|(?:^| )[sa](?:a+)?y+(?:a+)?(?:n+)?g+': jodohkuHandler,
    '(?: |^)(?:help|tolong|bantu)(?: |$)': helpWithoutPrefix,
};

export default commandsWithoutPrefix;