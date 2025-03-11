'use strict';
/**
 * version: 1.1.0
 * author: philippe.perret@yahoo.fr
 * 
 * Utilitaire DOM pour JavaScript
 * 
 * TESTS
 * =====
 * Jouer DOM.ctest() dans la console du navigateur pour lancer les 
 * tests de la librairie. Les résultats s'afficheront en console.
 * Après avoir vérifier la validité de la librairie, on pourra 
 * supprimer tout le code du test (à partir de === TEST LIBRAIRIE ===)
 * 
 * API
 * ===
 *    DCreate(<balise>, <params>) 
 *        Pour créer un élément. Si params ne définit pas :in, 
 *        l'objet est retourné. Sinon, il est inscrit dans le
 *        document.
 *        +params+
 * 
 *    DGet(selecteur)
 *        Retourne l'objet DOM correspondant au sélecteur
 *    DGet(selecteur, conteneur)
 *        Retourne l'objet DOM correspondant au sélecteur, dans le 
 *        +conteneur+
 *    DGet(selecteur, params)
 *        Fonctionne alors comme DFind (cf. cette fonction)
 * 
 *    DFind(selecteur, params)
 *        Retourne l'élément de sélecteur +selecteur+ répondant aux
 *        paramètres +params+. Par exemple : 
 *        DFind('a', {text: "Liste des élément", after: FooElement})
 *        Pour les cas simples, préférer DGet avec un sélecteur bien
 *        défini.
 * 
 *    DGetAll(selecteur[, conteneur])
 *        Idem, mais pour plusieurs objets
 * 
 *    DContains(contenant, searched[, options])
 *        dom.js est très puissant pour rechercher des éléments (en
 *        JavaScript Vanille, sans le biais de jQuery ou autre 
 *        librairie)
 *        +contenant+ [Selector|DOMElement|Null] Le conteneur éven-
 *        tuel de l'élément. Si Null, c'est le document lui-même.
 *        +searched+ peut en effet avoir plusieurs expressions :
 *        - [String] Une chaine recherché dans le contenu innerHTML
 *          de l'élément. Cette chaine doit être exacte. Sinon uti-
 *          liser plutôt /chaine/i
 *          Une chaine peut aussi être un sélecteur et sera toujours
 *          interprétée comme telle si c'est possible. Attention dans
 *          ce cas à ne laisser aucune espace, même pour des sélec-
 *          teurs alternatif comme 'div.child,div.enfant'. Pour for-
 *          cer un sélecteur à rester un string, il suffit de le
 *          faire précéder par une espace. Cette espace sera suppri-
 *          mée pour la recherche.
 *          Puisqu'on ne peut pas mettre d'espace dans ce cas-là, il
 *          est impératif d'indiquer le conteneur parent de l'élément
 *          à trouver. On indique pas :
 *            contains(null, 'div#conteneur span#contenu')
 *          … mais bien plutôt :
 *            contains('div#conteneur', 'span#contenu')
 *        - [RegExp] Une expression régulière de forme quelconque.
 *        - [DomElement] Un element DOM, par exemple obtenu par 
 *          DGet.
 *        - [Array<Any>] Une liste de n'importe lesquels de ces 
 *          éléments mélangés. Dans ce cas, la fonction est capable
 *          de retourner deux sortes de résultat. Par défaut, retour-
 *          nera TRUE si tous les éléments ont été trouvé et FALSE 
 *          dans le cas contraire. Mais si l'option details:true est
 *          activé, la fonction retournera alors :
 *            :all      TRUE si tous les éléments ont été trouvés
 *            :one      TRUE si au moins un élément a été trouvé
 *            :found    [Array] Liste des éléments trouvés
 *            :unfound  [Array] Liste des éléments trouvés
 *        +options+ Permet de définir la recherche.
 *          :details    [Boolean] Si true, retourne le détail du
 *                      résultat en cas de recherche multiple.
 *          :after      On doit trouver l'élément cherché (par ex. le
 *                      texte), après cet élément. Noter que l'élé-
 *                      ment et cette valeur doivent être de même
 *                      nature, [String|RegExp] si un [String] est 
 *                      recherché ou [DOMElement].
 *          :before     Même chose que :after, mais cet élément doit
 *                      se trouver après.
 * 
 */

/** 
 * @constant ERRORS Table des messages d'erreur.
 * @type {Array}
 * @local
 */
const ERRORS = {
    bad_container: "Il faut obligatoirement fournir un conteneur."
  , contains: {
      with_bad_types: "On doit fournir à la fonction DOM.contains seulement des string, des regexp ou une liste (pas de '_TYPE_')"
    , incompatible_types: "Types incompatibles dans DOM.contains : '_TYPE_' et '_TYPE_REF_'…"
  }
}

/** 
 * @constant REG_SELECTOR Expression régulière pour reconnaitre du sélecteur
 * @type {RegExp}
 * @local
 */
const REG_SELECTOR = /^(([a-z]{1,10})([\#\.\[\,][^ ]+)?|\#([^ \#]+))$/i

/**
 * S'assure de retourner un DOM Object valide (ou null ou la valeur par défaut)
 * 
 * @param {(String|DOMElement|Nullish)} specs Le sélecteur ou le DOMElement
 * @param {Any} defaultReturn Valeur par défaut qui sera retourné en cas d'absence de l'élément
 * @returns {DOMElement} Le DOMElement si le sélecteur a été trouvé, le body du document si le sélecteur est nul ou nul si le sélecteur n'est pas trouvé dans le document.
 * 
 * @protected
 */
function ensureDomE(specs, defaultReturn) {
  if ( !specs ) {
    if (undefined === defaultReturn) return document.body
    else return defaultReturn
  } else if ( 'string' == typeof specs ) {
    return document.querySelector(specs) || defaultReturn
  } else {
    return specs || defaultReturn
  }
}

/**
 * Classe principale gérant le DOM
 * @class
 * 
 */
class Dom {

  /**
   * Crée un élément DOM de type +tag+ avec les données +data+ et retour-
   * ne l'objet créé OU l'insert directement dans le DOM.
   * 
   * @param {String} tag Une balise quelconque (div, a, span, table etc.)
   * @param {Object} data des données à utiliser. Les propriétés (toutes sont optionnelles) sont :
   * @param {String} data.id Identifiant pour le nœud
   * @param {String} data.text Le contenu textuel
   * @param {String} data.value Valeur de l'élément (peut se trouver aussi dans data.text)
   * @param {String} data.type Le type (par exemple pour un input)
   * @param {String|Array} data.class La ou les classes CSS. Indifféremment une liste string de classes ("css1 css2", "css1.css2" ou une liste ["css1", "css2"])
   * @param {Object} data.dataset Table des données à insérer.
   * @param {String} data.src La source de l'élément (script, image, etc.)
   * @param {String} data.href L'URL du lien (a, link, etc.)
   * @param {String} data.for L'identifiant de l'élément lié au label (souvent une checkbox)
   * @param {Function} data.onload La méthode appelée en fin de chargement (img, script, etc.)
   * @param {Function} data.onerror La méthode à appeler en cas d'erreur (img, script, etc.)
   * @param {Function} data.onchange La méthode à appeler en cas de changement (input-text, textarea, etc.)
   * @param {Function} data.onblur La méthode à appeler au blur
   * @param {Selector|DOMElement} data.in Le conteneur (parent) du noeud. Si précisé, on mettre le nœud directement dedans.
   * @param {Selector|DOMElement} data.after L'élément après lequel mettre le nœud. S'il n'y a aucune ambigüité, data.in n'est pas nécessaire.
   * @param {Selector|DOMElement} data.before L'élément avant lequel mettre le nœud. S'il n'y a aucune ambigüité, data.in n'est pas nécessaire.
   * @param {String} data.placeholder Le placeholder pour l'élément
   * @param {String} data.title Le titre pour l'élément (apparaissant au survol de la souris)
   */
  static create(tag, data){
    const dom = new Dom(tag, data)
    return dom.build().obj
  }

  /**
   * Retourne l'objet DOM correspondant au sélecteur, en respectant les paramètres fournis.
   * 
   * @param {String} selector Un sélecteur valide
   * @param {Object} params Paramètres de la recherche. Pour le détail des paramètres, voir la méthode {@link Dom.findAll}.
   * @return {DOMElement|Null} L'objet DOM trouvé ou null.
   * 
   * @protected
   */
  static get(selector, params) {
    if ( params && this.typeOf(params) == 'DOMElement' ) {
      return params.querySelector(selector)
    } else if (params) {
      return this.find(selector, params)
    } else {
      return document.querySelector(selector)
    }
  }

  /**
   * Retourne tous les objets DOM correspondant au sélecteur dans le conteneur fourni.
   * 
   * @param {String} selecteur Un sélecteur valide.
   * @param {Selector|DOMElement} conteneur Un conteneur valide ou son sélecteur.
   * @return {Array} Liste de tous les objets DOM trouvés
   * 
   * @protected
   */
  static getAll(selecteur, conteneur) {
    conteneur = ensureDomE(conteneur)
    return Array.from(conteneur.querySelectorAll(selecteur))
  }

  /**
   * Recherche l'élément unique correspond au sélecteur et répondant à tous les paramètres fournis. Cette fonction est exposée dans {@link DFind}.
   * 
   * @param {String} selecteur Le sélecteur valide
   * @param {Object} params Table des paramètres. Voir la méthode {@link Dom.findAll} pour le détail.
   * 
   * @protected
   */
  static find(selecteur, params) {
    if ( params ) {
      return this.findAll(selecteur, params, true)
    } else {
      return this.get(selecteur)
    }
  }

  /**
   * Recherche tous les objets DOM répondant au sélecteur et aux paramètres fournis.
   * 
   * @param {String} selecteur Le sélecteur valide
   * @param {Object} params Les paramètres de la recherche
   * @param {String} params.content Le contenu à trouver (synonyme de @text)
   * @param {String} params.text Le contenu à trouver
   * @param {Selector|DOMElement} params.in Le conteneur dans lequel il faut chercher.
   * @param {String} params.id  Le node doit avoir cet identifiant
   * @param {String|Array} params.class Le node doit contenir cette ou ces classes (liste string ou Array)
   * @param {Selector|DOMElement} params.after Le node doit se trouver après cet élément DOM
   * @param {Selector|DOMElement} params.before Le node doit se trouver après cet élément DOM
   * @param {Boolean} stopAtFirst Si true, on s'en retourne avec le premier nœud trouvé.
   * @defaultvalue false
   * 
   * @return {Array<DOMElement>|DOMElement} Une liste {Array} des nœuds trouvés ou le premier si stopAtFirst
   * 
   * @protected
   */
  static findAll(selecteur, params, stopAtFirst = false){
    const founds = stopAtFirst ? null : []
    if ( params ) {
      if ( params.content ) {
        params.text = params.content
        delete params.content
      }
      if ( params.class ) {
        params.class = this.normalizeClass(params.class)
      }
      params.in || (params.in = document.body)
      const candidats = this.getAll(selecteur, params.in)
      if ( candidats.count == 0 ) return undefined ;
      for (var found of candidats) {
        if ( this.matchAllParams(found, params) ) {
          if ( stopAtFirst ) return found
          else founds.push(found)
        }
      }
      return founds
    } else {
      this.getAll(selecteur)
    }    
  }

  /**
   * Fonction qui "normalize" le paramètre .class en mettant toujours
   * une liste {Array}, quel que soit le type de l'entrée.
   * 
   * @param {String|Array} entry Classe définie par "css", "ccs1 css2", "css1.css2" ou ["css1", "css2"]
   * @return {Array<String>} Liste des classes CSS
   */
  static normalizeClass(entry){
    if ( 'string' == typeof entry ) {
      return entry.split(/[ .]/)
        .map(function(item){return item.trim()})
        .filter(function(item){return item != ""})
    } else {
      return entry; // pas de vérif, faites gaffe !
    }
  }
  /**
   * Fonction qui retourne true si le DOMElement +el+ répond à tous
   * les paramètres +params+
   * 
   * +params+ peut contenir
   *    :text     Le texte [String|RegExp] que doit contenir l'élément
   *    :id       L'identifiant [String] de l'élément
   *    :class    La classe que doit posséder
   *    :dataset  Les attributs "data-<key>" que doit contenir 
   *              l'élément avec la valeur fourni
   * 
   * @protected
   */
  static matchAllParams(el, params){
    if ( params.id && el.id != params.id ) return false ;
    if ( params.class && !el.className.split(" ").includes(params.class)) {
      return this.checkClassInNode(el, params.class)
    }
    if ( params.dataset && !this.matchAllDataSet(el, params.dataset)) return false ;
    if ( (params.text||params.after||params.before) && !this.contains(el, params.text || params.content)) return false ;

    return true 
  }

  /**
   * Teste les classes du nœud
   * 
   * @param {DOMElement} node Le node à checker
   * @param {Array} expectedClasses Liste (forcément) des classes attendues. Mais c'est souvent le noeud qui en contient plusieurs.
   * 
   * @return {Boolan} TRUE si le node contient toutes les classes attendues. FALSE dans le cas contraire.
   * 
   * @protected
   */
  static checkClassInNode(node, expectedClasses){
    const nodeClasses = node.classList
    for (const css of expectedClasses) {
      if ( !nodeClasses.contains(css) ) return false ;
    }
    return true
  }

  static matchAllDataSet(el, data){
    for (var prop in data) {
      if ( el.dataset[prop] != data[prop] ) return false
    }
    return true
  }

  /**
   * Teste la visibilité de l'élément
   * 
   * @param {Selector|DOMElement} nodeSpec Un sélecteur valide ou un nœud DOM
   * @return {Boolean} True si le nœud est visible, false dans le cas contraire
   * 
   * @public
   */
  static isVisible(nodeSpec){ 
    return (nodeSpec = ensureDomE(nodeSpec)) && nodeSpec.checkVisibility({
    opacityProperty: true,   // Check CSS opacity property too
    visibilityProperty: true // Check CSS visibility property too}) 
  })}

  /**
   * Teste la visibilité de l'élément
   * @param {Selector|DOMElement} nodeSpec Un sélecteur valide ou un nœud DOM
   * @return {Boolean} False si le nœud est visible, true dans le cas contraire
   */
  static isHidden(nodeSpec) { return !this.isVisible(nodeSpec) }

  /**
   * 
   * Recherche d'appartenance
   * ------------------------
   * 
   * La méthode retourne TRUE si +searched+ appartient à domE en 
   * respectant les +options+ si elles sont fournies. Voir en haut
   * de page pour avoir les détails.
   * 
   * 
   * Si +searched+ est égal à "li.piege", la méthode 
   * ensureRealSearched/2 retourne le premier LI, car il répond à 
   * cette définition. Mais si +options+ contient :
   *  {after: DGet('li#avant'), before: DGet('li#apres')} (le :before
   *  n'est même pas utile ici)
   * … alors la méthode retournera une chaine null puisque le 
   * searched, en tout état de cause, est placé avant le 
   * options.after… Il faudrait pourtant que ce soit le 2e qui soit
   * considéré après l'échec du premier. 
   * Pour ce faire, il faudrait que +searched+ puisse mémoriser le 
   * fait que plusieurs candidats sont possibles, et les tester le
   * cas échéant.
   * On navigue dans la recherche avec une structure :
   *  {
   *      type:     <type>
   *    , searched: <searched>
   *    , multi:    true|false
   *    , originalSearched: <searched initial>
   *  }
   * 
   * TODO Amélioration : pouvoir spécifier le nombre d'éléments à trouver.
   * 
   * @return {Boolean} True si l'élément a été trouvé, false dans le cas contraire.
   * 
   * @protected
  */
  static contains(conteneur, searched, options) {
    conteneur = ensureDomE(conteneur) 
    if ( !conteneur ) throw new Error(ERRORS.bad_container) ;
    options = options || {}
    const structSearch = this.structurizeSearched(searched, conteneur, options)
    if ( ! structSearch.searched ) return false ;
    this.checkAfterBeforeTypes(structSearch, options)
    // console.log("typeSearched", typeSearched)
    switch(structSearch.type) {
      case 'Array':
        return this.contentAnalysis(conteneur, structSearch, options)
      case 'String':
      case 'RegExp':
      case 'DOMElement':
        return this.containsOne(conteneur, structSearch, options)
      default:
        throw ERRORS.contains.with_bad_types.replace(_TYPE_, structSearch.type)
    }
  }
  
  /**
   * Méthode ajoutée pour traiter le cas où searched est un string
   * qui représente un sélecteur. Dans ce cas, il faut remplacer ce
   * string par un DOMElement.
   * 
   * Voir la réflexion (enigme) au-dessus de find
   * 
   * Ci-dessous, on ne cherche pas encore les candidats, on indique
   * seulement la possibilité qu'il y en ait. Seul la présence d'un
   * :id défini empêche la possibilité de ces candidats.
   * Dans le cas de candidats possibles, la propriété :multi est
   * mise à true et sera considérée en temps voulu.
   * 
   * @protected
   */
  static structurizeSearched(searched, conteneur, options){
    var el;
    if ( ('string' == typeof searched) && (el = this.asMaybeSelector(searched, conteneur) ) ){ 
      /**
       * On passe ici quand le string recherché pourrait être un 
       * sélecteur. Si c'est le cas, on indiquera que plusieurs
       * candidats pourrait être considéré pour la recherche. Mais
       * certaines propriétés excluent cette possibilité, comme par
       * exemple la définition d'un :id (par nature unique)
       */
      /** Le sélecteur définit-il un id ? Dans ce cas, aucun
       * autre candidat n'est possible */
      if ( el.id ) {
        return {searched: el, type: 'DOMElement', multi: false}
      }
      /* Les options définissent-elles un :id ? => un seul candidat */
      if ( options.id ) {
        el = DGet(`${searched}#${options.id}`, conteneur) 
        return {searched: el, type: 'DOMElement', multi: false}
      }
      // Dans tous les autres cas, il peut y avoir plusieurs candi-
      // datas possibles.
      return {searched: el, originalSearched: searched, type: 'DOMElement', multi: true}
    } else if ('string' == typeof searched) {
      return {searched: searched.trim(), type: "String", multi: false}
    } else {
      return {searched: searched, type: this.typeOf(searched), multi: false}
    }
  }

  /**
   * Fonction qui regarde si +str+ peut être un sélecteur. Dans le 
   * cas où c'est possible, on retourne le sélecteur, dans le cas 
   * contraire, on retourne null
   * @protected
   */
  static asMaybeSelector(str, conteneur){
    if ( str.indexOf(' ') > -1 ) return null ;
    if ( !str.match(REG_SELECTOR) ) return null ;
    conteneur = conteneur || document.body
    return conteneur.querySelector(str)
  }

  /**
   * Méthode qui s'assure que les types sont concordants quand :after
   * ou :before sont définis
   * @protected
   */
  static checkAfterBeforeTypes(structSearch, options){
    if ( !options.before && !options.after ) return true ;
    if ( options.before ) this.areCompatibleTypes(structSearch, this.typeOf(options.before));
    if ( options.after )  this.areCompatibleTypes(structSearch, this.typeOf(options.after));
    return true
  }
  /**
   * Fonction qui checke que deux types sont compatibles pour être comparés.
   * 
   * Par exemple, pour faire une recherche de texte (String), il faut que le type de l'élément de comparaison fourni soit de type {String} ou de type {RegExp}.
   * 
   * @param {StructSearch} structSearch Table de la recherche
   * @param {String} typeRef Le type de référence (String, RegExp, DOMElement)
   * @return {Boolean} True si les types sont compatibles, false dans le cas contraire.
   * 
   * @protected
   */
  static areCompatibleTypes(structSearch, typeRef){
    try {
      switch(structSearch.type) {
        case 'String' :
          if ( typeRef != 'String' && typeRef != 'RegExp' ) throw "";
          break
        case 'RegExp' :
          if ( typeRef != 'String' && typeRef != 'RegExp' ) throw "";
          break
        case 'DOMElement':
          if ( typeRef != 'DOMElement' ) throw "";
          break
        default:
          throw new Error()
      }
    } catch(erreur) {
      throw new Error(ERRORS.contains.incompatible_types.replace("_TYPE_", structSearch.type).replace("_TYPE_REF_", typeRef))
    }
  }

  /**
   * Dans le cas d'une recherche multiple (plusieurs éléments recher-
   * chés, qui peuvent être de type différents)
   * Si options.details est true, on retourne une table avec un 
   * résultat de recherche détaillé. Sinon, on retourne true ou
   * false
   * 
   * @protected
   */
  static contentAnalysis(conteneur, structSearch, options) {
    const searcheds = structSearch.searched
    const resultat = {
      all: true, one: false, found: [], unfound: []
    }
    for (var searched of searcheds) {
      const structSousSearch = this.structurizeSearched(searched, conteneur, options)
      if ( this.containsOne(conteneur, structSousSearch, options) ) {
        resultat.one = true
        resultat.found.push(searched)
      } else {
        if ( ! options.details ) return false ;
        resultat.all = false
        resultat.unfound.push(searched)
      }
    }
    if ( options.details ) {
      return resultat
    } else {
      return true
    }
  }
  /**
   * Fonction qui retourne TRUE quand +conteneur+ contient la recher-
   * che spécifiée par +dsearched+ ([type, searched]) en respectant
   * les +options+ et particulièrement ici : :after et :before
   * 
   * @protected
   */
  static containsOne(conteneur, structSearch, options) {
    const searched = structSearch.searched
    const noAfterBeforeChecks = !(options.after || options.before)
    switch(structSearch.type) {
      case 'String':
        return conteneur.innerHTML.includes(searched) && (noAfterBeforeChecks || this.checkAfterBeforeAsString(conteneur, structSearch, options))
      case 'RegExp':
        // TODO Quid du cas où le texte se trouve au début et que c'est
        // seulement le second qui répond aux exigences ? Exemple : 
        //  "recherché celui avant le recherché et après" (on cherche
        // "recherché" et option.after = "avant" et option.before est
        // "après")
        return conteneur.innerHTML.match(searched) && (noAfterBeforeChecks || this.checkAfterBeforeAsString(conteneur, structSearch, options))
      case 'DOMElement':
        return conteneur.contains(searched) && (noAfterBeforeChecks || this.checkAfterBeforeAsDOMElement(conteneur, structSearch, options))
    }
  }

  static checkAfterBeforeAsString(conteneur, structSearch, options) {
    const content = conteneur.innerHTML
    let startIndex = 0, endIndex = content.length ;
    if ( options.after ) {
      startIndex = content.indexOf(options.after) + 1
    } 
    if ( options.before ) {
      endIndex = content.indexOf(options.before)
    }
    const extrait = content.substring(startIndex, content.length - endIndex)
    if ( structSearch.type == 'RegExp') {
      return extrait.match(structSearch.searched)
    } else {
      return extrait.includes(structSearch.searched)
    }
  }
  /*
   * Retourne true si le check "avant/après" est réussi
   */
  static checkAfterBeforeAsDOMElement(conteneur, structSearch, options){
    let candidats ;
    if (structSearch.multi) {
      candidats = this.getAll(structSearch.originalSearched, conteneur)
    } else {
      candidats = [structSearch.searched]
    }

    for ( var candidat of candidats ) {
      if ( options.after && !this.findAfter(candidat, options.after) ) {
        // Si un option "after" est définie et qu'on ne trouve pas
        // l'élément avant le candidat, on passe au candidat suivant
        continue
      }
      if ( options.before && !this.findBefore(candidat, options.before) ) {
        // Si un option "before" est définie et qu'on ne trouve pas
        // l'élément après le candidat, on passe au candidat suivant
        continue
      }
      structSearch.searched = candidat 
          // Ça ne sert à rien pour le moment, mais à l'avenir il faudrait
          // peut-être que cette fonction retourne la structure et que
          // cette structure soit remontée. Mais pour le moment, la fonction
          // n'est utile que pour 'contains' donc on se fiche de savoir
          // l'élément dont il est question.
      return true
    }
    // Aucun candidat n'a été trouvé
    return false
  }


  static findBefore(subject, after) {
    let next = subject.nextSibling
    while ( next ){
      if ( next == after ) return true
      next = next.nextSibling
    }
    return false
  }
  static findAfter(subject, before){
    let previous = subject.previousSibling
    while ( previous ){
      if ( previous == before ) return true
      previous = previous.previousSibling
    }
    return false
  }

  /**
   * Retourne le type de l'objet fourni, quel qu'il soit.
   * Peut fonction sur tout, même sur autre chose que des éléments du DOM
   * @param {Any} obj Element quelconque fourni
   * @return {String} Son type, par exemple 'String' pour une chaine, 'DOMElement' pour un node du DOM, 'Array' pour une liste, etc.
   * 
   * @public
   */
  static typeOf(obj){
    return obj instanceof Element ? "DOMElement" : this.instanceOf(obj)
  }
  /**
   * Retourne le type de l'objet quand ce n'est pas un Element.
   * 
   * @protected
   */
  static instanceOf(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1)
  }


  // ==== I N S T A N C E ===

  constructor(tag, data){
    this.tag = tag
    this.data = data
  }
  /**
   * Construction d'un élément DOM.
   * 
   * Pour le détail des attributs, cf. {@link Dom.create}
   * 
   * @protected
   */
  build(){
    const o = document.createElement(this.tag)
    const d = this.data
    this.obj = o
    d.id          && (o.id = d.id)
    d.text && this.setContent(d.text)
    d.value && this.setContent(d.value)
    if ( d.class ) {
      d.class = Dom.normalizeClass(d.class)
      o.className = d.class.join(" ")
    }
    ;[
      'style', 'type', 'placeholder','title','for'
    ].forEach(prop => {
      d[prop] && o.setAttribute(prop, d[prop])
    })
    ;[
      'onload','onerror','onchange','onblur', 'href'
    ].forEach(attr => {
      d[attr] && (o[attr] = d[attr])
    })

    ;(d.in||d.after||d.before) && this.insertInContainer(o)

    d.src && (o.src = d.src)

    return this // chainage
  }

  /**
   * Insert l'objet directement dans le DOM
   * 
   * @param {DOMElement} o Le node à insérer.
   * 
   * @protected
   */
  insertInContainer(o){
    // console.log("-> insertInContainer / data = ", this.data)
    const d = this.data
    const real_in      = ensureDomE(d.in, document.body)
    const real_after   = ensureDomE(d.after, null)
    const real_before  = ensureDomE(d.before, null)
    if ( real_after || real_before ) {
      const parent = d.in ? d.in : (real_after ? real_after : real_before).parentNode ;
      let oref = real_after ? real_after.nextSibling : real_before ;
      parent.insertBefore(o, oref)
    } else if ( d.before ) {
      // Cas particulier où on doit insérer AVANT un noeud
      // qui n'existe pas (il aurait été traité par la condition
      // précédente): on met au tout début
      const parent = document.body
      parent.insertBefore(o, parent.firstChild)
    } else {
      real_in.appendChild(o)
    }
  }

  /**
   * Définit le contenu du node, en fonction de son type
   * @param {String} content Le contenu
   * @return {undefined}
   * 
   * @protected
   */
  setContent(content){
    if ( this.obj.hasOwnProperty('value') /* input, textarea, etc. */) {
      this.obj.value = content
    } else {
      this.obj.innerHTML = content}
    }

}

/**
 * 
 * La classe, pour atteindre ses méthodes
 * @global
 * @public
 */
window.DOM      = Dom
/**
 * Pour créer un node. Voir {@link Dom.create}.
 * 
 * @global
 * @public
 */
window.DCreate  = Dom.create.bind(Dom)
/**
 * Pour récupérer un node. Voir {@link Dom.get}
 * 
 * @global
 * @public
*/
window.DGet     = Dom.get.bind(Dom) // peut être utilisé comme DFind
/**
 * Pour récupérer tous les nodes. Voir {@link Dom.getAll}
 * 
 * @global
 * @public
 */
window.DGetAll  = Dom.getAll.bind(Dom)
/**
 * Pour rechercher des noeuds dans le DOM. Voir {@link Dom.find}
 * 
 * @global
 * @public
 */
window.DFind    = Dom.find.bind(Dom)

/**
 * Pour vérifier l'appartenance. Voir {@link Dom.contains}
 * 
 * @global
 * @public
 */
window.DContains = Dom.contains.bind(Dom)


// === TEST LIBRAIRIE ===
// (retirer le code ci-dessous après avoir lancé une première fois Dom.ctest()
//  pour vous assurer que la librairie était fonctionnelle.)
Dom.ctest = function(){

  if ( 'function' != typeof window.vide ) {
    return active_lib_testor(Dom)
  }
 
  // Pour ne jouer que les tests qui sont "marqués" (c'est-à-dire qui
  // ont tested:true dans leurs options.)
  // only_tested()

  let expected, expect, el, actual, lepremier, ledernier, node ;

  vide()
  // --- DGet ---
  t("Récupération d'un élément avec DGet")
  body(`
    <div id="premier">Le tout premier</div>
  `)
  assert(DGet('div#premier'), "DGet devrait retourner l'élément DOM demandé")

  t("--- new Dom() ---")
  body(`
    <div id="conteneur">
      <div id="contenu">Ce div est contenu</div>
    </div>
  `)
  conteneur = DGet('div#conteneur')
  const contenu = DGet('div#conteneur div#contenu')
  const o = new Dom('div', {in: "#conteneur"})
  const obj = DCreate('DIV', {id: 'ajouted', text: "Le div ajouté"})
  // En définissant :in avec un sélecteur
  o.data = {in: "#conteneur"}
  o.insertInContainer(obj)
  assert(DContains(conteneur, obj), "L'objet aurait dû être mis dans le conteneur (:in défini par le sélecteur…")
  obj.remove()
  // En définissant :in avec un DOM Element
  o.data = {in: conteneur}
  o.insertInContainer(obj)
  assert(DContains(conteneur, obj), "L'objet aurait dû être mis dans le conteneur (:in défini par l'objet…")
  obj.remove()
  // En définissant :in avec un élément inconnu
  o.data = {in: "div#inconnu-au-bataillon"}
  o.insertInContainer(obj)
  assert(!DContains(conteneur, obj), "L'objet ne devrait pas se trouver dans le conteneur (:in inconnu)…")
  obj.remove()
  // En définissant :after avec un sélecteur existant
  o.data = {after: "div#contenu"}
  o.insertInContainer(obj)
  assert(DContains(conteneur, obj), "L'objet aurait dû être mis dans le conteneur (:after défini par sélecteur…")
  equal(obj.previousSibling, contenu, "L'objet devrait être après le div contenu… (quand :after est sélecteur")
  obj.remove()
  // En définissant :after avec un objet existant
  o.data = {after: contenu}
  o.insertInContainer(obj)
  assert(DContains(conteneur, obj), "L'objet aurait dû être mis dans le conteneur (:after défini par objet…")
  equal(obj.previousSibling, contenu, "L'objet devrait être après le div contenu (quand :after est objet…")
  obj.remove()
  // En définissant :after avec un sélecteur inexistant
  o.data = {after: "div#inconnu-au-bataillon"}
  o.insertInContainer(obj)
  assert(!DContains(conteneur, obj), "L'objet n'aurait pas dû être mis dans le conteneur (:after inconnu…")
  obj.remove()
  // En définissant :before avec un sélecteur existant
  o.data = {before: "div#contenu"}
  o.insertInContainer(obj)
  assert(DContains(conteneur, obj), "L'objet aurait dû être mis dans le conteneur (:before défini par sélecteur…")
  equal(obj.nextSibling, contenu, "L'objet devrait être avant le div contenu… (quand :before est sélecteur")
  obj.remove()
  // En définissant :before avec un objet existant
  o.data = {before: contenu}
  o.insertInContainer(obj)
  assert(DContains(conteneur, obj), "L'objet aurait dû être mis dans le conteneur (:before défini par objet…")
  equal(obj.nextSibling, contenu, "L'objet devrait être avant le div contenu (quand :before est objet…")
  obj.remove()
  // En définissant :before avec un sélecteur inexistant
  o.data = {before: "div#inconnu-au-bataillon"}
  o.insertInContainer(obj)
  assert(!DContains(conteneur, obj), "L'objet n'aurait pas dû être mis dans le conteneur (:before inconnu…")
  obj.remove()

  // --- Création d'un élément à un endroit précis ---
  body(`
  <div id="conteneur-un"></div>
  <div id="conteneur-deux"></div>
  `)
  const conteneurUn = DGet('div#conteneur-un')
  const conteneurDeux = DGet('div#conteneur-deux')
  equal(Dom.typeOf(conteneurUn), 'DOMElement', "Le conteneur-un devrait être un node…")
  equal(Dom.typeOf(conteneurDeux), 'DOMElement', "Le conteneur-un devrait être un node…")
  DCreate('SPAN', {id:"monspan", in: "#conteneur-un"})
  const spanUn = DGet('span#monspan')
  equal(Dom.typeOf(spanUn), 'DOMElement', "Le premier span devrait être un node…")
  equal(spanUn.parentNode, conteneurUn, "Le premier span devrait être dans le conteneur-un…")
  assert(!DGet('span#monspan', conteneurDeux), "On ne devrait pas trouver le premier span dans le conteneur-deux")
  
  body(`
    <div id="premier">Le premier élément</div>
    <div id="dernier">Le dernier élément</div>
  `)
  lepremier = DGet('div#premier')
  ledernier = DGet('div#dernier')
  // --- avant un élément existant
  DCreate('DIV', {id: "tout-premier", before: "div#premier", text: "Tout premier"})
  let toutpremier = DGet('div#tout-premier')
  equal(toutpremier.nextSibling, lepremier, "Le div créé devrait être avant le premier")
  // --- après un élément existant
  DCreate('DIV', {id: "tout-dernier", after: "div#dernier", text: "Tout dernier"})
  node = DGet('div#tout-dernier')
  equal(node.previousSibling, ledernier, "Le div créé devrait être après le dernier")
  // --- après un élément inexistant (donc à la fin)
  DCreate('DIV', {id: "tout-en-bas", after: "div#inexistant", text: "Tout en bas"})
  node = DGet('div#tout-en-bas')
  equal(node.previousSibling, ledernier, "Le div créé après un neoud inexistant devrait être après le dernier")
  // --- avant un élément inexistant (donc au début)
  DCreate('DIV', {id: "tout-en-haut", before: "div#inexistant", text: "Tout en haut"})
  node = DGet('div#tout-en-haut')
  equal(node.nextSibling, toutpremier, "Le div créé avant un noeud inexistant devrait être avant le tout premier")

  // --- DGetAll ---
  t("Récupération d'éléments avec DGetAll")
  body(`
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
    <div>Rien</div>
    <div id='monde'>
    <li>Troisième</li>
    </div>
  `)
  equal(DGetAll('li').length, 3, "DGetAll ne retourne pas le bon nombre d'éléments en tout")
  equal(DGetAll('ul li').length, 2, "DGetAll ne retourne pas le bon nombre d'éléments de UL")
  equal(DGetAll('li', 'div#monde').length, 1, "DGetAll ne retourne pas le bon nombre d'éléments d'un container fourni en deuxième argument.")
  
  // --- DCreate ---
  // Quelques vérifications avant
  ;[
      [ "css"            , ["css"]           ] 
    , [ ["css"]          , ["css"]           ] 
    , [ "css1 css2"      , ["css1", "css2"]  ]
    , [ "css1.css2"      , ["css1", "css2"]  ]
    , [ "css1   css2"    , ["css1", "css2"]  ]
    , [ "css1  . css2"   , ["css1", "css2"]  ]
    , [ ["css1", "css2"] , ["css1", "css2"]  ]
  ].forEach(paire => {
    const [provided, expected] = paire
    const actual = Dom.normalizeClass(provided)
    equal(actual, expected, `Dom.normalizeClass aurait dû retourner la bonne valeur pour '${provided}'…`)
  })
  vide()
  t("Création d'un élément avec DCreate")
  el = DCreate('DIV', {id: "mondiv", class: "moncss maclass", text: "Mon div de test"})
  assert(DOM.typeOf(el) == "DOMElement", "DOM.typeOf devrait retourner le bon type")
  assert(DOM.instanceOf(el) == "HTMLDivElement", "DOM.instanceOf ne retourne pas la bonne valeur")
  assert(get('div#mondiv') == null, "DCreate ne devrait pas avoir mis l'élément dans le DOM…")
  add(el)
  assert(get('div#mondiv'), "DCreate n'a pas construit l'élément div#mondiv")
  assert(get('div.moncss'), "DCreate n'a pas mis la class CSS 'moncss'")
  assert(get('div.maclass'), "DCreate n'a pas mis la class CSS 'maclass'")
  assert(get('div.moncss.maclass'), "DCreate n'a pas mis la class CSS")
  t("Insertion d'un élément créé dans le dom avec DCreate")
  let elin = DCreate('DIV', {id:"sousdiv", text: "Le sous-div", in: el})
  assert(get('div#sousdiv'), "DCreate aurait dû créer l'élément directement dans le DOM")
  
  t("--- DOM.typeOf ---")
  equal(DOM.typeOf(elin), "DOMElement", "DOM.typeOf devrait retourner le bon type")
  t("--- DOM.instanceOf ---")
  equal(DOM.instanceOf(elin), 'HTMLDivElement', "DOM.instanceOf devrait retourner le bon type.")
  
  t("--- ensureDomE ---")
  equal(ensureDomE(null), document.body, "ensureDomE(null) devrait retourne document.body")
  equal(ensureDomE(null, "--rien--"), "--rien--", "ensureDomE(null) devrait retourner la valeur par défaut transmise")
  equal(ensureDomE('div#mondiv'), DGet('div#mondiv'), "ensureDomE devrait retourner le DOMElement d'après le string")
  equal(ensureDomE(elin), DGet('div#sousdiv'), "ensureDomE devrait retourner le DOMElement d'après le DOMElement")

  t("--- DOM.isVisible/isHidden ---")
  assert(DOM.isVisible(elin), "DOM.isVisible devrait retourner true…")
  elin.style.opacity = '0'
  equal(DOM.isVisible(elin), false, "DOM.isVisible devrait retourner false…")
  assert(DOM.isHidden(elin), "DOM.isHidden devrait retourner true…")
  elin.style.opacity = '1'
  elin.style.visibility = 'hidden'
  equal(DOM.isVisible(elin), false, "DOM.isVisible devrait retourner false…")
  assert(DOM.isHidden(elin), "DOM.isHidden devrait retourner true…")
  elin.style.visibility = 'visible'
  
  t("--- DOM.contains ---")
  raise(DOM.contains, ["bad.contenant", /texte/], ERRORS.bad_container)
  equal(DOM.contains(el, /div/ ), true, "DOM.contains avec une bonne RegExp devrait retourner true")
  equal(DOM.contains(el, "Mon div de test"), true, "DOM.contains avec un bon string devrait retourner true")
  equal(DOM.contains(el, ["Mon", "div"]), true, "DOM.contains avec un bon array devrait retourner true")
  equal(DOM.contains(el, elin), true, "DOM.contains avec un bon DOMElement devrait retourne true")
  const elout = DCreate('DIV', {in: document.body, id: "divout"})
  equal(DOM.contains(el, elout), false, "DOM.contains avec un mauvais DOMELement devrait retourner false")
  // Avec tous des éléments correspondant
  expected  = {all: true, one: true, found: ["div", elin, "Mon"], unfound: []}
  actual    = DOM.contains(el, ["div", elin, "Mon"], {details: true})
  equal(actual, expected, "DOM.contains devrait retourner des détails valides.")
  // Avec un seul intrus
  expected  = {all: false, one: true, found: [elin, "Mon"], unfound: ["Intrus"]}
  actual    = DOM.contains(el, ["Intrus", elin, "Mon"], {details: true})
  equal(actual, expected, "DOM.contains devrait retourner des détails valides.")
  actual    = DOM.contains(el, ["Intrus", elin, "Mon"], {details: false})
  equal(actual, false, "DOM.contains devrait retourner false avec un élément absent")
  expected  = {all: false, one: false, found: [], unfound: ["Intrus", elout]}
  actual    = DOM.contains(el, ["Intrus", elout], {details: true})
  equal(actual, expected, "DOM.contains devrait retourner des détails valides.")
  actual    = DOM.contains(el, ["Intrus", elout])
  equal(actual, false, "DOM.contains devrait retourner false avec tous les éléments absents")
  // -- Options :after/:before
  // -- par sélecteur string
  t("--- par sélecteur string ---")
  body(`
  <div id="parent">
    <div class="child">Le premier enfant</div>
    <div class="child">Le deuxième enfant</div>
    <span class="grand-child">Un petit-enfant</span>
    <span>span.autre-grand-child</span>
  </div>  
  `)
  const cont = DGet('div#parent')
  assert(Dom.typeOf(cont), 'DOMElement', "Le conteneur parent devrait avoir le bon type.")
  // Avant de tester, on s'assure que l'expression régulière pour 
  // détecter les sélecteurs est valide
  ;[
    'div', 'div#monDiv','div.classe','input[type="text"]', 'span[data-index="1"]',
    'div#id.css2.css3', 'div.child,div.enfant'
  ].forEach(selector => {
    assert(selector.match(REG_SELECTOR), `'${selector}' devrait être considéré comme un sélecteur.`)
  })
  ;[
    'des espaces', 'beaucouptroplong#id', ' div#pourtantbon', 'div#pas bon'
  ].forEach(badsel => {
    assert(!badsel.match(REG_SELECTOR), `'${badsel}' ne devrait pas être considéré comme un sélecteur…`)
  })
  // Pour div.child, il y a trois candidats, mais c'est le premier 
  // qui l'emporte, quand il n'y a pas d'autres précision
  actual = DOM.contains(cont, 'div.child')
  assert(actual, "Le div.child a bien été compris comme un sélecteur")

  // Un texte à chercher, qui pourrait être un sélecteur, mais qui 
  // doit rester en string.
  actual = DOM.contains(cont, 'span.grand-child')
  assert(actual, "'span.grand-child' a été trouvé en tant que DOMElement")
  actual = DOM.contains(cont, ' span.grand-child')
  assert(!actual, "Le ' span.grand-child' ne devrait pas avoir été trouvé.")
  // L'espace sera bien retiré pour la recherche
  actual = DOM.contains(cont, ' span.autre-grand-child')
  assert(actual, "Le string ' span.autre-grand-child' aurait dû être trouvé malgré l'espace", {tested: true})

  // Un conteneur par :in peut être défini par un sélecteur
  actual = DOM.contains('div.child', 'div.child')
  assert(!actual, "div.child ne devrait pas avoir été trouvé dans div.child…")


  // UN document structuré pour tester la suite
  body(`
  <ul id="first-list">
    <li>Premier</li>
    <li id="deuxieme" class="class2 classdeux" data-index="2">Deuxième</li>
    <li>Troisième</li>
  </ul>
  <ul id="second-list">
    <li class="piege">Le premier piège</li>
    <li id="autre-li" data-autre="other">Un texte assez long dans un li</li>
    <li id="le-deux">Deux</li>
    <li class="piege">Le deuxième piége</li>
    <li id="piege">recherche celui avant le recherché et après</li>
    <li id="le-dernier">Le laisser en dernier</li>
  <ul>
  `)

  t("--- DFind ---")
  const list1 = DGet('ul#first-list')
  const list2 = DGet('ul#second-list')
  const deuxiemeLi  = DGet("li#deuxieme")
  const troisieme = DFind("li", {text:"Troisième"})
  const autreLi = DGet('li#autre-li')
  const lepiege = DGet('li#piege')
  const ledeux      = DGet('li#le-deux')
  ledernier   = DGet('li#le-dernier')

  assert(Dom.typeOf(deuxiemeLi), "DOMElement", "Le deuxième devrait avoir le bon type.")
  assert(Dom.typeOf(troisieme), "DOMElement", "Le troisième devrait avoir le bon type.")
  assert(Dom.typeOf(autreLi), "DOMElement", "L'autre lit' devrait avoir le bon type.")
  assert(Dom.typeOf(list2), "DOMElement", "La liste 2 devrait avoir le bon type.")
  assert(Dom.typeOf(lepiege), "DOMElement", "Le LI#piege devrait avoir le bon type.")
  assert(Dom.typeOf(ledeux), "DOMElement", "Le LI#le-deux devrait avoir le bon type.")
  assert(Dom.typeOf(ledernier), "DOMElement", "Le LI#dernier devrait avoir le bon type.")

  // Recherche avec sélecteur seul (comme DGet)
  actual = DFind("UL", {id: "first-list"})
  expect = DGet("ul#first-list")
  equal(actual, expect, "DFind aurait dû trouver la liste avec juste un sélecteur.")
  equal(Dom.typeOf(actual), "DOMElement", "L'élément trouvé devrait être du bon type…")
  // Recherche avec texte dans un élément
  actual = DFind("li", {text: "Deuxième", in: list1})
  equal(actual, deuxiemeLi, "DFind aurait dû trouver le deuxième avec son texte dans la première liste.")
  actual = DFind('li', {content: /ASSEZ LONG/i, in: list2})
  equal(actual, autreLi, "DFind aurait dû trouver l'autre li dans la liste 2 avec une expression régulière.")
  actual = DFind("li", {id: "deuxieme", in: list1})
  equal(actual, deuxiemeLi, "DFind aurait dû trouver le deuxième avec son id dans la première liste.")
  actual = DFind("li", {class: "class2", in: list1})
  equal(actual, deuxiemeLi, "DFind aurait dû trouver le deuxième avec sa class dans la première liste.")
  actual = DFind("li", {dataset: {index: "2"}, in: list1})
  equal(actual, deuxiemeLi, "DFind aurait dû trouver le deuxième avec son dataset dans la première liste.")
  // Recherche dans une mauvaise liste
  actual = DFind("li", {text: "Deuxième", in: list2})
  assert(!actual, "DFind n'aurait pas dû trouver le deuxième dans la seconde liste.")
  actual = DFind("li", {id: "deuxieme", in: list2})
  assert(!actual, "DFind n'aurait pas dû trouver le deuxième dans la seconde liste.")
  // Recherche avec dataset où une donnée manque
  actual = DFind("li", {dataset: {index: "2", autre:"other"}})
  assert(!actual, "DFind n'aurait pas dû trouver d'élément avec les deux datasets")
  actual = DFind("li", {dataset: {autre:"other"}})
  assert(actual, autreLi, "DFind aurait dû trouver l'autre LI")
  // Recherche avec :after
  actual = DOM.contains(list1, troisieme, {after: deuxieme})
  assert(actual, "On devrait trouver l'élément avant…")
  actual = DOM.contains(list1, deuxieme, {after: troisieme})
  assert(!actual, "On ne devrait pas trouver le deuxième après le troisième…")
  // Recherche avec :before
  actual = DOM.contains(list1, deuxieme, {before: troisieme})
  assert(actual, "On devrait trouver l'élément après…")
  actual = DOM.contains(list1, troisieme, {before: deuxieme})
  assert(!actual, "On ne devrait pas trouver le troisième avant le deuxième")
  // Recherche textuel avec :before et :after et un piège
  actual = DOM.contains(list2, /recherch./i, {after: "avant", before: "après"})
  assert(actual, "On devrait trouver un texte répondant à /recherch./i, avant 'après' et après 'avant")
  // TODO Recherche sur la class
  /**
   * Un cas ultime où on fournit un DOMElement et qu'il y a en a
   * premier qui ne répond pas aux attentes et il faudrait prendre le
   * deuxième (en d'autres termes, il faudrait relever tous les 
   * éléments qui peuvent matcher et les essayer les uns après les
   * autres jusqu'à en trouver un valide — ou pas)
   */
  actual = DOM.contains(list2, 'li.piege', {after: ledeux, before: ledernier})
  assert(actual, "Le LI piégé devrait avoir été trouvé…")

  // Test des types incompatibles lorsqu'on a :after ou :before
  // (une erreur est levée)
  raise(DOM.contains.bind(DOM),[el, elin, {after: "un string"}], "Types incompatibles dans DOM.contains : 'DOMElement' et 'String'…")
  raise(DOM.contains.bind(DOM),[el, "string", {after: elin}], "Types incompatibles dans DOM.contains : 'String' et 'DOMElement'…")
  not_raise(DOM.contains.bind(DOM),[el, "string", {after: /reg/i}])
  
}
