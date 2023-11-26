import { readFileSync, writeFileSync } from 'node:fs';
import { ethers, network } from 'hardhat';

const FRONT_END_ADDRESS_FILE =
  '../nextjs-nft-marketplace-subgraph/src/constants/contractAddress.json';
const FRONT_END_ABI_FILE =
  '../nextjs-nft-marketplace-subgraph/src/constants/abi.json';

const updateFrontEnd = async () => {
  console.log('Updating front end...');
  await updateContractAddress();
  await updateAbi();
};

const updateContractAddress = async () => {
  const BasicNFT = await ethers.getContract('BasicNFT');
  const basicNFTAddress = await BasicNFT.getAddress();
  const NftMarketplace = await ethers.getContract('NftMarketplace');
  const nftMarketplaceAddress = await NftMarketplace.getAddress();
  const chainId = network.config.chainId as number;
  const contractAddress = JSON.parse(
    readFileSync(FRONT_END_ADDRESS_FILE, 'utf-8')
  );
  if (!contractAddress[chainId]) {
    contractAddress[chainId] = {};
  }
  contractAddress[chainId].basicNFTAddress = basicNFTAddress;
  contractAddress[chainId].nftMarketplaceAddress = nftMarketplaceAddress;
  writeFileSync(FRONT_END_ADDRESS_FILE, JSON.stringify(contractAddress));
};

const updateAbi = async () => {
  const BasicNFT = await ethers.getContract('BasicNFT');
  const NftMarketplace = await ethers.getContract('NftMarketplace');
  const contractAbi = JSON.parse(readFileSync(FRONT_END_ABI_FILE, 'utf-8'));
  contractAbi.basicNFTAbi = BasicNFT.interface.formatJson();
  contractAbi.nftMarketplaceAbi = NftMarketplace.interface.formatJson();
  writeFileSync(FRONT_END_ABI_FILE, JSON.stringify(contractAbi));
};

updateFrontEnd.tags = ['update'];

export default updateFrontEnd;
