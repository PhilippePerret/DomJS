# DomJS

Librairie JavaScript pour simplifier l'utilisation du DOM, sans jQuery.

## Utilisation

### Chargement distant

Copier ce lien en dur dans le `<head>` de votre page HTML :

```
<script src="https://cdn.jsdelivr.net/gh/PhilippePerret/DomJS@main/dom.js"></script>
```

### Chargement local

Pour un usage local sans connexion, charger le fichier `dom.js` dans votre dossier JavaScript et appelez-le comme tout autre script.

### Pour Phoenix/Elixir

* Placez le fichier `dom.js` dans le dossier `./assets/js` de l'application,
* ajouter la ligne `import "./dom.js";` dans le fichier `./assets/js/app.js`,
* that's it!

## Test de la librairie

Si vous utilisez LibTestor {Lien requis}, une fois la librairie chargée, vous pouvez jouer `Dom.ctest()` dans la console JavaScript de votre navigateur pour lancer les tests et vous assurer que tout passe.