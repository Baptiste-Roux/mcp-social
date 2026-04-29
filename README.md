# mcp-social

Serveur MCP (Model Context Protocol) en stdio qui permet à Claude de benchmarker des comptes TikTok et Instagram publics via l'API ScrapeCreators.

## Outils disponibles

- `get_tiktok_profile` — profil public TikTok (bio, followers, likes, etc.)
- `get_tiktok_posts` — dernières vidéos TikTok avec métriques
- `get_instagram_profile` — profil public Instagram
- `get_instagram_posts` — derniers posts Instagram avec métriques

## Installation

```bash
# 1. Cloner / se placer dans le dossier
cd mcp-social

# 2. Configurer la clé API
cp .env.example .env
# Éditer .env et renseigner SCRAPECREATORS_API_KEY

# 3. Installer les dépendances
npm install

# 4. Compiler
npm run build
```

## Lancement manuel

```bash
SCRAPECREATORS_API_KEY=your_key node dist/index.js
```

## Connexion à Claude Desktop

Éditer `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) ou `%APPDATA%\Claude\claude_desktop_config.json` (Windows) :

```json
{
  "mcpServers": {
    "mcp-social": {
      "command": "node",
      "args": ["/chemin/absolu/vers/mcp-social/dist/index.js"],
      "env": {
        "SCRAPECREATORS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Redémarrer Claude Desktop. Les quatre outils apparaissent automatiquement dans l'interface.
