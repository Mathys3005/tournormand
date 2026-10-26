# Tour de Normandie

Jeu de plateau multijoueur façon Business Tour, en web mobile, avec des villes normandes
(Pacy-sur-Eure, Giverny, Vernon, Évreux, Deauville, Rouen…).

- 32 cases, 8 groupes de couleur, 4 stations balnéaires (Étretat, Cabourg, Mont-Saint-Michel, Omaha Beach)
- Achat avec 0 à 3 maisons, puis hôtel, puis monument
- **Rachat** de la ville d'un adversaire au double de sa valeur (sauf monument)
- Championnat (loyer ×2, jusqu'à ×8), Aéroport, Île Tatihou, cartes Chance, impôts, contrôle des dés
- Victoire immédiate : triple monopole, monopole de côte ou monopole balnéaire ; sinon dernier survivant
- Connexion par **pseudo autorisé** (table `whitelist` en base) + code secret choisi à la première connexion
- Temps réel par WebSocket, le serveur applique les règles (impossible de tricher depuis le navigateur)
- Mode « un seul téléphone » sans connexion

## Pile

- `shared/engine.js` : moteur de jeu pur, utilisé par le serveur et le client
- `server/` : Node 20, Express, WebSocket (`ws`), Postgres (`pg`)
- `client/` : React 18 + Vite

## Déploiement Render + Neon

1. **Neon** : crée un projet sur https://neon.tech, puis copie la *connection string*
   (`postgresql://…neon.tech/neondb?sslmode=require`).
2. **Render** : New → **Blueprint** → choisis ce dépôt. Render lit `render.yaml`.
   Colle la connection string Neon dans `DATABASE_URL` quand Render la demande.
3. Au premier démarrage, le serveur crée les tables et ajoute les pseudos
   `nanolepa`, `mathys27`, `pierre27` (variable `WHITELIST`).
4. Chaque joueur ouvre l'URL Render, touche son pseudo et choisit son code secret.

`mathys27` est administrateur (variable `ADMIN_PSEUDOS`) : depuis l'accueil, il peut ajouter ou retirer
des pseudos et effacer le code d'un joueur qui l'a oublié.

### Garder le service gratuit éveillé

Render endort un service gratuit après 15 minutes sans visite. Deux mécanismes l'en empêchent :

- **Auto-ping** : le serveur appelle sa propre URL publique (`RENDER_EXTERNAL_URL`, fournie par Render)
  toutes les 10 minutes. Désactivable avec `KEEPALIVE=off`.
- **Cron GitHub Actions** (`.github/workflows/keepalive.yml`) : ping toutes les 10 minutes, utile si le
  service redémarre. Ajoute la variable de dépôt `RENDER_URL` (ex. `https://tournormand.onrender.com`)
  dans *Settings → Secrets and variables → Actions → Variables*.

Le plan gratuit donne 750 heures par mois : un seul service allumé en permanence (~744 h) tient dedans.

## Développement local

```bash
npm install
DATABASE_URL=postgres://user:pass@localhost:5432/tdn npm run dev:server   # port 3000
npm run dev:client                                                         # Vite, proxy vers 3000
npm test                                                                   # 1000 parties simulées
```

## Base de données

| Table       | Rôle                                               |
|-------------|----------------------------------------------------|
| `whitelist` | pseudos autorisés + empreinte du code secret       |
| `sessions`  | jetons de connexion                                |
| `games`     | état complet de chaque table (JSON)                |

Ajouter un pseudo à la main : `INSERT INTO whitelist (pseudo) VALUES ('nouveau');`
