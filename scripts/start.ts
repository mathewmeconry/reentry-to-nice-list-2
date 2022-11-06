import {JsonRpcProvider} from "@ethersproject/providers";
import {BigNumber, Contract, ethers, Wallet} from "ethers";
import Ganache from "ganache";
import express from "express";
import path from "path";
import fs from "fs/promises";

import SantaCoin from "../artifacts/contracts/SantaCoin.sol/SantaCoin.json";
import NiceListV2 from "../artifacts/contracts/NiceListV2.sol/NiceListV2.json";

async function main() {
  const {attackerWallet, niceListV2, santaCoin} = await ganache();
  expressServer(attackerWallet, niceListV2, santaCoin);
}

async function expressServer(
  attackerWallet: Wallet,
  niceListv2: Contract,
  santaCoin: Contract
) {
  const app = express();
  const indexPage = await fs.readFile(
    path.join(__dirname, "../public/index.html")
  );
  const finalIndexPage = indexPage
    .toString()
    .replace("##SANTACOIN-ADDR##", santaCoin.address)
    .replace("##NICELISTV2-ADDR##", niceListv2.address)
    .replace("##PRIVATE-KEY##", attackerWallet.privateKey);

  app.get("/", (req, res) => {
    res.send(finalIndexPage);
  });
  app.get("/index.html", (req, res) => {
    res.send(finalIndexPage);
  });
  app.get("/isNice", async (req, res) => {
    const isNice = await niceListv2.isNice(attackerWallet.address);
    if (isNice) {
      res.send(`Your are nice! <br> Here is your flag: HV22{__N1c3__You__ARe__Ind33d__}`);
      return;
    } else {
      res.send("No you are not nice!");
    }
  });
  app.use(express.static(path.join(__dirname, "../public/")));

  app.listen("8080", () => {
    console.log("Express listening on 8080");
  });
}

async function ganache(): Promise<{
  attackerWallet: Wallet;
  niceListV2: Contract;
  santaCoin: Contract;
}> {
  return new Promise(async (resolve, reject) => {
    const server = Ganache.server({
      wallet: {
        totalAccounts: 1,
      },
      logging: {
        quiet: true,
      },
    });
    server.listen(8545, async (err) => {
      if (err) throw err;

      console.log(`ganache listening on port 8545...`);
      const ethersProvider = new JsonRpcProvider("http://127.0.0.1:8545");

      let randomWallet = Wallet.createRandom();
      randomWallet = randomWallet.connect(ethersProvider);
      console.log(`Random wallet: ${randomWallet.address}`);

      const initialAccounts = server.provider.getInitialAccounts();
      console.log(
        `Initial Accounts: ${Object.keys(initialAccounts).join(",")}`
      );

      console.log("Draining all initial accounts");
      for (const key in initialAccounts) {
        let initialAccount = new Wallet(initialAccounts[key].secretKey);
        await initialAccount.connect(ethersProvider).sendTransaction({
          to: randomWallet.address,
          value: BigNumber.from(initialAccounts[key].balance).sub(
            BigNumber.from(21000).mul(3500000000)
          ),
        });
      }
      console.log(
        `Drained: ${randomWallet.address} = ${ethers.utils.formatEther(
          await ethersProvider.getBalance(randomWallet.address)
        )} ETH`
      );

      const {niceListV2, santaCoin} = await deploy(randomWallet);
      await simulateUsers(randomWallet, santaCoin, niceListV2);

      const attackerWallet = await fundAttacker(randomWallet);

      console.log(`==== Attacker ====`);
      console.log(`Address: ${attackerWallet.address}`);
      console.log(`Private Key: ${attackerWallet.privateKey}`);
      console.log(
        `Funds: ${ethers.utils.formatEther(
          await ethersProvider.getBalance(attackerWallet.address)
        )} ETH`
      );
      console.log("Ready!");
      resolve({
        attackerWallet,
        niceListV2,
        santaCoin,
      });
    });
  });
}

async function deploy(wallet: Wallet) {
  console.log("Deploying contracts");
  const santaCoinFactory = new ethers.ContractFactory(
    SantaCoin.abi,
    SantaCoin.bytecode
  );
  const NiceListV2Factory = new ethers.ContractFactory(
    NiceListV2.abi,
    NiceListV2.bytecode
  );

  const santaCoin = await santaCoinFactory.connect(wallet).deploy();
  console.log(`Deployed SantaCoin: ${santaCoin.address}`);

  const niceListV2 = await NiceListV2Factory.connect(wallet).deploy(
    1671926400,
    ethers.utils.parseEther("100"),
    santaCoin.address
  );
  console.log(`Deployed NiceListV2: ${niceListV2.address}`);

  return {niceListV2, santaCoin};
}

async function simulateUsers(
  wallet: Wallet,
  santaCoin: Contract,
  NiceListV2: Contract
) {
  console.log("Simulating some users");
  for (let i = 0; i < 5; i++) {
    let randomWallet = Wallet.createRandom();
    randomWallet = randomWallet.connect(wallet.provider);
    await wallet.sendTransaction({
      to: randomWallet.address,
      value: ethers.utils.parseEther((20 * (i + 1) + 1).toString()),
    });
    await santaCoin.connect(randomWallet).buyCoins({
      value: ethers.utils.parseEther((20 * (i + 1)).toString()),
    });
    await santaCoin
      .connect(randomWallet)
      .increaseAllowance(
        NiceListV2.address,
        ethers.utils.parseEther((20 * (i + 1)).toString())
      );
    await NiceListV2.connect(randomWallet).buyIn(
      ethers.utils.parseEther((20 * (i + 1)).toString())
    );
  }
}

async function fundAttacker(wallet: Wallet) {
  const randomWallet = Wallet.createRandom();
  await wallet.sendTransaction({
    to: randomWallet.address,
    value: ethers.utils.parseEther("1.5"),
  });
  return randomWallet;
}

main();
