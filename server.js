const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());

// A chave da API será pega das "Secrets" do Replit, não de um arquivo .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

const PORT = 3000;

// O "endpoint" que o Roblox irá chamar
app.post('/generate', async (req, res) => {
    const userPrompt = req.body.prompt;

    if (!userPrompt) {
        return res.status(400).json({ error: 'Nenhum prompt foi fornecido.' });
    }

    try {
        const fullPrompt = `
            Você é um assistente especialista em programação Luau para Roblox.
            Sua tarefa é gerar código baseado na solicitação do usuário.
            Responda SOMENTE com um objeto JSON válido. O JSON deve ter uma chave "scripts" que contém um array de objetos.
            Cada objeto no array deve ter as seguintes chaves:
            - "name": (string) O nome do script (ex: "SistemaDeVida").
            - "path": (string) O caminho completo no Explorer do Roblox onde o script deve ser criado (ex: "ServerScriptService" ou "StarterPlayer/StarterPlayerScripts").
            - "type": (string) O tipo de script, que pode ser "Script", "LocalScript", ou "ModuleScript".
            - "source": (string) O código Luau completo para o script.

            Exemplo de Resposta JSON:
            {
              "scripts": [
                {
                  "name": "GoldSystem",
                  "path": "ServerScriptService",
                  "type": "Script",
                  "source": "local Players = game:GetService(\\"Players\\")\\n\\nlocal function onPlayerAdded(player)\\n  local leaderstats = Instance.new(\\"Folder\\")\\n  leaderstats.Name = \\"leaderstats\\"\\n  leaderstats.Parent = player\\n\\n  local gold = Instance.new(\\"IntValue\\")\\n  gold.Name = \\"Gold\\"\\n  gold.Value = 0\\n  gold.Parent = leaderstats\\nend\\n\\nPlayers.PlayerAdded:Connect(onPlayerAdded)"
                }
              ]
            }

            Agora, atenda a seguinte solicitação do usuário: "${userPrompt}"
        `;
        
        const result = await model.generateContent(fullPrompt);
        const responseText = await result.response.text();
        
        const jsonResponse = JSON.parse(responseText);
        res.json(jsonResponse);

    } catch (error) {
        console.error("Erro ao gerar conteúdo:", error);
        res.status(500).json({ error: 'Falha ao processar a solicitação da IA.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor proxy online e rodando na porta ${PORT}`);
});
