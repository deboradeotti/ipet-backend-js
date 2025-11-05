import { GoogleGenerativeAI } from '@google/generative-ai';
import { promises as fs } from 'fs';
import path from 'path';

// Inicializa a API do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ code: "METHOD_NOT_ALLOWED", message: "Use POST" });
  }

  try {
    // Leitura do arquivo JSON (database)
    const jsonPath = path.join(process.cwd(), 'api', 'lib', 'db.json');
    const fileContents = await fs.readFile(jsonPath, 'utf8');
    const db = JSON.parse(fileContents); 

    const { especie, raca, porte, nome_pet } = req.body;

    if (!especie) {
      return res.status(400).json({
        code: "BAD_REQUEST",
        message: "O campo 'especie' (ex: 'cachorro' ou 'gato') é obrigatório."
      });
    }

    const productCandidates = db.products.filter(
      p => p.especie_alvo.toLowerCase() === especie.toLowerCase()
    );

    if (productCandidates.length === 0) {
      return res.status(200).json({ 
        recomendacao: {
          introducao: `Desculpe, ainda não temos produtos cadastrados para a espécie ${especie}.`,
          produtos_recomendados: []
        }
      });
    }

    const prompt = `
      Você é um especialista em produtos de petshop. 
      Um usuário quer uma recomendação de produtos para o pet dele.

      **Dados do Pet:**
      * Nome: ${nome_pet || 'Meu pet'}
      * Espécie: ${especie}
      * Raça: ${raca || 'Não informada'}
      * Porte: ${porte || 'Não informado'}

      **Lista de Produtos Disponíveis para esta espécie (em JSON):**
      ${JSON.stringify(productCandidates, null, 2)}

      **Tarefa:**
      1.  Analise o pet (espécie, raça, porte) e a lista de produtos.
      2.  Escolha os 3 produtos mais adequados da lista. Preste atenção na 'descricao' dos produtos (ex: "porte grande", "mordida forte").
      3.  Para CADA produto, escreva um 'motivo' curto e convincente (máx 1-2 frases), explicando por que ele é bom para *este pet específico*.
      4.  Formate sua resposta **APENAS como um JSON válido**. Não adicione nenhum texto antes ou depois do JSON (como \`\`\`json).

      **Formato JSON de Saída Esperado:**
      {
        "introducao": "Um texto amigável de saudação, como 'Olá! Para o ${nome_pet || 'seu pet'}, que é um ${raca || especie} de porte ${porte || 'desconhecido'}, analisei nossa lista e separei estes itens:'",
        "produtos_recomendados": [
          {
            "id": "c001",
            "nome": "Ração Cães Adultos Porte Grande Premium",
            "motivo": "Como o ${nome_pet || 'seu pet'} é de porte grande, esta ração com condroitina é perfeita para ajudar a proteger suas articulações."
          },
          {
            "id": "c003",
            "nome": "Bola de Borracha Resistente 'Indestrutível'",
            "motivo": "A raça ${raca || 'do seu pet'} tem uma mordida forte, e a descrição deste produto ('quase indestrutível') o torna ideal para ele."
          }
        ]
      }
    `;

    // Chamando a API do Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const iaTextResponse = response.text();

    // Parse da resposta da IA
    let jsonResponse;
    try {
      // A IA pode retornar o texto de JSON dentro de ```json ... ```
      // Vamos limpar isso antes de tentar o parse
      const cleanedText = iaTextResponse.replace(/^```json\s*/, '').replace(/```$/, '');
      jsonResponse = JSON.parse(cleanedText);

    } catch (parseError) {
      // Se a IA falhar e não retornar um JSON válido
      console.error('ERRO AO PARSEAR JSON DA IA:', parseError);
      console.error('Resposta de texto que recebemos:', iaTextResponse);
      return res.status(500).json({ 
        code: "IA_RESPONSE_INVALID", 
        message: "A IA retornou uma resposta em formato inválido.",
        raw_response: iaTextResponse
      });
    }

    //Retornando o objeto JSON parseado
    return res.status(200).json({ 
      pet_info: req.body,
      recomendacao: jsonResponse
    });

  } catch (error) {
    console.error('ERRO INTERNO NO HANDLER:', error); 
    return res.status(500).json({ 
      code: "INTERNAL_ERROR", 
      message: "Erro ao processar a recomendação.",
      error_details: error.message 
    });
  }
}