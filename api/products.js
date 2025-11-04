export default function handler(req, res) {
  // ----------------------------------------------------
  // Implementação do: GET /products
  // (Listar e pesquisar produtos)
  // ----------------------------------------------------
  if (req.method === 'GET') {
    // Em um app real, você leria os query params (req.query)
    // e consultaria um banco de dados.
    // Aqui, vamos apenas simular a resposta de sucesso.

    const mockProductPage = {
      data: [
        {
          productId: "prd_8a2f1b",
          name: "Ração Premium 10kg",
          price: 129.9,
          currency: "BRL",
          category: "PetShop",
          status: "ACTIVE",
          updatedAt: "2025-10-23T19:00:00Z"
        }
      ],
      pageInfo: {
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1
      }
    };

    // Define o header X-Total-Count, como na sua especificação
    res.setHeader('X-Total-Count', 1);
    
    // Responde com 200 OK e o JSON da página de produtos
    return res.status(200).json(mockProductPage);
  }

  // ----------------------------------------------------
  // Implementação do: POST /products
  // (Criar produto)
  // ----------------------------------------------------
  if (req.method === 'POST') {
    // O 'req.body' já vem "parseado" pela Vercel como JSON
    const input = req.body;

    // Validação básica (em um app real, use Zod ou Joi)
    // O 'name' é obrigatório no seu schema CreateProductInput
    if (!input.name || !input.price) {
      return res.status(400).json({
        code: "BAD_REQUEST",
        message: "Campos 'name' e 'price' são obrigatórios."
      });
    }

    // Em um app real, você salvaria 'input' no banco de dados.
    // Aqui, vamos simular o produto criado.

    const novoProduto = {
      productId: `prd_${Math.random().toString(36).substring(2, 9)}`, // ID aleatório
      name: input.name,
      price: input.price,
      currency: input.currency,
      category: input.category,
      status: input.status,
      updatedAt: new Date().toISOString() // Data/hora atual
    };

    // Define o header Location, como na sua especificação
    res.setHeader('Location', `/products/${novoProduto.productId}`);
    
    // Responde com 201 Created e o objeto do produto criado
    return res.status(201).json(novoProduto);
  }

  // ----------------------------------------------------
  // Se for qualquer outro método (PUT, PATCH, DELETE)
  // ----------------------------------------------------
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({
    code: "METHOD_NOT_ALLOWED",
    message: `Método ${req.method} não permitido nesta rota.`
  });
}