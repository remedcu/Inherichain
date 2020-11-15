import constants from "@openzeppelin/test-helpers/src/constants";
import Web3 from "web3";
import Inherichain from "../build/contracts/Inherichain.json";
import Arbitrator from "../build/contracts/SimpleCentralizedArbitrator.json";

let web3;
let inherichain;
let arbitrator;
let accounts = [];
let arbitratorExtraData = `0x0`;
let metaEvidence = "";

const initWeb3 = () => {
  return new Promise((resolve, reject) => {
    // New Metamask
    if (typeof window.ethereum !== "undefined") {
      web3 = new Web3(window.ethereum);
      window.ethereum
        .enable()
        .then(() => {
          resolve(new Web3(window.ethereum));
        })
        .catch((error) => {
          reject(error);
        });
      return;
    }
    // Old Metamask
    if (typeof window.web3 !== "undefined") {
      return resolve(new Web3(window.web3.currentProvider));
    }
    // For ganache-cli (for Ganache GUI, use 9545 instead of 8545)
    resolve(new Web3("http://localhost:8545"));
  });
};

const initAccount = () => {
  web3.eth.getAccounts().then((_accounts) => {
    accounts = _accounts;
  });
};

const initApp = () => {
  const createWallet = document.getElementById("createWallet");
  const createWalletStatus = document.getElementById("createWalletStatus");

  createWallet.addEventListener("submit", async (e) => {
    createWalletStatus.innerHTML = "Transaction Pending...";
    e.preventDefault();
    let heir = e.target.elements[0].value;
    let approverOne = e.target.elements[1].value;

    let approvers = [];
    let owner = constants.ZERO_ADDRESS;
    let backupOwner = constants.ZERO_ADDRESS;
    let charity = constants.ZERO_ADDRESS;
    if (approverOne != "") {
      approvers.push(approverOne);
    }
    inherichain = await new web3.eth.Contract(Inherichain.abi);
    arbitrator = await new web3.eth.Contract(Arbitrator.abi);
    let arbitratorAddress = "";
    await arbitrator
      .deploy({
        data: Arbitrator.bytecode,
      })
      .send({
        from: accounts[0],
      })
      .then((instance) => {
        arbitrator = instance;
        arbitratorAddress = arbitrator.options.address;
        // Storing the data in localstorage (cache)
        localStorage.setItem(
          "simpleCentralizedArbitratorAddress",
          arbitratorAddress
        );
      });
    await inherichain
      .deploy({
        data: Inherichain.bytecode,
        arguments: [
          owner,
          backupOwner,
          heir,
          charity,
          arbitratorAddress,
          arbitratorExtraData,
          metaEvidence,
          approvers,
          0,
          0,
          0,
        ],
      })
      .send({
        from: accounts[0],
      })
      .then((instance) => {
        inherichain = instance;
        createWalletStatus.innerHTML = `Wallet was successfully created with address: ${inherichain.options.address}. Please keep this address saved somewhere. The arbitrator address is ${arbitratorAddress}`;
        // Storing the data in localstorage (cache)
        localStorage.setItem(
          "inherichainWalletAddress",
          inherichain.options.address
        );
      })
      .catch((err) => {
        createWalletStatus.innerHTML = `There was an error while creating a new Wallet.`;
        console.log(err);
      });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  initWeb3()
    .then((_web3) => {
      web3 = _web3;
      initAccount();
      initApp();
    })
    .catch((error) => {
      console.log(error);
    });
});
