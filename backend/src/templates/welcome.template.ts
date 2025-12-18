export function getWelcomeEmailTemplate(name: string, email: string, passwordDisplay: string): string {
  const colorPrimary = '#004aad'; // Exemplo de azul
  const colorBg = '#f4f4f4';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: ${colorBg}; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background-color: ${colorPrimary}; padding: 20px; text-align: center; color: #ffffff; }
    .content { padding: 30px; color: #333333; line-height: 1.6; }
    .box-info { background-color: #f0f7ff; border-left: 4px solid ${colorPrimary}; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { background-color: #eeeeee; padding: 15px; text-align: center; font-size: 12px; color: #777777; }
    .button { display: inline-block; background-color: ${colorPrimary}; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bem-vindo ao Sistema Pleno!</h1>
    </div>
    <div class="content">
      <p>Olá, <strong>${name}</strong>!</p>
      <p>O seu cadastro foi realizado com sucesso. Agora você já pode acessar a plataforma e conferir todas as funcionalidades.</p>
      
      <div class="box-info">
        <p><strong>Link de Acesso:</strong> <a href="https://app.plenoconsultoria.com" target="_blank">app.plenoconsultoria.com</a></p>
        <p><strong>Seu Login:</strong> ${email}</p>
        <p><strong>Sua Senha:</strong> ${passwordDisplay}</p>
      </div>

      <p>Recomendamos que você altere sua senha após o primeiro acesso.</p>
      
      <div style="text-align: center;">
        <a href="https://app.plenoconsultoria.com" class="button">Acessar Sistema Agora</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Pleno Consultoria. Todos os direitos reservados.</p>
      <p>Este é um e-mail automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>
  `;
}