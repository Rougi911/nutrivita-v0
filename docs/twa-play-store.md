# Publier NutraLance sur le Play Store (TWA)

Objectif : une installation en un geste depuis le Play Store, **sans duplication de code**.
Le TWA (Trusted Web Activity) est une coquille Android qui ouvre `https://nutralance.fr`
en plein écran. Tout correctif déployé sur Render est actif immédiatement dans l'app
installée — aucune nouvelle version à soumettre, sauf changement d'icône, de nom ou de
permissions.

Les deux canaux coexistent : le site reste installable en PWA depuis le navigateur,
et la même URL est distribuée via le Play Store.

## Prérequis

| Élément | État | Qui |
|---|---|---|
| Domaine `nutralance.fr` pointé sur le frontend Render | à faire | Rougi (DNS + Render → Custom Domain) |
| Compte Google Play Console (25 $ une fois) | à faire | Rougi |
| `package_name` Android | `fr.nutralance.app` (fixé ici) | — |
| `/.well-known/assetlinks.json` servi sur le domaine | fichier en place, **empreinte à remplir** | Claude puis Rougi |
| Icône 512×512 + bannière 1024×500 + 2 captures min. | à produire | Rougi / Claude |

## Étapes

1. **Domaine.** Render → service `nutrivita-v0` → Custom Domain → `nutralance.fr` et
   `www.nutralance.fr`. Chez le registrar : `A`/`ALIAS` vers la cible indiquée par Render,
   `CNAME` pour `www`. Attendre le certificat TLS.
2. **Vérifier** : `https://nutralance.fr/manifest.json` répond 200, et l'app se charge.
3. **Générer le paquet.** Le plus simple sans SDK Android local : [PWABuilder](https://www.pwabuilder.com)
   → saisir `https://nutralance.fr` → Package for stores → Android → options :
   - Package ID : `fr.nutralance.app`
   - App name : `NutraLance`
   - Launcher name : `NutraLance`
   - Display mode : `standalone`
   - Signing key : *laisser Google gérer la signature* (Play App Signing)
   Alternative en ligne de commande : `npx @bubblewrap/cli init --manifest https://nutralance.fr/manifest.json`
   (nécessite JDK 17 + Android SDK).
4. **Créer l'app dans la Play Console**, téléverser l'AAB, remplir la fiche.
5. **Récupérer l'empreinte SHA-256** : Play Console → Configuration → Intégrité de l'app →
   Certificat de signature d'app → copier `SHA-256`.
6. **Remplacer** `REMPLACER_PAR_EMPREINTE_SHA256_DE_LA_CLE_DE_SIGNATURE_PLAY` dans
   `public/.well-known/assetlinks.json`, committer, déployer.
7. **Contrôler le lien** : `https://nutralance.fr/.well-known/assetlinks.json` doit renvoyer
   200 en `application/json`. Si le lien n'est pas vérifié, l'app s'ouvre avec une barre
   d'adresse — c'est le symptôme d'un assetlinks absent ou d'une empreinte erronée.
8. **Test interne** (jusqu'à 100 testeurs) avant production.

## Points de vigilance

- **Deux icônes possibles** : un utilisateur ayant déjà installé la PWA depuis Chrome puis
  installant la version Play se retrouve avec deux entrées. Prévoir une communication.
- **Abonnements** : vendre un abonnement numérique dans une app Play engage les règles de
  facturation de Google. À vérifier avant publication si Stripe reste le moyen de paiement —
  ce point conditionne le modèle économique, il se tranche avant la mise en production, pas après.
- **Politique de confidentialité obligatoire** : la fiche Play exige une URL publique — c'est
  le P0 n°31 de l'audit (liens en `#` actuellement).
- **Formulaire « Sécurité des données »** de la Play Console : déclarer photo, micro, données
  de santé et leur usage. Doit correspondre à la politique publiée.
- **Nom de l'app** : `NutraLance` partout (manifest, fiche Play, domaine). Le nom NutriVita
  subsiste dans les dépôts et les maquettes — à aligner progressivement, sans bloquer la sortie.

## Mise à jour

Déploiement web = mise à jour instantanée du contenu de l'app. Une nouvelle version de l'AAB
n'est nécessaire que pour : changement d'icône, de nom, de `package_name`, de permissions
Android ou de la version du runtime TWA.
