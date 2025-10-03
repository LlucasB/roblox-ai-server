const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Validação da Chave de API na inicialização
if (!process.env.GEMINI_API_KEY) {
  console.error("ERRO FATAL: A variável de ambiente GEMINI_API_KEY não está definida.");
  process.exit(1); // Encerra o servidor se a chave não for encontrada
}

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Endpoint para verificar se o servidor está online
app.get('/', (req, res) => {
  res.send('Servidor Proxy para Roblox-Gemini está no ar!');
});

app.post('/generate', async (req, res) => {
  console.log("Recebido um novo pedido em /generate...");

  try {
    const { prompt } = req.body;
    if (!prompt) {
      console.log("Erro: Prompt vazio recebido.");
      return res.status(400).json({ error: 'O prompt não pode estar vazio.' });
    }

    console.log("Prompt recebido:", prompt);

    // --- CORREÇÃO FINAL ---
    // O erro indica que a versão "v1beta" da API não encontra o "gemini-pro".
    // Vamos usar o "gemini-1.0-pro", um modelo mais antigo e com maior compatibilidade.
    // Se este também falhar, o problema está 100% na configuração da chave de API no Google.
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

    // Instrução aprimorada para a IA
    const fullPrompt = `
      Você é um assistente especialista em Roblox Luau.
      Gere uma resposta em JSON contendo uma lista de scripts baseada no seguinte pedido do usuário.
      O JSON deve ter uma chave "scripts", que é um array de objetos.
      Cada objeto deve ter as chaves "name" (string, nome do script), "type" (string, "Script", "LocalScript", ou "ModuleScript"), "path" (string, o caminho completo no Roblox, ex: "game/ServerScriptService"), e "source" (string, o código Luau).
      Não inclua nenhuma explicação fora do JSON. A resposta deve ser apenas o JSON puro.

      Pedido do usuário: "${prompt}"
    `;
    
    console.log("Enviando para a API do Gemini com o modelo 'gemini-1.0-pro'...");
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let text = response.text();
    
    console.log("Resposta recebida da IA (texto bruto):", text);

    // Limpa a resposta para garantir que seja apenas JSON
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Tenta fazer o parse do JSON
    const jsonResponse = JSON.parse(text);
    console.log("JSON parseado com sucesso. Enviando para o Roblox.");

    res.json(jsonResponse);

  } catch (error) {
    // Log do erro detalhado no console do servidor (Render)
    console.error("--- OCORREU UM ERRO INTERNO NO SERVIDOR ---");
    console.error("Mensagem de Erro:", error.message);
    console.error("Detalhes do Erro:", error);
    console.error("------------------------------------------");
    
    // Envia uma resposta de erro genérica para o Roblox
    res.status(500).json({ error: 'Ocorreu um erro no servidor ao processar o pedido.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

