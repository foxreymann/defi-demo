// SPDX-License-Identifier: Copyright
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/Pausable.sol';

contract Allowances is Ownable, Pausable {

  struct Allowance {
    uint value;
    uint added;
    uint removed;
  }

  address[] public stakers;
  mapping(address => bool) public isStaking;
  mapping(address => uint) public stakerIdx;

  address public bot;

  // MODIFIERS
  modifier onlyOwnerOrBot() {
    require(owner() == msg.sender || bot == msg.sender, "Caller is neither owner nor bot");
    _;
  }

  // EVENTS
  event Withdrawn(address indexed beneficiary, uint256 amount, uint256 gasprice);
  event AllowanceUpdate(address indexed account, uint256 allowance);

  receive() external payable {}

  // *** WITHDRAW
  function withdraw() public whenNotPaused {
    uint amount = addressToAllowance[msg.sender].value;
    if(amount == 0) {
      return;
    }
    addressToAllowance[msg.sender].value = 0;
    addressToAllowance[msg.sender].removed = block.timestamp;
    msg.sender.transfer(amount);
    emit Withdrawn(msg.sender, amount, tx.gasprice);
    emit AllowanceUpdate(msg.sender, 0);
  }

  function fullWithdrawal() public onlyOwner whenPaused {
    // don't update allowance to be able to transfer the data on contract update
    uint amount = address(this).balance;
    if(amount == 0) {
      return;
    }
    msg.sender.transfer(amount);
    emit Withdrawn(msg.sender, amount, tx.gasprice);
  }

  function ownerWithdraw(address _player) public onlyOwner {
    uint amount = addressToAllowance[_player].value;
    if(amount == 0) {
      return;
    }
    addressToAllowance[_player].value = 0;
    addressToAllowance[_player].timestamp = block.timestamp;
    msg.sender.transfer(amount);
    emit Withdrawn(msg.sender, amount, tx.gasprice);
    emit AllowanceUpdate(_player, 0);
  }

  function setBot(address _bot) external onlyOwner {
    if(bot != _bot) {
      bot = _bot;
    }
  }

  // ------------------------------------------------------------------------
  // Owner can transfer out any accidentally sent ERC20 tokens
  // ------------------------------------------------------------------------
  function transferAnyERC20Token(address tokenAddress, uint tokens) public onlyOwner returns (bool success) {
    return IERC20(tokenAddress).transfer(owner(), tokens);
  }

}
