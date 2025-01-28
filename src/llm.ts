const endpoint = process.env["AZUE_AI_ENDPOINT"];
const azureApiKey = process.env["AZURE_API_KEY"];
const axios = require("axios");

axios.interceptors.response.use(
    (response) => {
        console.log('Full response:', response);
        return response;
    },
    (error) => {
        console.error('Error response:', error);
        return Promise.reject(error);
    }
);

export const callLLM = async (content, tools) => {
    const body = {
        messages: content,
        temperature: 0.7,
        top_p: .95,
        tools: tools,
        tool_choice: 'auto',
        model: 'gpt-4o'
    };
    const headers = {
        "api-key": azureApiKey,
        "Content-Type": "application/json",
        "Content-Length": JSON.stringify(body).length,
    };
    const result = await axios.post(endpoint, body, {
        headers
    })
    const json = result.data.choices[0].message;
    console.log(`Result: \n\n ${JSON.stringify(json)}`)
    return json;
}