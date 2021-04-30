// SPDX-License-Identifier: Copyright
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract Allowances is Ownable, Pausable {

  struct Allowance {
    uint value;
    uint added;
    uint removed;
  }

  struct AllowanceParams {
    address player;
    uint value;
  }

  // to get all addresses look as scores list
  mapping (address => Allowance) public addressToAllowance;

  address[] public stakers;
  mapping(address => uint) public stakerIdx;

  address public bot;

  // MODIFIERS
  modifier onlyOwnerOrBot() {
    require(owner() == msg.sender || bot == msg.sender, "Caller is neither owner nor bot");
    _;
  }

  // EVENTS
  event Removed(address indexed beneficiary, uint256 amount, uint256 gasprice);
  event Added(address indexed account, uint256 allowance);

  receive() external payable {}

  function distribute(
    AllowanceParams[] memory _allowanceParams
  ) public onlyOwnerOrBot {
    uint allowanceParamsLen = _allowanceParams.length;
    address player;
    uint value;

    for(uint i = 0; i < allowanceParamsLen; i++) {
      player = _allowanceParams[i].player;
      value = _allowanceParams[i].value;

      if(addressToAllowance[player].value == 0) {
        stakers.push(player);
        stakerIdx[player] = stakers.length - 1;

        addressToAllowance[player] = Allowance({
          value: _allowanceParams[i].value,
          added: block.timestamp,
          removed: 0
        });
      } else {
        // add allowance
        addressToAllowance[player].value += _allowanceParams[i].value;
        addressToAllowance[player].added = block.timestamp;
      }

      emit Added(player, value);
    }
  }

  // *** WITHDRAW
  function withdraw() public whenNotPaused {

    uint amount = addressToAllowance[msg.sender].value;
    if(amount == 0) {
      return;
    }

    addressToAllowance[msg.sender].value = 0;
    addressToAllowance[msg.sender].removed = block.timestamp;

    removeStaker(stakerIdx[msg.sender]);
    payable(msg.sender).transfer(amount);

    emit Removed(msg.sender, amount, tx.gasprice);
  }

  function fullWithdrawal() public onlyOwner whenPaused {
    // don't update allowance to be able to transfer the data on contract update
    uint amount = address(this).balance;
    if(amount == 0) {
      return;
    }
    payable(msg.sender).transfer(amount);
    emit Removed(msg.sender, amount, tx.gasprice);
  }

  function ownerWithdraw(address _player) public onlyOwner {

    uint amount = addressToAllowance[_player].value;
    if(amount == 0) {
      return;
    }

    addressToAllowance[_player].value = 0;
    addressToAllowance[_player].removed = block.timestamp;
    removeStaker(stakerIdx[msg.sender]);

    payable(msg.sender).transfer(amount);

    emit Removed(msg.sender, amount, tx.gasprice);
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

  function setBot(address _bot) external onlyOwner {
    if(bot != _bot) {
      bot = _bot;
    }
  }

  function getStakersLength() public view returns(uint) {
    return stakers.length;
  }

  // ------------------------------------------------------------------------
  // Owner can transfer out any accidentally sent ERC20 tokens
  // ------------------------------------------------------------------------
  function transferAnyERC20Token(address tokenAddress, uint tokens) public onlyOwner returns (bool success) {
    return IERC20(tokenAddress).transfer(owner(), tokens);
  }

  function pause() external onlyOwner whenNotPaused {
    _pause();
  }

  function unpause() external onlyOwner whenPaused {
    _unpause();
  }

}
