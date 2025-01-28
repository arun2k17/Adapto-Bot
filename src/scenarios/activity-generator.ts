import { ITeamsScenario, IScenarioBuilder } from "../teams-bot";
import { callLLM } from "../llm";
import { isEmpty } from "lodash";

// const tools = [
//     {
//         "type": "function",
//         "function": {
//             "name": "sendActivity",
//             "description": "Send botframework activity",
//             "parameters": {
//                 "type": "object",
//                 "properties": {
//                     "text": {
//                         "type": "string",
//                         "description": "The text content of the activity"
//                     },
//                     "attachments": {
//                         "type": "array",
//                         "description": "Card attachments to the message",
//                         "items": {
//                             "type": "object",
//                             "properties": {
//                                 "content": {
//                                     "type": "object",
//                                     "additionalProperties": true,
//                                     "description": "attachment content as json payload"
//                                 },
//                                 "contentType": {
//                                     "type": "string",
//                                     "description": "content type of the attachment"
//                                 }
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//     }
// ];

const tools = [
    {
        "type": "function",
        "function": {
            "name": "sendActivity",
            "description": "Send botframework activity",
            "parameters": {
                "type": "object",
                "description": "botframework activity json",
                "properties": {},
                "additionalProperties": true
            }
        }
    }
];


export class ActivityGenerator implements ITeamsScenario {
    public accept(teamsBot: IScenarioBuilder) {
        teamsBot.registerTextCommand(/^genAI/i, async (context) => {

            // const systemPrompt = "You are AI assistant to help with generating bot framework activity json. You need to generate Microsoft Teams bot framework activity payload for a given request as a json. Produce the output in raw json.\n[EXAMPLE OUTPUT]\n{\n  \"type\": \"message\",\n  \"text\": \"Hello world\"\n}";
            //const systemPrompt = "You are an expert in microsoft bot framework activity schema for Teams channel. You can generate any bot framework activity based on the user query and send it back to the user using the sendActivity tool.";
            const systemPrompt = `You are a test bot to help generate test payloads of bot framework activity. You are an expert in microsoft bot framework activity schema for Teams channel. Your task is to converse with the user using bot framework activity based on the user query and send it back to the user using the sendActivity tool.
            You can generate bot framework activities for plain text, all types of cards including adaptive card.
            GUIDELINES
            1. Use quotes about gratitude or compassion to fill any text
            2. Use the following url for images: https://adaptivecards.io/content/cats/3.png
            3. Use wikipedia or any famous websites for urls to open
            4. Always use the function sendActivity to respond to the user
            `;

            const prompt = [
                {
                    "role": "system",
                    "content": systemPrompt
                },
                {
                    "role": "user",
                    "content": context.activity.text.substring("genAI".length + 1)
                }
            ]
            try {
                const aiResult = await callLLM(prompt, tools);
                await context.sendActivity(`AI result\n${JSON.stringify(aiResult)}`);

                const tool_calls = aiResult.tool_calls;
                if (tool_calls) {
                    for (const tool_call of tool_calls) {
                        const fnName = tool_call.function.name;
                        const fnArgs = JSON.parse(tool_call.function.arguments);
                        if (fnName === "sendActivity") {
                            if (typeof fnArgs === "object" && (!isEmpty(fnArgs.tex) || !isEmpty(fnArgs.attachments))) {
                                await context.sendActivity(fnArgs);
                            }
                            else {
                                console.log("skipping activity send");
                            }
                            // await sendActivity(context, {
                            //     type: "message",
                            //     text: fnArgs.text,
                            //     attachments: fnArgs.attachments
                            // })
                        }
                    }
                } else {
                    const activity = JSON.parse(aiResult.content);
                    await context.sendActivity(activity);
                }
            }
            catch (error) {
                console.log(error);
                await context.sendActivity(`Activity error: ${JSON.stringify(error)}`);
            }
        });
    }
}

const sendActivity = async (context, activity) => {
    console.log(`sending activity ${JSON.stringify(activity)}`)
    await context.sendActivity(activity);
}