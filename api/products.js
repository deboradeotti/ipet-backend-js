import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid'; // Para gerar IDs únicos

// Handler agora é 'async' para podermos usar 'await'
export default async function handler(req, res) {
  
  // ----------------------------------------------------
  // GET /products (Listar produtos do banco)
  // ----------------------------------------------------
  if (req.method === 'GET') {
    try {
      // Executa o SQL para selecionar todos os produtos
      const { rows } = await sql`SELECT * FROM products ORDER BY "updatedAt" DESC;`;
      
      // Monta a resposta no formato da sua especificação
      const productPage = {
        data: rows,
        pageInfo: {
          page: 1,
          pageSize: rows.length,
          totalItems: rows.length,
          totalPages: 1
          // Nota: Paginação real (com page/pageSize) é mais complexa
        }
      };

      res.setHeader('X-Total-Count', rows.length);
      return res.status(200).json(productPage);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ code: "DB_ERROR", message: "Erro ao consultar o banco de dados." });
    }
  }

  // ----------------------------------------------------
  // POST /products (Criar produto no banco)
  // ----------------------------------------------------
  if (req.method === 'POST') {
    try {
      const input = req.body;
      const newId = `prd_${uuidv4()}`; // Gera um ID real

      // Validação básica (baseada no seu schema CreateProductInput)
      if (!input.name || !input.price || !input.status) {
        return res.status(400).json({
          code: "BAD_REQUEST",
          message: "Campos 'name', 'price' e 'status' são obrigatórios."
        });
      }

      // Executa o SQL para inserir o novo produto
      await sql`
        INSERT INTO products ("productId", "name", "price", "currency", "category", "status", "updatedAt")
        VALUES (
          ${newId}, 
          ${input.name}, 
          ${input.price}, 
          ${input.currency}, 
          ${input.category}, 
          ${input.status}, 
          NOW()
        );
      `;
      
      // Busca o produto recém-criado para retornar no body (como pede o 201)
      const { rows } = await sql`SELECT * FROM products WHERE "productId" = ${newId};`;
      const novoProduto = rows[0];

      res.setHeader('Location', `/api/products/${novoProduto.productId}`);
      return res.status(201).json(novoProduto);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ code: "DB_ERROR", message: "Erro ao salvar no banco de dados." });
    }
  }

  // ----------------------------------------------------
  // Se for qualquer outro método
  // ----------------------------------------------------
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({
    code: "METHOD_NOT_ALLOWED",
    message: `Método ${req.method} não permitido.`
  });
}