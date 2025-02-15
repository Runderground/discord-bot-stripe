import express from "express";
import { PaymentInfoEmbed } from "./embeds/payment-info";
import { ErrorEmbed } from "./embeds/error";
import stripeLib from "stripe";
import {
  Client,
  GatewayIntentBits,
  RoleResolvable,
  TextChannel,
} from "discord.js";

const stripe = new stripeLib(process.env.STRIPE_SECRET_KEY as string);
const app = express();
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

app.get("/", (req, res) => {
  res.send("Serviço da Stripe ativo!");
})

/* 

#### Armazenamento local para armazenar os IDs dos mensagens de pagamento para trata-los posteriormente

## Estou utilizando Cache em Memória do Express.

## Qualquer problema, recomendavel SQLite ou PostgreSQL.

## Problema previsivel: Caso o server reinicie, o cache é perdido. ( Recomendavel armazenar as mensagens apenas para apaga-las após pagamento ou expiração da requisição. )

*/

app.locals.store = new Map<string, string>();


app.post("/cache/set", express.json({ type: "application/json" }), async (req, res) => {
  try {
    await app.locals.store.set(req.body.discordId, req.body.messageId);
    res.status(200).json({success: "Valor salvo."})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: "Ocorreu algum erro inesperado..."})
  }
})

app.post("/cache/get", express.json({ type: "application/json" }), async (req, res) => {
  try {
    const messageId = await app.locals.store.get(req.body.discordId);
    if(!messageId) {
      res.json({error: "Não foi possível encontrar o ID da mensagem."})
      return
    }
    res.status(200).json(messageId)
  } catch(error) {
    console.error(error);
    res.status(500).json({error: "Ocorreu algum erro inesperado..."})
  }
})

app.delete("/cache/delete", express.json({ type: "application/json" }), async (req, res) => {
  try {
    app.locals.store.delete(req.body.discordId);
    res.status(200).json({success: "Valor deletado."})
  } catch(error) {
    console.error(error);
    res.status(500).json({error: "Ocorreu algum erro inesperado..."})
  }
})

async function deletePurchaseMessage(client: Client, userId: string, situation: string) {
    const messageGet = await fetch(`${process.env.API_URL}/cache/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ discordId: userId }),
    })

  const messageId = await messageGet.json()

  if (!messageId) return;
  
  console.log(messageId)

  try {
    const user = await client.users.fetch(userId);
    const dmChannel = await user.createDM();

    const message = await dmChannel.messages.fetch(messageId);
    await message.delete();
    const messageDelete = await fetch(`${process.env.API_URL}/cache/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ discordId: userId }),
    })

    const msg_res_delete = await messageDelete.json()
    console.log(msg_res_delete)
    
    switch(situation) {
      case 'success':
        await dmChannel.send({embeds: [PaymentInfoEmbed.setTitle('✅ Pagamento realizado com Sucesso!').setDescription('Muito obrigado por se juntar a nós, agradecemos a preferência! 😉\n\n Aproveite todo o conteúdo disponível no nosso servidor.').setFooter({ text: 'Qualquer problema, contate o suporte!' })]});
      break;
        
      case 'expired':
        await dmChannel.send({embeds: [ErrorEmbed.setTitle('❌ Pagamento Expirado!').setDescription('Você demorou muito para realizar o pagamento, tente gerar outro link pelo servidor.').setFooter({ text: 'Qualquer problema, contate o suporte!' })]});
      break;
    }
  } catch(error) {
    console.error(error);
  }
}


/* 

### Webhooks e criação de link de pagamento da Stripe

*/

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    console.log("Webhook received");

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.ENDPOINT_SECRET as string,
      );
    } catch (err: any) {
      console.log(err);
      return;
    }

    console.log("[ WEBHOOK EVENT ]", event.type);

    const channel = (await client.channels.fetch(
      "1338230962739220560",
    )) as TextChannel;

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        const userId = session.metadata?.userId as string;
        const username = session.metadata?.username as string;
        const email = session.customer_details?.email ?? session.customer_email;
        const stripeId = session.customer as string;

        if(stripeId) {
          try {
            await stripe.customers.update(stripeId, {
              metadata: {
                userId,
                username,
                email
              },
            });

            console.log(`Metadados atualizados para o cliente ${stripeId}`)
          } catch(error) {
            console.error('Erro ao atualizar metadados do cliente:', error);
          }
        }

        if (!channel) {
          console.error("Canal inexistente");
        }

        await channel.send({
          embeds: [
            PaymentInfoEmbed.setDescription(
              `**Usuário:** ${username}\n**ID:** ${userId}\n**Email:** ${email}`,
            ),
          ],
        });

        await deletePurchaseMessage(client, userId, 'success');

        if (userId) {
          try {
            const guild = await client.guilds.fetch(
              process.env.GUILD_ID as string,
            );
            const member = await guild.members.fetch(userId);
            const role = await guild.roles.fetch(process.env.ROLE_ID as string);

            await member.roles.add(role as RoleResolvable);
            console.log(
              `Cargo ${role?.name} foi adicionado com sucesso para ${member.user.tag}`,
            );
          } catch (error) {
            console.error(`Error adding role to user: ${error}`);
          }
        }
        break;

      case "customer.subscription.deleted":
        const session_deleted = event.data.object;
        console.log(session_deleted)
        let userId_deleted;
        let username_deleted;
        let email_deleted;
        const stripeId_deleted = session_deleted.customer as string;

        if(stripeId_deleted) {
          try {
            const cliente = await stripe.customers.retrieve(stripeId_deleted) as stripeLib.Customer;
            userId_deleted = cliente.metadata?.userId;
            username_deleted = cliente.metadata?.username;
            email_deleted = cliente.metadata?.email;
            console.log("Acesso ao metadados do cliente realizado com sucesso!")
          } catch(error) {
            console.error(error)
          }
        }

        if(!userId_deleted) {
          console.warn("Usuário sem discordId na metadata.")
        }

        if (!channel) {
          console.error("Canal inexistente");
        }

        await channel.send({
          embeds: [
            ErrorEmbed.setDescription(
              `**Usuário:** ${username_deleted}\n**ID:** ${userId_deleted}\n**Email:** ${email_deleted}\n**ID da Stripe:** ${stripeId_deleted}`
            ).setTitle('❌ Cancelamento de Assinatura')
          ]
        });
        
        if (userId_deleted) {
          try {
            const guild = await client.guilds.fetch(
              process.env.GUILD_ID as string,
            );
            const member = await guild.members.fetch(userId_deleted);
            const role = await guild.roles.fetch(process.env.ROLE_ID as string);

            await member.roles.remove(role as RoleResolvable);
            console.log(
              `Cargo ${role?.name} foi removido com sucesso para ${member.user.tag}`,
            );
          } catch (error) {
            console.error(`Error removing role from user: ${error}`);
          }
        }
        break;

      case 'checkout.session.expired':
        const session_expired = event.data.object;
        const userId_expired = session_expired.metadata?.userId as string;

        await deletePurchaseMessage(client, userId_expired, 'expired');
      break
        
    }

    res.json({ received: true });
  },
);

app.post(
  "/create-checkout-session",
  express.json({ type: "application/json" }),
  async (req, res) => {
    const { discordId, username } = req.body;
    if (!discordId) {
      res.status(400).json("Missing discordId in request body");
      return;
    }

    const session_check = await fetch(`${process.env.API_URL}/cache/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ discordId }),
    })
    const session_check_res = await session_check.json()
    
    if(!session_check_res.error) {
      res.json({session: 'exists'})
      return;
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRODUTO,
          quantity: 1,
        },
      ],
      success_url: `https://discord.com/app`,
      cancel_url: `https://discord.com/app`,
      metadata: {
        userId: discordId,
        username,
      },
      expires_at: Math.floor(Date.now() / 1000) + 1800,
    });

    res.json({ url: session.url });
  },
);

app.listen(process.env.PORT ?? 3000, () => console.log(`Serviço da Stripe rodando na porta ${process.env.PORT ?? 3000}`));

client.login(process.env.DISCORD_TOKEN);


