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


## Simulador de rentabilidade (0.2.0)

Endpoint `POST /api/simulation` recebe JSON com `hashrate`, `powerWatts`, `electricityBrlKwh` e `grossRevenueBrlDay`. Campos opcionais: `poolFeePercent`, `uptimePercent` e `hardwareCostBrl`. A receita bruta é uma estimativa fornecida pelo operador; o painel desconta energia, taxa da pool e indisponibilidade. Não é previsão garantida de lucro.

## Integração de workers (telemetria somente)

1. Gere um segredo forte no Termux: `openssl rand -hex 32`.
2. Cadastre esse valor no Render como variável de ambiente `WORKER_API_TOKEN` e aguarde o deploy.
3. Em cada equipamento próprio/autorizado, configure as variáveis de `worker/.env.example` (use o mesmo token em ambiente protegido).
4. Execute com Node.js 20+: `node worker/agent.js`.

O agente envia heartbeat para `POST /api/workers/heartbeat` a cada 30 segundos. O painel marca como sem sinal workers que não atualizam há 90 segundos. Endpoint `GET /api/workers` lista a telemetria. O token é obrigatório e comparado em tempo constante.

**Limite desta integração:** o agente transmite somente métricas declaradas por variáveis de ambiente; ele não detecta automaticamente hardware, não inicia/paralisa mineradores, não acessa carteiras e não executa comandos remotos. O registro de workers fica em memória e pode ser reiniciado quando o serviço Render reiniciar ou suspender. Use apenas workers que você controla e provedores que permitam mineração expressamente.
