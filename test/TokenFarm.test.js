const DaiToken = artifacts.require('DaiToken');
const DappToken = artifacts.require('DappToken');
const TokenFarm = artifacts.require('TokenFarm');

const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
  time
} = require('@openzeppelin/test-helpers');

require('chai')
  .use(require('chai-as-promised'))
  .should();

function tokens(n) {
  return web3.utils.toWei(n, 'ether');
}

contract('TokenFarm', (accounts) => {
  let daiToken, dappToken, tokenFarm;

  let [owner, investor] = accounts

  before(async () => {
    // Load Contracts
    daiToken = await DaiToken.new();
    dappToken = await DappToken.new();
    tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address);

    // Transfer all Dapp tokens to farm (1 million)
    await dappToken.transfer(tokenFarm.address, tokens('1000000'));

    for(let i = 1; i < 10; i++) {
      await daiToken.transfer(accounts[i], tokens('100'), { from: owner });
    }
  });

  describe('Mock DAI Token deployment', async () => {
    it('Mock DAI Token has a name', async () => {
      const name = await daiToken.name();
      assert.equal(name, 'Mock DAI Token');
    });
  });

  describe('Dapp Token deployment', async () => {
    it('Dapp Token has a name', async () => {
      const name = await dappToken.name();
      assert.equal(name, 'DApp Token');
    });
  });

  describe('Token Farm deployment', async () => {
    it('Token Farm has a name', async () => {
      const name = await tokenFarm.name();
      assert.equal(name, 'Dapp Token Farm');
    });

    it('Token Farm contract has all Dapp tokens', async () => {
      let balance = await dappToken.balanceOf(tokenFarm.address);
      assert.equal(balance.toString(), tokens('1000000'));
    });
  });

  describe('Farming Dapp tokens', async () => {
    it('shuffle staking', async () => {
      let result;

      // [1]
      await daiToken.approve(tokenFarm.address, tokens('100'), { from: investor });
      await tokenFarm.stakeDaiTokens(tokens('100'), { from: investor });

      // [1,4]
      await daiToken.approve(tokenFarm.address, tokens('100'), { from: accounts[4]});
      await tokenFarm.stakeDaiTokens(tokens('100'), { from: accounts[4] });

      // [1,4,2]
      await daiToken.approve(tokenFarm.address, tokens('100'), { from: accounts[2]});
      await tokenFarm.stakeDaiTokens(tokens('100'), { from: accounts[2] });

      // [4,2]
      await tokenFarm.unstakeDaiTokens({ from: investor });

      // [4]
      await tokenFarm.unstakeDaiTokens({ from: accounts[2] });

      // [4,3]
      await daiToken.approve(tokenFarm.address, tokens('100'), { from: accounts[3]});
      await tokenFarm.stakeDaiTokens(tokens('100'), { from: accounts[3] });

      // [4,3,1]
      await daiToken.approve(tokenFarm.address, tokens('100'), { from: investor });
      await tokenFarm.stakeDaiTokens(tokens('100'), { from: investor });

      // [4,1]
      await tokenFarm.unstakeDaiTokens({ from: accounts[3] });

      result = await tokenFarm.getDaiStakers()
      expect(result).to.have.members([accounts[4],investor]);

      result = await tokenFarm.getDaiStakersBalance()
      assert.equal(result.length, 2)
      assert.equal(result[1].staker, investor)

      result = await tokenFarm.getDaiStakersLength()
      assert.equal(result, 2)

      await tokenFarm.unstakeDaiTokens({ from: accounts[4] });
      await tokenFarm.unstakeDaiTokens({ from: accounts[1] });

    });

    it('rewards investor for staking Mock DAI tokens', async () => {
      let result;

      // Check investor balance before staking
      result = await daiToken.balanceOf(investor);
      assert.equal(result.toString(), tokens('100'), 'investor Mock DAI wallet balance correct before staking');

      // Stake Mock DAI Tokens
      await daiToken.approve(tokenFarm.address, tokens('100'), { from: investor });
      await tokenFarm.stakeDaiTokens(tokens('100'), { from: investor });
      // Check staking result
      result = await daiToken.balanceOf(investor);
      assert.equal(result.toString(), tokens('0'), 'investor Mock DAI wallet balance correct after staking');

      result = await daiToken.balanceOf(tokenFarm.address);
      assert.equal(result.toString(), tokens('100'), 'Token Farm Mock DAI balance correct after staking');

      result = await tokenFarm.stakingBalance(investor);
      assert.equal(result.toString(), tokens('100'), 'investor staking balance correct after staking');

      result = await tokenFarm.isStaking(investor);
      assert.equal(result.toString(), 'true', 'investor staking status correct after staking');

      // query all stakers - 1 staker
      result = await tokenFarm.getDaiStakers()
      expect(result).to.have.members([investor]);

      // query all stakers balance - 1 staker
      result = await tokenFarm.getDaiStakersBalance()
      assert.equal(result.length, 1)
      assert.equal(result[0].staker, investor)
      assert.equal(result[0].balance, tokens('100'))

      // Unstake tokens
      await tokenFarm.unstakeDaiTokens({ from: investor });

      result = await tokenFarm.getDaiStakers()
      assert.equal(result.length, 0)

      result = await tokenFarm.getDaiStakersBalance()
      assert.equal(result.length, 0)

      // Check results after unstaking
      result = await daiToken.balanceOf(investor);
      assert.equal(result.toString(), tokens('100'), 'investor Mock DAI wallet balance correct after unstaking');

      result = await daiToken.balanceOf(tokenFarm.address);
      assert.equal(result.toString(), tokens('0'), 'Token Farm Mock DAI balance correct after unstaking');

      result = await tokenFarm.stakingBalance(investor);
      assert.equal(result.toString(), tokens('0'), 'investor staking balance correct after unstaking');

      result = await tokenFarm.isStaking(investor);
      assert.equal(result.toString(), 'false', 'investor staking status correct after unstaking');
    });

    it('rewards investors for staking Mock DAI tokens', async () => {
      let result;
      let investors = accounts.slice(1)

      for(let i = 1; i < 10; i++) {
        result = await daiToken.balanceOf(accounts[i]);
        assert.equal(result.toString(), tokens('100'), 'accounts[i] Mock DAI wallet balance correct before staking');

        // Stake Mock DAI Tokens
        await daiToken.approve(tokenFarm.address, tokens('100'), { from: accounts[i] });
        await tokenFarm.stakeDaiTokens(tokens('100'), { from: accounts[i] });

        // Check staking result
        result = await daiToken.balanceOf(accounts[i]);
        assert.equal(result.toString(), tokens('0'), 'accounts[i] Mock DAI wallet balance correct after staking');

        result = await daiToken.balanceOf(tokenFarm.address);
        assert.equal(result.toString(), tokens(100*i + ''), 'Token Farm Mock DAI balance correct after staking');

        result = await tokenFarm.stakingBalance(accounts[i]);
        assert.equal(result.toString(), tokens('100'), 'accounts[i] staking balance correct after staking');

        result = await tokenFarm.isStaking(accounts[i]);
        assert.equal(result.toString(), 'true', 'accounts[i] staking status correct after staking');
      }

      // query all stakers - 9 stakers
      result = await tokenFarm.getDaiStakers()
      expect(result).to.have.members(investors);

      result = await tokenFarm.getDaiStakersBalance()
      assert.equal(result.length, 9)
      assert.equal(result[0].staker, investor)
      assert.equal(result[0].balance, tokens('100'))
      assert.equal(result[8].staker, accounts[9])
      assert.equal(result[8].balance, tokens('100'))

      result = await tokenFarm.getDaiStakersLength()
      assert.equal(result, 9)

      for(let i = 1; i < 10; i++) {
        // Unstake tokens
        await tokenFarm.unstakeDaiTokens({ from: accounts[i] });

        // Check results after unstaking
        result = await daiToken.balanceOf(accounts[i]);
        assert.equal(result.toString(), tokens('100'), 'accounts[i] Mock DAI wallet balance correct after unstaking');

        result = await daiToken.balanceOf(tokenFarm.address);
        assert.equal(result.toString(), tokens((900 - 100*i) + ''), 'Token Farm Mock DAI balance correct after unstaking');

        result = await tokenFarm.stakingBalance(accounts[i]);
        assert.equal(result.toString(), tokens('0'), 'accounts[i] staking balance correct after unstaking');

        result = await tokenFarm.isStaking(accounts[i]);
        assert.equal(result.toString(), 'false', 'accounts[i] staking status correct after unstaking');

        result = await tokenFarm.getDaiStakers()
        assert.equal(result.length, 9 - i)

        result = await tokenFarm.getDaiStakersBalance()
        assert.equal(result.length, 9 - i)
      }
    });
  });

  describe('Token withdrawal', async () => {

    it('allows to withdraw Mock DAI tokens', async () => {
        let result;
        await daiToken.approve(tokenFarm.address, tokens('100'), { from: investor });
        await tokenFarm.stakeDaiTokens(tokens('100'), { from: investor });

        let initTokenFarmBal = await daiToken.balanceOf(tokenFarm.address);
        assert.equal(initTokenFarmBal.toString(), tokens('100'))

        await tokenFarm.transferAnyERC20Token(daiToken.address, tokens('60'))

        let finalTokenFarmBal = await daiToken.balanceOf(tokenFarm.address);
        assert.equal(finalTokenFarmBal.toString(), tokens('40'))
    })
  })

/*
  describe('Token withdrawal', async () => {

    it('allows to withdraw Mock DAI tokens', async () => {
        let result;
        await daiToken.approve(tokenFarm.address, tokens('100'), { from: investor });
        await tokenFarm.stakeDaiTokens(tokens('100'), { from: investor });

        let initTokenFarmBal = await daiToken.balanceOf(tokenFarm.address);
        assert.equal(initTokenFarmBal.toString(), tokens('100'))

        await tokenFarm.transferAnyERC20Token(daiToken.address, tokens('60'))

        let finalTokenFarmBal = await daiToken.balanceOf(tokenFarm.address);
        assert.equal(finalTokenFarmBal.toString(), tokens('40'))
    })
  })
*/

  it('rejects ETH deposit', async () => {
    await expectRevert.unspecified(
      web3.eth.sendTransaction({to:tokenFarm.address, from:owner, value:tokens('1')})
    )
  })
});
