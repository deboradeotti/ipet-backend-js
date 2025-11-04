import { sql } from '@vercel/postgres';

// Handler agora é 'async'
export default async function handler(req, res) {
  const { productId } = req.query; // Pega o ID da URL

  // ----------------------------------------------------
  // PUT /products/{productId} (Atualização completa)
  // ----------------------------------------------------
  if (req.method === 'PUT') {
    try {
      const input = req.body;

      // Validação (PUT exige todos os campos)
      if (!input.name || !input.price || !input.status || !input.currency || !input.category) {
        return res.status(400).json({
          code: "BAD_REQUEST",
          message: "Para PUT, todos os campos são obrigatórios."
        });
      }

      // 'RETURNING *' é um comando do Postgres que atualiza E retorna a linha atualizada
      const { rows } = await sql`
        UPDATE products
        SET
          "name" = ${input.name},
          "price" = ${input.price},
          "currency" = ${input.currency},
          "category" = ${input.category},
          "status" = ${input.status},
          "updatedAt" = NOW()
        WHERE "productId" = ${productId}
        RETURNING *;
      `;

      // Se 'rows' está vazio, o produto não foi encontrado
      if (rows.length === 0) {
        return res.status(404).json({ code: "NOT_FOUND", message: "Produto não encontrado." });
      }
      
      return res.status(200).json(rows[0]); // Retorna o produto atualizado

    } catch (error) {
      console.error(error);
      return res.status(500).json({ code: "DB_ERROR", message: "Erro ao atualizar no banco de dados." });
    }
  }

  // ----------------------------------------------------
  // PATCH /products/{productId} (Atualização parcial)
  // ----------------------------------------------------
  if (req.method === 'PATCH') {
    try {
      const partialInput = req.body;

      // COALESCE é uma função SQL que diz: "use o primeiro valor que não for nulo".
      // Ex: COALESCE(${partialInput.name}, "name") significa: 
      // "use o novo nome se ele foi enviado, senão, mantenha o valor antigo que já está no banco".
      const { rows } = await sql`
        UPDATE products
        SET
          "name" = COALESCE(${partialInput.name}, "name"),
          "price" = COALESCE(${partialInput.price}, "price"),
          "currency" = COALESCE(${partialInput.currency}, "currency"),
          "category" = COALESCE(${partialInput.category}, "category"),
          "status" = COALESCE(${partialInput.status}, "status"),
          "updatedAt" = NOW()
        WHERE "productId" = ${productId}
        RETURNING *;
      `;
      
      if (rows.length === 0) {
        return res.status(404).json({ code: "NOT_FOUND", message: "Produto não encontrado." });
      }

      return res.status(200).json(rows[0]); // Retorna o produto atualizado

    } catch (error) {
      console.error(error);
      return res.status(500).json({ code: "DB_ERROR", message: "Erro ao atualizar no banco de dados." });
    }
  }

  // ----------------------------------------------------
  // DELETE /products/{productId} (Excluir)
  // ----------------------------------------------------
  if (req.method === 'DELETE') {
    try {
      // 'RETURNING *' aqui serve para sabermos se algo foi realmente deletado
      const { rows } = await sql`
        DELETE FROM products
        WHERE "productId" = ${productId}
        RETURNING *;
      `;

      if (rows.length === 0) {
        return res.status(404).json({ code: "NOT_FOUND", message: "Produto não encontrado." });
      }

      // Sucesso, retorna 204 No Content
      return res.status(204).end(); 

    } catch (error) {
      console.error(error);
      return res.status(500).json({ code: "DB_ERROR", message: "Erro ao deletar do banco de dados." });
    }
  }

  // ----------------------------------------------------
  // Se for qualquer outro método
  // ----------------------------------------------------
  res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE']);
  return res.status(405).json({
    code: "METHOD_NOT_ALLOWED",
    message: `Método ${req.method} não permitido.`
  });
}