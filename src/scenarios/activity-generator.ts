import { ITeamsScenario, IScenarioBuilder } from "../teams-bot";
import { callLLM } from "../llm";

const tools = [
    {
        "type": "function",
        "function": {
            "name": "sendActivity",
            "description": "Send botframework activity",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "The text content of the activity"
                    },
                    "attachments": {
                        "type": "array",
                        "description": "Card attachments to the message",
                        "items": {
                            "type": "object",
                            "properties": {
                                "content": {
                                    "type": "object",
                                    "additionalProperties": true,
                                    "description": "attachment content as json payload"
                                },
                                "contentType": {
                                    "type": "string",
                                    "description": "content type of the attachment"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
];

export class ActivityGenerator implements ITeamsScenario {
    public accept(teamsBot: IScenarioBuilder) {
        teamsBot.registerTextCommand(/^genAI/i, async (context) => {

            // const systemPrompt = "You are AI assistant to help with generating bot framework activity json. You need to generate Microsoft Teams bot framework activity payload for a given request as a json. Produce the output in raw json.\n[EXAMPLE OUTPUT]\n{\n  \"type\": \"message\",\n  \"text\": \"Hello world\"\n}";
            const systemPrompt = "You are AI assistant called genAI. You are a teams bot. You can generate and send bot framework activities to the user based user prompt. You can use the sendActivity tool to send an activity back to the user";

            const prompt = [
                {
                    "role": "system",
                    "content": systemPrompt
                },
                {
                    "role": "user",
                    "content": context.activity.text
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
                            await sendActivity(context, {
                                type: "message",
                                text: fnArgs.text,
                                attachments: fnArgs.attachments
                            })
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