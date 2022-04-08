import helpWithoutPrefix from "../handlers/helpWithoutPrefix";
import jodohkuHandler from "../handlers/jodohkuHandler";
import mentionEveryone from "../handlers/mentions/mentionEveryone";
import mentionRole from "../handlers/mentions/mentionRole";
import { CommandMap } from "../types/command";

const commandsWithoutPrefix: CommandMap = {
    '@everyone': mentionEveryone,
    '@[A-Za-z]+[\\w-]*': mentionRole,
    '(?: |^)(?:help|tolong|bantu)(?: |$)': helpWithoutPrefix,
    'jodohku|jodoh *@.+|(?:^| )[sa](?:a+)?y+(?:a+)?(?:n+)?g+': jodohkuHandler,
};

export default commandsWithoutPrefix;