export default function handler(req, res) {
  // 1. Pegar o ID do produto da URL
  // O nome 'productId' vem do nome do arquivo: [productId].js
  const { productId } = req.query;

  // ----------------------------------------------------
  // Implementação do: PUT /products/{productId}
  // (Atualização completa/substituição)
  // ----------------------------------------------------
  if (req.method === 'PUT') {
    const input = req.body;

    // Validação básica (o schema UpdateProductInput é obrigatório)
    if (!input.name || !input.price || !input.status) {
      return res.status(400).json({
        code: "BAD_REQUEST",
        message: "Para PUT, todos os campos são obrigatórios."
      });
    }

    // Simula a atualização no banco.
    // Retorna o produto com os dados substituídos.
    const produtoAtualizado = {
      productId: productId,
      name: input.name,
      price: input.price,
      currency: input.currency,
      category: input.category,
      status: input.status,
      updatedAt: new Date().toISOString()
    };
    
    // Responde 200 OK com o produto atualizado
    return res.status(200).json(produtoAtualizado);
  }

  // ----------------------------------------------------
  // Implementação do: PATCH /products/{productId}
  // (Atualização parcial)
  // ----------------------------------------------------
  if (req.method === 'PATCH') {
    const partialInput = req.body; // Ex: { "price": 119.9 }

    // Simula a busca do produto "antigo" no banco
    const produtoAntigo = {
      productId: productId,
      name: "Ração Premium 10kg",
      price: 129.9,
      currency: "BRL",
      category: "PetShop",
      status: "ACTIVE",
      updatedAt: "2025-10-23T19:00:00Z"
    };

    // Aplica as mudanças parciais (simulação de um 'merge')
    const produtoAtualizado = {
      ...produtoAntigo, // Pega todos os campos antigos
      ...partialInput,  // Sobrescreve os campos que vieram no body
      updatedAt: new Date().toISOString() // Atualiza a data
    };

    // Responde 200 OK com o produto atualizado
    return res.status(200).json(produtoAtualizado);
  }

  // ----------------------------------------------------
  // Implementação do: DELETE /products/{productId}
  // (Excluir produto)
  // ----------------------------------------------------
  if (req.method === 'DELETE') {
    // Em um app real, você executaria: DELETE FROM products WHERE id = productId

    // Simula a remoção bem-sucedida.
    // A especificação pede 204 No Content (sem corpo)
    return res.status(204).end(); // .end() envia a resposta sem corpo
  }

  // ----------------------------------------------------
  // Se for qualquer outro método (GET, POST)
  // ----------------------------------------------------
  res.setHeader('Allow', ['PUT', 'PATCH', 'DELETE']);
  return res.status(405).json({
    code: "METHOD_NOT_ALLOWED",
    message: `Método ${req.method} não permitido nesta rota.`
  });
}