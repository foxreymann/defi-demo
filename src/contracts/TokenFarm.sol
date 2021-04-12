// SPDX-License-Identifier: Copyright
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import "./DappToken.sol";
import "./DaiToken.sol";

contract TokenFarm is Ownable, Pausable {

  event StakingPaused(uint timestamp);
  event StakingUnpaused(uint timestamp);

  event StakedDaiTokens(address indexed staker, uint256 amount);
  event UnstakedDaiTokens(address indexed staker, uint256 amount);

  bool stakingPaused;

  string public name = "Dapp Token Farm";
  DappToken public dappToken;
  DaiToken public daiToken;

  address[] public stakers;
  mapping(address => uint) public stakingBalance;
  mapping(address => bool) public isStaking;
  mapping(address => uint) public stakerIdx;

  struct StakerBalance {
    address staker;
    uint balance;
  }

  constructor(DappToken _dappToken, DaiToken _daiToken) {
    dappToken = _dappToken;
    daiToken = _daiToken;
    stakingPaused = false;
  }

  function stakeDaiTokens(uint _amount) public whenNotPaused whenStakingNotPaused {
    // Require amount greater than 0
    require(_amount > 0, "amount cannot be 0");

    // Transfer Mock DAI tokens to this contract for staking
    daiToken.transferFrom(msg.sender, address(this), _amount);

    // Update staking balance
    stakingBalance[msg.sender] = stakingBalance[msg.sender] + _amount;

    // Add user to stakers array *only* if they haven't staked already
    if(!isStaking[msg.sender]) {
      stakers.push(msg.sender);
      stakerIdx[msg.sender] = stakers.length - 1;
      isStaking[msg.sender] = true;
    }

    emit StakedDaiTokens(msg.sender, _amount);
  }

  // Deleting an element creates a gap in the array.
  // One trick to keep the array compact is to
  // move the last element into the place to delete.
  function removeStaker(uint index) internal {
    if(stakers.length < 1 || index > stakers.length -1) {
      return;
    }

    // Move the last element into the place to delete
    stakers[index] = stakers[stakers.length - 1];

    // update the index
    stakerIdx[stakers[index]] = index;

    // Remove the last element
    stakers.pop();
  }

  // Unstaking Tokens (Withdraw)
  function unstakeDaiTokens() public whenNotPaused {
    // Fetch staking balance
    uint balance = stakingBalance[msg.sender];

    // Require amount greater than 0
    require(balance > 0, "staking balance cannot be 0");

    // Transfer deposited Mock DAI tokens from this contract to the caller of this method for unstaking
    daiToken.transfer(msg.sender, balance);

    // Reset staking balance
    stakingBalance[msg.sender] = 0;

    // Update staking status
    isStaking[msg.sender] = false;
    removeStaker(stakerIdx[msg.sender]);

    emit UnstakedDaiTokens(msg.sender, balance);
  }

  function getDaiStakers() public view returns(address[] memory) {
    return stakers;
  }

  function getDaiStakersLength() public view returns(uint) {
    return stakers.length;
  }

  function getDaiStakersBalance() public view returns(StakerBalance[] memory) {
    StakerBalance[] memory stakersBalance = new StakerBalance[](stakers.length);

    for(uint i = 0; i < stakers.length; i++) {
    stakersBalance[i] = StakerBalance({
      staker: stakers[i],
      balance: stakingBalance[stakers[i]]
    });
    }

    return stakersBalance;
  }

  // ------------------------------------------------------------------------
  // Don't accept ETH
  // ------------------------------------------------------------------------
  receive() external payable {
    revert();
  }


  // ------------------------------------------------------------------------
  // Owner can transfer out any accidentally sent ERC20 tokens
  // ------------------------------------------------------------------------
  function transferAnyERC20Token(address tokenAddress, uint tokens) public onlyOwner returns (bool success) {
    return IERC20(tokenAddress).transfer(owner(), tokens);
  }

  function stakingPause() public onlyOwner {
    stakingPaused = true;
    emit StakingPaused(block.timestamp);
  }

  function stakingUnpause() public onlyOwner {
    stakingPaused = false;
    emit StakingUnpaused(block.timestamp);
  }

  modifier whenStakingNotPaused() {
    require(!stakingPaused, "Staking Pausable: staking paused");
    _;
  }
}
