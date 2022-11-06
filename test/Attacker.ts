import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {ethers} from "hardhat";
import {NiceListV2, SantaCoin, Attacker} from "../typechain-types";

describe("Attacker", async () => {
  let santaCoin: SantaCoin;
  let niceListV2: NiceListV2;
  let attackerContract: Attacker;
  let deployer: SignerWithAddress;
  let user: SignerWithAddress;
  let attacker: SignerWithAddress;

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    deployer = signers[0];
    user = signers[1];
    attacker = signers[2];

    const santaCoinFactory = await ethers.getContractFactory("SantaCoin");
    const NiceListV2Factory = await ethers.getContractFactory("NiceListV2");
    const attackerFactory = await ethers.getContractFactory("Attacker");

    santaCoin = await santaCoinFactory.deploy();
    niceListV2 = await NiceListV2Factory.deploy(
      5,
      ethers.utils.parseEther("10"),
      santaCoin.address
    );
    attackerContract = await attackerFactory
      .connect(attacker)
      .deploy(niceListV2.address, santaCoin.address);

    await santaCoin
      .connect(user)
      .buyCoins({value: ethers.utils.parseEther("10")});
    await santaCoin
      .connect(user)
      .increaseAllowance(niceListV2.address, ethers.utils.parseEther("10"));
    await niceListV2.connect(user).buyIn(ethers.utils.parseEther("10"));
  });

  it("should double", async () => {
    await attackerContract
      .connect(attacker)
      .fundContract({value: ethers.utils.parseEther("1")});
    await attackerContract
      .connect(attacker)
      .attack(ethers.utils.parseEther("1"));
    expect(await ethers.provider.getBalance(attackerContract.address)).to.be.eq(
      ethers.utils.parseEther("2")
    );
  });

  it("should double twice", async () => {
    await attackerContract
      .connect(attacker)
      .fundContract({value: ethers.utils.parseEther("1")});
    await attackerContract
      .connect(attacker)
      .attack(ethers.utils.parseEther("1"));
    await attackerContract
      .connect(attacker)
      .attack(ethers.utils.parseEther("2"));

    expect(await ethers.provider.getBalance(attackerContract.address)).to.be.eq(
      ethers.utils.parseEther("4")
    );
  });
});
