# Bot Discord Cargo por Assinatura
## Feito por Rafael Bueno

### Um bot feito em Discord.js junto com a API da Stripe

<div>
  De começo, necessitamos criar as váriaveis ambientes (seja com dotenv( arquivo .env ) ou no próprio serviço de deploy caso tenha suporte!)
</div>

```nix
DISCORD_TOKEN="Token do seu BOT!"
GUILD_ID="ID do Servidor que você quer dar o cargo"
ROLE_ID="ID do Cargo que vai ser colocada após pagamento da assinatura"
CLIENT_ID="ID Do BOT"


STRIPE_WEBHOOK_SECRET="Key Publica da Stripe"
STRIPE_SECRET_KEY="Key Secreta da Stripe"
ENDPOINT_SECRET="Chave secreta do ENDPOINT que você configurou para receber as webhooks"
STRIPE_PRODUTO="Key Price que tem no produto"
API_URL="URL da API que você irar hospedar do arquivo stripe.js"
```

Lembre-se de hospedar primeiro e executar o stripe.js, depois você hospeda o BOT!