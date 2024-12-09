// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GestionnaireRisqueContrepartie {
    // Structure pour représenter une contrepartie
    struct Contrepartie {
        address portefeuille; // Adresse du portefeuille de la contrepartie
        uint256 scoreCredit; // Score de crédit de la contrepartie
        uint256 limiteExposition; // Limite d'exposition définie pour la contrepartie
        int256 expositionNette; // Exposition nette totale (long - short)
        uint256 collateral; // Collatéral fourni par la contrepartie
    }

    // Mapping pour stocker les contreparties avec leurs adresses
    mapping(address => Contrepartie) public contreparties;

    // Mapping pour gérer les expositions nettes entre deux parties
    mapping(address => mapping(address => int256)) private expositionsNettes;

    // Liste pour stocker les adresses des contreparties ajoutées
    address[] private contrepartieAddresses;

    // Événements pour suivre les actions importantes
    event ContrepartieAjoutee(address indexed contrepartie, uint256 limiteExposition, uint256 collateral);
    event ExpositionMiseAJour(address indexed contrepartie, int256 expositionNette);
    event RatioCouvertureCalcule(address indexed emetteur, address indexed contrepartie, uint256 ratioCouverture);
    event RisqueCalcule(address indexed emetteur, address indexed contrepartie, uint256 scoreRisque);

    // Fonction pour ajouter une nouvelle contrepartie
    function ajouterContrepartie(
        address _portefeuille,
        uint256 _scoreCredit,
        uint256 _limiteExposition,
        uint256 _collateral
    ) public {
        require(_portefeuille != address(0), "Adresse invalide"); // Vérifie que l'adresse est valide
        require(contreparties[_portefeuille].portefeuille == address(0), "Contrepartie existe deja"); // Empêche les doublons

        // Création et stockage de la contrepartie
        contreparties[_portefeuille] = Contrepartie({
            portefeuille: _portefeuille,
            scoreCredit: _scoreCredit,
            limiteExposition: _limiteExposition,
            expositionNette: 0,
            collateral: _collateral
        });

        // Ajout de l'adresse dans la liste
        contrepartieAddresses.push(_portefeuille);

        emit ContrepartieAjoutee(_portefeuille, _limiteExposition, _collateral); // Émission d'un événement
    }

    // Fonction pour mettre à jour l'exposition entre un émetteur et une contrepartie
    function mettreAJourExposition(
        address _emetteur,
        address _contrepartie,
        int256 _montant
    ) public {
        require(contreparties[_contrepartie].portefeuille != address(0), "Contrepartie inexistante"); // Vérifie l'existence de la contrepartie
        require(contreparties[_emetteur].portefeuille != address(0), "Emetteur inexistant"); // Vérifie l'existence de l'émetteur

        uint256 montantAbsolu = _montant >= 0 ? uint256(_montant) : uint256(-_montant); // Convertit le montant en valeur absolue
        require(montantAbsolu <= contreparties[_emetteur].limiteExposition, "Limite d'exposition depassee"); // Vérifie la limite d'exposition

        // Mise à jour des expositions nettes entre les deux parties
        expositionsNettes[_emetteur][_contrepartie] += _montant;
        expositionsNettes[_contrepartie][_emetteur] -= _montant;

        // Mise à jour des expositions nettes totales
        Contrepartie storage emetteur = contreparties[_emetteur];
        Contrepartie storage contrepartie = contreparties[_contrepartie];

        emetteur.expositionNette += _montant;
        contrepartie.expositionNette -= _montant;

        // Émission des événements pour refléter les mises à jour
        emit ExpositionMiseAJour(_contrepartie, contrepartie.expositionNette);
        emit ExpositionMiseAJour(_emetteur, emetteur.expositionNette);
    }

    // Fonction pour calculer le ratio de couverture d'une contrepartie
    function calculerRatioCouverture(
        address _emetteur,
        address _contrepartie
    ) public view returns (uint256) {
        require(contreparties[_emetteur].portefeuille != address(0), "Emetteur inexistant"); // Vérifie l'existence de l'émetteur
        require(contreparties[_contrepartie].portefeuille != address(0), "Contrepartie inexistante"); // Vérifie l'existence de la contrepartie

        // Récupère l'exposition nette entre les deux parties
        int256 pairwiseExposure = expositionsNettes[_contrepartie][_emetteur]; // Direction inverse
        require(pairwiseExposure < 0, "Exposition nette de la contrepartie doit etre negative"); // Vérifie que l'exposition est négative

        // Calcule le ratio en pourcentage
        uint256 absoluteExposure = uint256(-pairwiseExposure); // Convertit en valeur absolue
        uint256 collateral = contreparties[_contrepartie].collateral; // Récupère le collatéral
        return (collateral * 100) / absoluteExposure; // Retourne le ratio
    }

    // Fonction pour obtenir l'exposition nette totale d'une contrepartie
    function obtenirExpositionNette(address _contrepartie) public view returns (int256) {
        Contrepartie memory cp = contreparties[_contrepartie];
        require(cp.portefeuille != address(0), "Contrepartie inexistante"); // Vérifie l'existence de la contrepartie
        return cp.expositionNette; // Retourne l'exposition nette
    }

    // Fonction pour récupérer la liste des adresses des contreparties
    function getContreparties() public view returns (address[] memory) {
        return contrepartieAddresses; // Retourne la liste des adresses
    }

    // Fonction pour calculer le risque lié à une exposition
    function calculerRisque(
        address _emetteur,
        address _contrepartie
    ) public view returns (uint256) {
        require(contreparties[_emetteur].portefeuille != address(0), "Emetteur inexistant"); // Vérifie l'existence de l'émetteur
        require(contreparties[_contrepartie].portefeuille != address(0), "Contrepartie inexistante"); // Vérifie l'existence de la contrepartie

        Contrepartie memory emetteur = contreparties[_emetteur];
        Contrepartie memory contrepartie = contreparties[_contrepartie];

        // Utilise l'exposition nette pour le calcul du risque
        int256 pairwiseExposure = expositionsNettes[_emetteur][_contrepartie];
        require(pairwiseExposure >= 0, "Exposition courante doit etre positive"); // Vérifie que l'exposition est valide

        uint256 absoluteExposure = uint256(pairwiseExposure);

        // Vérifie les conditions d'entrée pour éviter des erreurs
        if (emetteur.limiteExposition == 0 || contrepartie.scoreCredit == 0) {
            return 0; // Retourne 0 si les entrées sont invalides
        }

        // Calcule le score de risque selon une formule spécifique
        uint256 firstPart = (absoluteExposure * 10000) / emetteur.limiteExposition; // Précision accrue
        uint256 secondPart = 10000 / contrepartie.scoreCredit; // Utilise le score de crédit
        return (firstPart * secondPart) / 10000; // Normalisation
    }
}
