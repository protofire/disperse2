import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Disperse contract...");

  const Disperse = await ethers.getContractFactory("Disperse");
  const disperse = await Disperse.deploy();
  await disperse.waitForDeployment();

  const address = await disperse.getAddress();
  console.log("Disperse deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 