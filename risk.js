let provider;
let signer;
let contract;

const contractAddress = "0x90B9c22d04A49bEcDa1eb4D7BaFb3221572FBd68"; 
const contractABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_portefeuille",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_scoreCredit",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_limiteExposition",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_collateral",
				"type": "uint256"
			}
		],
		"name": "ajouterContrepartie",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "contrepartie",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "limiteExposition",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "collateral",
				"type": "uint256"
			}
		],
		"name": "ContrepartieAjoutee",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "contrepartie",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "int256",
				"name": "expositionNette",
				"type": "int256"
			}
		],
		"name": "ExpositionMiseAJour",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_emetteur",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_contrepartie",
				"type": "address"
			},
			{
				"internalType": "int256",
				"name": "_montant",
				"type": "int256"
			}
		],
		"name": "mettreAJourExposition",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "emetteur",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "contrepartie",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "ratioCouverture",
				"type": "uint256"
			}
		],
		"name": "RatioCouvertureCalcule",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "emetteur",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "contrepartie",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "scoreRisque",
				"type": "uint256"
			}
		],
		"name": "RisqueCalcule",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_emetteur",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_contrepartie",
				"type": "address"
			}
		],
		"name": "calculerRatioCouverture",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_emetteur",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_contrepartie",
				"type": "address"
			}
		],
		"name": "calculerRisque",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "contreparties",
		"outputs": [
			{
				"internalType": "address",
				"name": "portefeuille",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "scoreCredit",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "limiteExposition",
				"type": "uint256"
			},
			{
				"internalType": "int256",
				"name": "expositionNette",
				"type": "int256"
			},
			{
				"internalType": "uint256",
				"name": "collateral",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContreparties",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_contrepartie",
				"type": "address"
			}
		],
		"name": "obtenirExpositionNette",
		"outputs": [
			{
				"internalType": "int256",
				"name": "",
				"type": "int256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];


async function connectWallet() {
    if (window.ethereum) {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            const address = await signer.getAddress();
            document.getElementById("walletStatus").innerText = `Connected: ${address}`;
        } catch (err) {
            console.error("Wallet connection failed:", err);
        }
    } else {
        alert("Please install MetaMask!");
    }
}

async function ajouterContrepartie() {
    const portefeuille = document.getElementById("portefeuille").value;
    const scoreCredit = document.getElementById("scoreCredit").value;
    const limiteExposition = document.getElementById("limiteExposition").value;
    const collateral = document.getElementById("collateral").value;

    try {
        const tx = await contract.ajouterContrepartie(portefeuille, scoreCredit, limiteExposition, collateral);
        await tx.wait();
        alert("Contrepartie ajoutée avec succès!");
    } catch (err) {
        console.error("Erreur:", err);
        alert("Erreur lors de l'ajout de la contrepartie.");
    }
}

async function mettreAJourExposition() {
    const emetteur = document.getElementById("emetteur").value;
    const contrepartie = document.getElementById("contrepartie").value;
    const montant = document.getElementById("montant").value;

    try {
        const tx = await contract.mettreAJourExposition(emetteur, contrepartie, montant);
        await tx.wait();
        alert("Exposition mise à jour!");
    } catch (err) {
        console.error("Erreur:", err);
        alert("Erreur lors de la mise à jour.");
    }
}

async function calculerRatio() {
    const emetteur = document.getElementById("emetteurRatio").value;
    const contrepartie = document.getElementById("contrepartieRatio").value;

    try {
        const ratio = await contract.calculerRatioCouverture(emetteur, contrepartie);
        document.getElementById("ratioResult").innerText = `Ratio: ${ratio}%`;
    } catch (err) {
        console.error("Erreur:", err);
        alert("Erreur lors du calcul du ratio.");
    }
}

async function calculerRisque() {
    const emetteur = document.getElementById("emetteurRisque").value;
    const contrepartie = document.getElementById("contrepartieRisque").value;

    try {
        const risque = await contract.calculerRisque(emetteur, contrepartie);
        document.getElementById("risqueResult").innerText = `Risque: ${risque}`;
    } catch (err) {
        console.error("Erreur:", err);
        alert("Erreur lors du calcul du risque.");
    }
}

async function obtenirExpositionNette() {
    const contrepartie = document.getElementById("adresseExposition").value;

    try {
        const exposition = await contract.obtenirExpositionNette(contrepartie);
        document.getElementById("expositionResult").innerText = `Exposition Nette: ${exposition}`;
    } catch (err) {
        console.error("Erreur:", err);
        alert("Erreur lors de l'obtention de l'exposition nette.");
    }
}

async function getContreparties() {
    try {
        const contreparties = await contract.getContreparties();
        document.getElementById("contrepartiesList").innerText = `Contreparties: ${contreparties.join(", ")}`;
    } catch (err) {
        console.error("Erreur:", err);
        alert("Erreur lors de l'obtention des contreparties.");
    }
}

document.getElementById("connectWallet").addEventListener("click", connectWallet);
document.getElementById("ajouterContrepartie").addEventListener("click", ajouterContrepartie);
document.getElementById("mettreAJourExposition").addEventListener("click", mettreAJourExposition);
document.getElementById("calculerRatio").addEventListener("click", calculerRatio);
document.getElementById("calculerRisque").addEventListener("click", calculerRisque);
document.getElementById("obtenirExposition").addEventListener("click", obtenirExpositionNette);
document.getElementById("getContreparties").addEventListener("click", getContreparties);
