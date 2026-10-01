
# Taslim Ecole Mobile

Application Expo React Native connectee a une API Django. Ce depot contient le client mobile; le serveur Django doit etre demarre separement.

## Configuration locale

1. Installer Node.js (version indiquee dans `package.json`) et les dependances: `npm install`.
2. Copier `.env.example` vers `.env` et remplacer l'adresse par celle du serveur Django.
3. Demarrer l'application: `npx expo start`.

`EXPO_PUBLIC_API_URL` doit pointer vers la racine API, avec le prefixe `/api` si Django l'utilise. Exemples:

- Emulateur Android: `http://10.0.2.2:8000/api`
- Simulateur iOS: `http://127.0.0.1:8000/api`
- Telephone physique: `http://ADRESSE_IP_DU_PC:8000/api` (telephone et ordinateur sur le meme reseau)
- Production: une URL HTTPS publique.

Pour rendre Django accessible sur le reseau local, demarrer le serveur avec `python manage.py runserver 0.0.0.0:8000` et autoriser l'adresse/IP dans `ALLOWED_HOSTS`. Pour Expo Web uniquement, configurer CORS dans Django avec l'origine web Expo; les requetes natives Android/iOS ne sont pas soumises a la politique CORS du navigateur. Ne pas committer le fichier `.env`.

## Contrat de l'API Django

Les chemins ci-dessous sont relatifs a `EXPO_PUBLIC_API_URL`. Les endpoints proteges utilisent `Authorization: Bearer <access_token>`.

- `POST /auth/login/`: JSON `{ "username": "...", "password": "..." }`; retourne `tokens.access`, `tokens.refresh` et un utilisateur dans `user`. Les champs `nom`, `prenom`, `email` et `role` sont utilisés par l'application.
- `POST /auth/register/`: les champs requis sont `username`, `nom`, `prenom`, `email`, `password` et `role` (`PARENT` ou `ENSEIGNANT`). `telephone` est facultatif. Pour un parent, envoyer `eleve: [{ "nom": "...", "prenom": "...", "classe": "..." }]`; pour un enseignant, envoyer `classe: [{ "classe": "...", "matiere": "..." }]` avec 1 à 3 matières distinctes.
- `POST /auth/password-reset/`: JSON `{ "email": "..." }`.
- `GET /students/`: eleves pour la direction et les enseignants.
- `GET /students/?classe=<nom>`: eleves d'une classe pour les formulaires et la liste enseignant.
- `GET /classes/options/`: classes sous forme d'une liste ou `{ "classes": [{ "id": 1, "nom": "..." }] }`.
- `GET /children/`: enfants associes au parent.
- `GET /parent/notes/`: notes et resultats du parent; le client accepte des collections `children`/`eleves` et notes mappees par identifiant d'enfant.
- `GET /parent/bulletins/` et `GET /parent/emplois-du-temps/`: documents associes au compte parent. Chaque document peut contenir `url`, `file`, `path` ou `href`; les URLs de media doivent etre accessibles par le telephone.
- `GET /messages/`: liste de messages/notifications.
- `GET /messages/contacts/`: tableau de contacts, ou objet `{ "contacts": [...] }`.
- `GET /messages/<contact_id>/`: tableau de messages de la conversation.
- `POST /messages/`: multipart avec `destinataire_id` et `contenu`.
- `POST /bulletins/scanner/`: multipart, champ `bulletins` repete pour chaque fichier.
- `POST /emplois-du-temps/scanner/`: multipart, champ `files` repete pour chaque fichier.
- `POST /devoirs/scanner/`: multipart, champ `devoirs` repete et champ `date`.
- `POST /absences/` et `POST /retards/`: tableau JSON d'entrees `{ "eleve_id": "...", "date": "YYYY-MM-DD", "minutes": 10, "motif": "..." }`.
- `GET /absences/`, `GET /retards/` et `GET /devoirs/`: collections utilisees dans l'historique enseignant.

Les listes peuvent etre renvoyees directement ou dans `results`/`data`. Les statistiques sont calculees depuis `/students/` ou `/children/` et leurs champs `attendance`/`attendance_rate` et `average`/`grade_average`. Les ecrans affichent une erreur explicite si Django est indisponible; ils ne remplacent plus les reponses du serveur par des donnees fictives.
