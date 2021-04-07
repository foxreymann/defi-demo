
const DaiToken = artifacts.require('DaiToken');
const DappToken = artifacts.require('DappToken');
const TokenFarm = artifacts.require('TokenFarm');

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

      for(let i = 1; i < 10; i++) {
result = await tokenFarm.getDaiStakers()
console.log({result})
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

console.log(i)
console.log(accounts[i])
console.log(await tokenFarm.stakerIdx(accounts[i]))
        result = await tokenFarm.getDaiStakers()
console.log({result})
console.log('--------------')
        assert.equal(result.length, 9 - i)

        result = await tokenFarm.getDaiStakersBalance()
        assert.equal(result.length, 9 - i)
      }
    });
  });
});
