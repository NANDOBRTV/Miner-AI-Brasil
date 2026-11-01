# Miner AI Brasil

Painel gratuito de monitoramento de mercado e análise inicial de mineração multi-moeda.

## Estado da versão 0.1.0

- Dashboard responsivo em português.
- API HTTP com `/health`, `/api/status` e `/api/market`.
- Cotações BRL e variação de 24 horas para BTC, LTC, DOGE, XMR e ETC via CoinGecko.
- Módulo de cálculo de rentabilidade que exige dados reais do equipamento.
- Mineração desativada por padrão; nenhum worker é iniciado.

## Executar localmente

Requer Node.js 20 ou superior.

```bash
npm install
npm run check
npm start
```

Abra `http://localhost:3000`.

## Deploy no Render

O arquivo `render.yaml` descreve um serviço web Node. No Render, crie um novo Blueprint apontando para este repositório e confirme o serviço `miner-ai-brasil`. O plano gratuito pode suspender serviços e não é apropriado para mineração contínua.

## Segurança e limites

- Não informe seed phrase, chave privada ou senha de carteira.
- Esta aplicação não executa mineradores nem usa recursos de hospedagem para mineração.
- Só configure workers em equipamentos próprios ou provedores que permitam mineração expressamente.
- Antes de qualquer decisão, considere hashrate real, consumo, tarifa elétrica, dificuldade, recompensa, taxa da pool e volatilidade.
- A API pública de preços pode aplicar limites de requisição; o painel mostra indisponibilidade sem inventar valores.

## Próximas etapas

1. Testar deploy e endpoints.
2. Adicionar entrada segura dos dados de hardware e tarifa elétrica.
3. Criar simulação comparativa de custo e receita por moeda.
4. Integrar workers externos autorizados somente após definir limites de custo, potência e desligamento automático.
