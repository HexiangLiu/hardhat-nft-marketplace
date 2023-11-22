import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { developmentChains } from '../../const';
import { BasicNFT } from '../../typechain-types';
import { assert } from 'console';

const TOKEN_URI =
  'ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json';

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('BasicNFT', () => {
      let BasicNFT: BasicNFT;
      let deployer: string;
      const TOEKN_ID = 0;
      beforeEach(async () => {
        ({ deployer } = await getNamedAccounts());
        await deployments.fixture('basicNft');
        BasicNFT = await ethers.getContract('BasicNFT');
      });
      describe('mintNFT', () => {
        it('mint nft to user and update tokenCounter', async () => {
          await BasicNFT.mintNft();
          const owner = await BasicNFT.ownerOf(TOEKN_ID);
          const tokenURI = await BasicNFT.tokenURI(TOEKN_ID);
          const tokenCounter = await BasicNFT.getTokenCounter();
          assert(owner === deployer);
          assert(tokenURI === TOKEN_URI);
          assert(tokenCounter.toString() === '1');
        });
      });
    });
