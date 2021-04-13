const Token = artifacts.require('Tkn');
const PunchFarm = artifacts.require('PunchFarm');

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

contract('PunchFarm', (accounts) => {
  let token, farm;

  let [owner, investor] = accounts

  before(async () => {
    // Load Contracts
    token = await Token.new();
    farm = await PunchFarm.new(token.address);

    for(let i = 1; i < 10; i++) {
      await token.transfer(accounts[i], tokens('100'), { from: owner });
    }
  });

  describe('Farming Dapp tokens', async () => {
    it('shuffle staking', async () => {
      let result;

      // [1]
      await token.approve(farm.address, tokens('100'), { from: investor });

      let web3Receipt = await farm.stakeTokens(tokens('100'), { from: investor });
      expectEvent(web3Receipt, 'StakedTokens', {
        staker: investor,
        amount: tokens('100')
      });

      // [1,4]
      await token.approve(farm.address, tokens('100'), { from: accounts[4]});
      await farm.stakeTokens(tokens('100'), { from: accounts[4] });

      // [1,4,2]
      await token.approve(farm.address, tokens('100'), { from: accounts[2]});
      await farm.stakeTokens(tokens('100'), { from: accounts[2] });

      // [4,2]
      await farm.unstakeTokens({ from: investor });

      // [4]
      web3Receipt = await farm.unstakeTokens({ from: accounts[2] });
      expectEvent(web3Receipt, 'UnstakedTokens', {
        staker: accounts[2],
        amount: tokens('100')
      });

      // [4,3]
      await token.approve(farm.address, tokens('100'), { from: accounts[3]});
      await farm.stakeTokens(tokens('100'), { from: accounts[3] });

      // [4,3,1]
      await token.approve(farm.address, tokens('100'), { from: investor });
      await farm.stakeTokens(tokens('100'), { from: investor });

      // [4,1]
      await farm.unstakeTokens({ from: accounts[3] });

      result = await farm.getStakers()
      expect(result).to.have.members([accounts[4],investor]);

      result = await farm.getStakersBalance()
      assert.equal(result.length, 2)
      assert.equal(result[1].staker, investor)

      result = await farm.getStakersLength()
      assert.equal(result, 2)

      await farm.unstakeTokens({ from: accounts[4] });
      await farm.unstakeTokens({ from: accounts[1] });

    });

    it('rewards investor for staking Mock  tokens', async () => {
      let result;

      // Check investor balance before staking
      result = await token.balanceOf(investor);
      assert.equal(result.toString(), tokens('100'), 'investor Mock  wallet balance correct before staking');

      // Stake Mock  Tokens
      await token.approve(farm.address, tokens('100'), { from: investor });
      await farm.stakeTokens(tokens('100'), { from: investor });
      // Check staking result
      result = await token.balanceOf(investor);
      assert.equal(result.toString(), tokens('0'), 'investor Mock  wallet balance correct after staking');

      result = await token.balanceOf(farm.address);
      assert.equal(result.toString(), tokens('100'), 'Token Farm Mock  balance correct after staking');

      result = await farm.stakingBalance(investor);
      assert.equal(result.toString(), tokens('100'), 'investor staking balance correct after staking');

      result = await farm.isStaking(investor);
      assert.equal(result.toString(), 'true', 'investor staking status correct after staking');

      // query all stakers - 1 staker
      result = await farm.getStakers()
      expect(result).to.have.members([investor]);

      // query all stakers balance - 1 staker
      result = await farm.getStakersBalance()
      assert.equal(result.length, 1)
      assert.equal(result[0].staker, investor)
      assert.equal(result[0].balance, tokens('100'))

      // Unstake tokens
      await farm.unstakeTokens({ from: investor });

      result = await farm.getStakers()
      assert.equal(result.length, 0)

      result = await farm.getStakersBalance()
      assert.equal(result.length, 0)

      // Check results after unstaking
      result = await token.balanceOf(investor);
      assert.equal(result.toString(), tokens('100'), 'investor Mock  wallet balance correct after unstaking');

      result = await token.balanceOf(farm.address);
      assert.equal(result.toString(), tokens('0'), 'Token Farm Mock  balance correct after unstaking');

      result = await farm.stakingBalance(investor);
      assert.equal(result.toString(), tokens('0'), 'investor staking balance correct after unstaking');

      result = await farm.isStaking(investor);
      assert.equal(result.toString(), 'false', 'investor staking status correct after unstaking');
    });

    it('rewards investors for staking Mock  tokens', async () => {
      let result;
      let investors = accounts.slice(1)

      for(let i = 1; i < 10; i++) {
        result = await token.balanceOf(accounts[i]);
        assert.equal(result.toString(), tokens('100'), 'accounts[i] Mock  wallet balance correct before staking');

        // Stake Mock  Tokens
        await token.approve(farm.address, tokens('100'), { from: accounts[i] });
        await farm.stakeTokens(tokens('100'), { from: accounts[i] });

        // Check staking result
        result = await token.balanceOf(accounts[i]);
        assert.equal(result.toString(), tokens('0'), 'accounts[i] Mock  wallet balance correct after staking');

        result = await token.balanceOf(farm.address);
        assert.equal(result.toString(), tokens(100*i + ''), 'Token Farm Mock  balance correct after staking');

        result = await farm.stakingBalance(accounts[i]);
        assert.equal(result.toString(), tokens('100'), 'accounts[i] staking balance correct after staking');

        result = await farm.isStaking(accounts[i]);
        assert.equal(result.toString(), 'true', 'accounts[i] staking status correct after staking');
      }

      // query all stakers - 9 stakers
      result = await farm.getStakers()
      expect(result).to.have.members(investors);

      result = await farm.getStakersBalance()
      assert.equal(result.length, 9)
      assert.equal(result[0].staker, investor)
      assert.equal(result[0].balance, tokens('100'))
      assert.equal(result[8].staker, accounts[9])
      assert.equal(result[8].balance, tokens('100'))

      result = await farm.getStakersLength()
      assert.equal(result, 9)

      for(let i = 1; i < 10; i++) {
        // Unstake tokens
        await farm.unstakeTokens({ from: accounts[i] });

        // Check results after unstaking
        result = await token.balanceOf(accounts[i]);
        assert.equal(result.toString(), tokens('100'), 'accounts[i] Mock  wallet balance correct after unstaking');

        result = await token.balanceOf(farm.address);
        assert.equal(result.toString(), tokens((900 - 100*i) + ''), 'Token Farm Mock  balance correct after unstaking');

        result = await farm.stakingBalance(accounts[i]);
        assert.equal(result.toString(), tokens('0'), 'accounts[i] staking balance correct after unstaking');

        result = await farm.isStaking(accounts[i]);
        assert.equal(result.toString(), 'false', 'accounts[i] staking status correct after unstaking');

        result = await farm.getStakers()
        assert.equal(result.length, 9 - i)

        result = await farm.getStakersBalance()
        assert.equal(result.length, 9 - i)
      }
    });
  });

  describe('Token withdrawal', async () => {

    it('allows to withdraw Mock  tokens', async () => {
        let result;
        await token.approve(farm.address, tokens('100'), { from: investor });
        await farm.stakeTokens(tokens('100'), { from: investor });
        let initTokenFarmBal = await token.balanceOf(farm.address);
        assert.equal(initTokenFarmBal.toString(), tokens('100'))

        await farm.transferAnyERC20Token(token.address, tokens('60'))

        let finalTokenFarmBal = await token.balanceOf(farm.address);
        assert.equal(finalTokenFarmBal.toString(), tokens('40'))
    })
  })

  it('rejects ETH deposit', async () => {
    await expectRevert.unspecified(
      web3.eth.sendTransaction({to:farm.address, from:owner, value:tokens('1')})
    )
  })
});
