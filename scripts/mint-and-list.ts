import { ethers, getNamedAccounts } from 'hardhat';
import { BasicNFT, NftMarketplace } from '../typechain-types';

const mintAndList = async () => {
  const { deployer } = await getNamedAccounts();
  const BasicNFT: BasicNFT = await ethers.getContract('BasicNFT', deployer);
  const NftMarketplace: NftMarketplace = await ethers.getContract(
    'NftMarketplace',
    deployer
  );
  const marketAddress = await NftMarketplace.getAddress();
  const nftAddress = await BasicNFT.getAddress();

  // Basic NFT
  const mintTx = await BasicNFT.mintNft();
  console.log('Minting...');
  const mintTxReceipt = await mintTx.wait();
  // @ts-ignore
  const tokenId = mintTxReceipt.logs[1].args[0];
  console.log('Approving Nft...');
  const approveTx = await BasicNFT.approve(marketAddress, tokenId);
  await approveTx.wait();

  // NFT Marketplace
  console.log('listing NFT...');
  const tx = await NftMarketplace.listItem(
    nftAddress,
    tokenId,
    ethers.parseEther('0.001')
  );
  await tx.wait();
  console.log('Listed!');
};

mintAndList()
  .then(() => process.exit())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
