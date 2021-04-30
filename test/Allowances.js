const Allowances = artifacts.require('Allowances');

const {
  // BN,           // Big Number support
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

contract('Allowances', (accounts) => {
  let token, farm;

  let [owner, bot] = accounts

  beforeEach(async () => {
    allowances = await Allowances.new();
  })

  it('set allowances for 8 players', async () => {
    const params = []

    // set array in a for loop
    for(let i = 2; i < 10; i++) {
      params.push({
        player: accounts[i],
        value: web3.utils.toWei(i+'')
      })
    }

    await allowances.distribute(params)

    result = await allowances.getStakersLength()
    assert.equal(result, 8)

    for(let i = 2; i < 10; i++) {
      result = (await allowances.addressToAllowance(accounts[i])).value
      assert.equal(result.toString(), web3.utils.toWei(i+''))
    }
  })

  it('set allowances for 8 players and then double them', async () => {
    const params = []

    // set array in a for loop
    for(let i = 2; i < 10; i++) {
      params.push({
        player: accounts[i],
        value: web3.utils.toWei(i+'')
      })
    }

    await allowances.distribute(params)
    await allowances.distribute(params)
    await allowances.distribute(params)

    result = await allowances.getStakersLength()
    assert.equal(result, 8)

    for(let i = 2; i < 10; i++) {
      result = (await allowances.addressToAllowance(accounts[i])).value
      assert.equal(result.toString(), web3.utils.toWei(i*3+''))
    }
  })

  it('check all is clean when everybody withdraws inlc. full withdrawal', async () => {
    const params = []
    let dividends = 0

    for(let i = 2; i < 10; i++) {
      params.push({
        player: accounts[i],
        value: web3.utils.toWei(i+'')
      })
      dividends+=i
    }

    await allowances.distribute(params)
    await allowances.distribute(params)
    dividends*=2
    dividends+=1 // for owner withdrawal

    // supply cash to the contract so players can withdraw
    await web3.eth.sendTransaction({
      from: owner,
      to: allowances.address,
      value: web3.utils.toWei(dividends+'')
    })

    result = await web3.eth.getBalance(allowances.address)
    assert.equal(result.toString(), web3.utils.toWei(dividends+''))

    for(let i = 2; i < 10; i++) {
      await allowances.withdraw({from:accounts[i]})

      result = await allowances.getStakersLength()
      assert.equal(result, 8 - (i -1))

      result = (await allowances.addressToAllowance(accounts[i])).value
      assert.equal(result.toString(), '0')
    }

    // contract eth balance should be 1
    result = await web3.eth.getBalance(allowances.address)
    assert.equal(result.toString(), web3.utils.toWei(1+''))

    await allowances.pause()

    // full withdrawal
    await allowances.fullWithdrawal()

    // contract eth balance should be 1
    result = await web3.eth.getBalance(allowances.address)
    assert.equal(result.toString(), '0')

  })

  it('test owner withdrawal', async () => {
    const params = []
    let dividends = 0

    for(let i = 2; i < 10; i++) {
      params.push({
        player: accounts[i],
        value: web3.utils.toWei(i+'')
      })
      dividends+=i
    }

    await allowances.distribute(params)
    await allowances.distribute(params)
    dividends*=2

    // supply cash to the contract so players can withdraw
    await web3.eth.sendTransaction({
      from: owner,
      to: allowances.address,
      value: web3.utils.toWei(dividends+'')
    })

    result = await web3.eth.getBalance(allowances.address)
    assert.equal(result.toString(), web3.utils.toWei(dividends+''))

    for(let i = 2; i < 10; i++) {
      await allowances.ownerWithdraw(accounts[i])

      result = await allowances.getStakersLength()
      assert.equal(result, 8 - (i -1))

      result = (await allowances.addressToAllowance(accounts[i])).value
      assert.equal(result.toString(), '0')
    }

    // contract eth balance should be 1
    result = await web3.eth.getBalance(allowances.address)
    assert.equal(result.toString(), '0')

  })
});
