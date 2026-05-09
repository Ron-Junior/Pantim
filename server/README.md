# Pantim Server

Backend do jogo Pantim - Um clone de Fictionary/Jackbox para rede local (LAN).

## 📋 Requisitos

- Node.js v18+ (v22.21.1 ou superior recomendado)
- npm ou yarn

## 🚀 Começando

### 1. Instalar Dependências

```bash
npm install
```

### 2. Desenvolvimento

Para rodar o servidor em modo de desenvolvimento com hot-reload:

```bash
npm run dev
```

O servidor iniciará em `http://0.0.0.0:3000` (aceita conexões de qualquer interface de rede).

### 3. Build

Para compilar TypeScript:

```bash
npm run build
```

### 4. Produção

Para rodar o servidor compilado:

```bash
npm start
```

## 📁 Estrutura

```
server/
├── src/
│   └── index.ts          # Arquivo principal do servidor
├── dist/                 # Código compilado (gerado após build)
├── package.json          # Dependências e scripts
├── tsconfig.json         # Configuração TypeScript
└── .gitignore
```

## 🔌 Endpoints

- **GET `/health`** - Health check do servidor
  ```bash
  curl http://localhost:3000/health
  ```

## 🎯 Socket.io Events

### Cliente → Servidor

- **`identify`** - Cliente se identifica como Host ou Player
  ```typescript
  socket.emit('identify', { 
    profile: 'host' | 'player',
    playerId?: string,
    playerName?: string
  })
  ```

- **`message`** - Enviar mensagem genérica
  ```typescript
  socket.emit('message', { /* dados */ })
  ```

### Servidor → Cliente

- **`playerJoined`** - Um novo jogador conectou
- **`playerLeft`** - Um jogador desconectou
- **`message`** - Mensagem recebida

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do servidor:

```env
PORT=3000
NODE_ENV=development
```

### CORS

O servidor está configurado para aceitar requisições de qualquer origem (`*`). Para produção, atualize a configuração em `src/index.ts`.

## 🧪 Testing

Teste a conexão do servidor:

```bash
# Health check
curl http://localhost:3000/health

# Teste com wscat (instale globalmente: npm install -g wscat)
wscat -c ws://localhost:3000/socket.io/?EIO=4&transport=websocket
```

## 📝 Tecnologias

- **Express** - Framework HTTP
- **Socket.io** - Comunicação em tempo real
- **TypeScript** - Linguagem tipada
- **CORS** - Cross-Origin Resource Sharing

## 🔗 Tipos Compartilhados

Os tipos compartilhados entre servidor e cliente estão em `../shared/types.ts`.

## 📚 Referências

- [Express Docs](https://expressjs.com/)
- [Socket.io Docs](https://socket.io/docs/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
