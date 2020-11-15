import Web3 from "web3";
import Inherichain from "../build/contracts/Inherichain.json";

let web3;
let inherichain;
let accounts = [];
let status = [
  "Initial",
  "Heir Claimed",
  "Approver Approved",
  "Initiated Charity",
];

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

const initContract = (address) => {
  return new web3.eth.Contract(Inherichain.abi, address);
};

const initAccount = () => {
  web3.eth.getAccounts().then((_accounts) => {
    accounts = _accounts;
  });
};

const checkRights = () => {
  let charityHTML = document.getElementById("charityHTML");
  inherichain.methods
    .charity()
    .call({ from: accounts[0] })
    .then((values) => {
      if (values != accounts[0]) {
        window.alert("You don't have the rights of charity.");
      } else {
        charityHTML.innerHTML =
          '<h3>Welcome Charity!</h3><hr><div class="row"><div class="col-sm-12"><h5>Access Ownership</h5><form id="accessWalletCharity"><div class="form-group"><div class="row"><div class="col-sm-6"><label for="setBackupOwner">Backup Owner :</label><input id="setBackupOwner" type="text" class="form-control"placeholder="Leave blank if no backup owner."></div><div class="col-sm-6"><label for="setHeir">Heir :</label><input id="setHeir" type="text" class="form-control"placeholder="Enter heir address." required></div></div><br><div class="row"><div class="col-sm-4"><label for="setApproverOne">Approver 1 :</label><input id="setApproverOne" type="text" class="form-control"placeholder="Enter Approver One Address."></div><div class="col-sm-4"><label for="setApproverTwo">Approver 2 :</label><input id="setApproverTwo" type="text" class="form-control"placeholder="Enter Approver Two Address."></div><div class="col-sm-4"><label for="setApproverThree">Approver 3 :</label><input id="setApproverThree" type="text" class="form-control"placeholder="Enter Approver Three Address."></div></div><br><div class="row"><div class="col-sm-4"><label for="setDeadline">Deadline :</label><input id="setDeadline" type="number" class="form-control"placeholder="Enter deadline duration." step="any"></div><div class="col-sm-4"><label for="setApproverDeadline">Approver Deadline :</label><input id="setApproverDeadline" type="number" class="form-control"placeholder="Enter approver deadline duration." step="any"></div><div class="col-sm-4"><label for="setCharityDeadline">Charity Deadline :</label><input id="setCharityDeadline" type="number" class="form-control"placeholder="Enter charity deadline duration." step="any"></div></div></div><button type="submit" class="btn btn-primary">Access</button><div id="accessWalletCharityStatus"></div></form></div></div><hr><hr><hr>';
        initApp();
      }
    })
    .catch((error) => {
      charityHTML.innerHTML = "There was an error while reading the data.";
      console.log(error);
    });
};

const initWalletAddress = () => {
  let charityHTML = document.getElementById("charityHTML");
  charityHTML.innerHTML =
    '<div class="row"><div class="col-sm-12"><h1>Interact with your Wallet Contract</h1><div class="row"><div class="col-sm-12"><form id="setAddress"><div class="form-group"><label for="walletAddress">Wallet Contract Address :</label><input id="walletAddress" type="text" class="form-control"></div><button type="submit" class="btn btn-info">Interact</button><div id="interactStatus"></div></form></div></div></div></div>';
  const setAddress = document.getElementById("setAddress");
  const walletAddress = document.getElementById("walletAddress");
  walletAddress.value = localStorage.getItem("inherichainWalletAddress");
  setAddress.addEventListener("submit", (e) => {
    e.preventDefault();
    const address = e.target.elements[0].value;
    inherichain = initContract(address);
    inherichain.methods
      .heir()
      .call({ from: accounts[0] })
      .then((values) => {
        // Storing the data in localstorage (cache)
        localStorage.setItem("inherichainWalletAddress", address);
        checkRights();
      })
      .catch((error) => {
        window.alert("Please check if it is an Inherichain Wallet.");
        console.log(error);
      });
  });
};

const clearStatus = () => {
  const accessWalletCharityStatus = document.getElementById(
    "accessWalletCharityStatus"
  );

  accessWalletCharityStatus.innerHTML = "";
};

const initApp = () => {
  const accessWalletCharity = document.getElementById("accessWalletCharity");

  const accessWalletCharityStatus = document.getElementById(
    "accessWalletCharityStatus"
  );

  accessWalletCharity.addEventListener("submit", async (e) => {
    clearStatus();
    accessWalletCharityStatus.innerHTML = "Transaction Pending...";
    e.preventDefault();
    const backupOwner = e.target.elements[0].value;
    const heir = e.target.elements[1].value;
    const approverOne = e.target.elements[2].value;
    const approverTwo = e.target.elements[3].value;
    const approverThree = e.target.elements[4].value;
    const deadline = Number(e.target.elements[5].value);
    const approverDeadline = Number(e.target.elements[6].value);
    const charityDeadline = Number(e.target.elements[7].value);
    inherichain.methods
      .accessOwnershipFromCharity(
        backupOwner,
        heir,
        [approverOne, approverTwo, approverThree],
        deadline,
        approverDeadline,
        charityDeadline
      )
      .send({ from: accounts[0] })
      .then(() => {
        accessWalletCharityStatus.innerHTML = `Success!`;
      })
      .catch((error) => {
        accessWalletCharityStatus.innerHTML = `There was an error!`;
        console.log(error);
      });
  });
};

ethereum.on("accountsChanged", function (acc) {
  // Time to reload your interface with accounts[0]!
  if (acc.length === 0) {
    // MetaMask is locked or the user has not connected any accounts
    console.log("Please connect to MetaMask.");
  } else {
    initWeb3()
      .then((_web3) => {
        web3 = _web3;
        initAccount();
        initWalletAddress();
      })
      .catch((error) => {
        console.log(error);
      });
  }
});
