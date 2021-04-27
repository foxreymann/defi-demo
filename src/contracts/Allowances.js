// SPDX-License-Identifier: Copyright

pragma solidity >=0.6.10 <0.7.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/access/Ownable.sol';

contract PunchlineV4 is Ownable {
  // TYPE DECLARATIONS
  struct PersonParam {
    string name;
    string image;
    string punchline;
    address owner;
    uint timestamp;
  }

  struct Person {
    uint id;
    string name;
    string image;
    string punchline;
    address owner;
    bool active;
    uint timestamp;
  }

  mapping (uint => Person) personIdToPerson;

  uint noOfPersons = 0;

  // scores
  mapping(address => uint256) public scores; // seconds of cumulative holdings
  mapping(address => address) public nextPlayers;
  address constant GUARD = address(1);

  // just to return leaderboard
  struct Player {
    address student;
    uint score;
  }

  // last round winners + lottery winner
  struct Winner {
    address winner;
    uint prize;
    uint score;
  }

  uint constant noOfWinners = 10;
  Winner[noOfWinners] public lastWinners;

  // v1 allowance
  struct V1Params {
    address player;
    uint toRefund;
    uint allowance;
    uint timestamp;
  }

  struct V1Refund {
    uint toRefund; // how much is left to refund   1000TT     ->  900TT    100TT
    uint allowance; // current allowance
    uint timestamp; // ts of allowance update
  }

  mapping (address => V1Refund) public addressToV1Refund;

  address[] public v1RefundAddresses;

  uint public nextV1RefundAddressesIndex = 0;
  bool public shouldV1Refund = true;

  // v2 allowance
  struct AllowanceParams {
    address player;
    uint value;
    uint timestamp;
  }

  struct Allowance {
    uint value;
    uint timestamp;
  }

  address[] public allowanceAddresses;

  // to get all addresses look as scores list
  mapping (address => Allowance) public addressToAllowance;

  // STATE VARIABLES
  uint public price = 10 ether;
  uint public prizePoolCut = 8 ether;
  uint public v1RefundCut = 1 ether;

  uint public prizePool;

  address public bot;
  address public moderator1;
  address public moderator2;

  string constant public defaultPunchline = 'Take Me Over!';

  bool public paused;
  enum State { unpaused, paused, retaken, distributed, wiped }
  State public state = State.unpaused;


  // MODIFIERS
  modifier onlyOwnerOrBot() {
    require(owner() == msg.sender || bot == msg.sender, "Caller is neither owner nor bot");
    _;
  }

  modifier onlyModerators() {
    require(
      owner() == msg.sender || bot == msg.sender || moderator1 == msg.sender || moderator2 == msg.sender,
      "Caller is not a moderator"
    );
    _;
  }

  // EVENTS
  event PersonUpdate(uint indexed personId);
  event ScoreUpdate(address indexed account);
  event Purchase(address indexed buyer, uint amount, uint personId);

  // history: owner, punchline, score awarded
  event History(
    uint indexed personId,
    address owner,
    string punchline,
    uint score
  );

  event Paused(address account);
  event Unpaused(address account);

  event Withdrawn(address indexed beneficiary, uint256 amount, uint256 gasprice);
  event AllowanceUpdate(address indexed account, uint256 allowance);

  event V1Withdrawn(address indexed beneficiary, uint256 amount, uint256 gasprice);
  event V1AllowanceUpdate(address indexed account, uint256 allowance);

  // FUNCTIONS
  constructor(
    V1Params[] memory _v1refund,
    AllowanceParams[] memory _allowanceParams,
    Winner[10] memory _lastWinners,
    PersonParam[] memory _persons
  ) public {
    nextPlayers[GUARD] = GUARD;

    uint v1refundLength = _v1refund.length;

    for(uint i = 0; i < v1refundLength; i++) {
      v1RefundAddresses.push(
        _v1refund[i].player
      );

      addressToV1Refund[_v1refund[i].player] = V1Refund({
        toRefund: _v1refund[i].toRefund,
        allowance: _v1refund[i].allowance,
        timestamp: _v1refund[i].timestamp
      });
    }

    uint allowanceParamsLen = _allowanceParams.length;

    for(uint i = 0; i < allowanceParamsLen; i++) {
      allowanceAddresses.push(
        _allowanceParams[i].player
      );

      addressToAllowance[_allowanceParams[i].player] = Allowance({
        value: _allowanceParams[i].value,
        timestamp: _allowanceParams[i].timestamp
      });
    }

    for(uint i; i < 10; i++) {
      lastWinners[i] = _lastWinners[i];
    }

    noOfPersons = _persons.length;

    for(uint i = 0; i < noOfPersons; i++) {
      personIdToPerson[i] = Person({
        id: i,
        name: _persons[i].name,
        image: _persons[i].image,
        punchline: _persons[i].punchline,
        owner: _persons[i].owner,
        active: true,
        timestamp: _persons[i].timestamp
      });
    }
  }

  receive() external payable {}

  // *** WITHDRAW
  function withdraw() public whenNotPaused {
    uint amount = addressToAllowance[msg.sender].value;
    if(amount == 0) {
      return;
    }
    addressToAllowance[msg.sender].value = 0;
    addressToAllowance[msg.sender].timestamp = block.timestamp;
    msg.sender.transfer(amount);
    emit Withdrawn(msg.sender, amount, tx.gasprice);
    emit AllowanceUpdate(msg.sender, 0);
  }

  function v1Withdraw() public whenNotPaused {
    uint amount = addressToV1Refund[msg.sender].allowance;
    if(amount == 0) {
      return;
    }
    addressToV1Refund[msg.sender].allowance = 0;
    addressToV1Refund[msg.sender].timestamp = block.timestamp;
    msg.sender.transfer(amount);
    emit V1Withdrawn(msg.sender, amount, tx.gasprice);
    emit V1AllowanceUpdate(msg.sender, 0);
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

  function ownerV1Withdraw(address _player) public onlyOwner {
    uint amount = addressToV1Refund[_player].allowance;
    if(amount == 0) {
      return;
    }
    addressToV1Refund[_player].allowance = 0;
    addressToV1Refund[_player].timestamp = block.timestamp;
    msg.sender.transfer(amount);
    emit V1Withdrawn(msg.sender, amount, tx.gasprice);
    emit V1AllowanceUpdate(_player, 0);
  }

  // *** WITHDRAW

  function mint(
    string memory _name,
    string memory _image
  ) public onlyOwner {
    personIdToPerson[noOfPersons] = Person({
      id: noOfPersons,
      name: _name,
      image: _image,
      punchline: defaultPunchline,
      owner: owner(),
      active: true,
      timestamp: block.timestamp
    });

    emit PersonUpdate(noOfPersons);
    noOfPersons++;
  }

  function updatePersonActive(uint _personId, bool _active) external onlyOwnerOrBot {
    if(personIdToPerson[_personId].active != _active) {
      personIdToPerson[_personId].active = _active;
    }
    emit PersonUpdate(_personId);
  }

  function updatePersonName(uint _personId, string memory _name) external onlyOwnerOrBot {
    personIdToPerson[_personId].name = _name;
    emit PersonUpdate(_personId);
  }

  function updatePeronImage(uint _personId, string memory _image) external onlyOwnerOrBot {
    personIdToPerson[_personId].image = _image;
    emit PersonUpdate(_personId);
  }

  function updatePersonPunchline(uint _personId, string memory _punchline) external onlyModerators {
    personIdToPerson[_personId].punchline = _punchline;
    emit PersonUpdate(_personId);
  }

  function setBot(address _bot) external onlyOwner {
    if(bot != _bot) {
      bot = _bot;
    }
  }

  function setModerator1(address _moderator) external onlyOwner {
    if(moderator1 != _moderator) {
      moderator1 = _moderator;
    }
  }

  function setModerator2(address _moderator) external onlyOwner {
    if(moderator2 != _moderator) {
      moderator2 = _moderator;
    }
  }

  function isModerator() external view returns(bool) {
    if(
      owner() == msg.sender || bot == msg.sender || moderator1 == msg.sender || moderator2 == msg.sender
    ) {
      return true;
    }
  }

  function setPrices(uint _price, uint _prizePoolCut, uint _v1RefundCut) external onlyOwnerOrBot whenPaused {
    price = _price;
    prizePoolCut = _prizePoolCut;
    if(v1RefundCut != 0) {
      v1RefundCut = _v1RefundCut;
    }
  }

  function getPerson(uint _personId) public view returns(Person memory person) {
    person = personIdToPerson[_personId];
  }

  function getPersons() public view returns(Person[] memory toReturn) {
    toReturn = new Person[](noOfPersons);

    for(uint i = 0; i < noOfPersons; i++) {
      toReturn[i] = personIdToPerson[i];
    }
  }

  function buyPerson(uint _personId, string memory _punchline) public payable whenNotPaused {
    require(personIdToPerson[_personId].active, "person not for sale");
    require(msg.value >= price, "payment amount too low");
    require(msg.sender != owner(), "owner can't buy");

    Person storage person = personIdToPerson[_personId];

    // update leaderboard
    if(person.owner != owner() && person.owner != bot) {
      uint score = block.timestamp - person.timestamp;
      increaseScore(person.owner, score);
      emit History(
        person.id,
        person.owner,
        person.punchline,
        score
      );
    }


    // transfer the person
    person.owner = msg.sender;
    person.punchline = _punchline;
    person.timestamp = block.timestamp;

    // distribute payment
    prizePool += prizePoolCut;

    addressToAllowance[owner()].value += (msg.value - prizePoolCut - v1RefundCut);

    // refund v1RefundCut to one of v1 users
    if(shouldV1Refund) {
      V1Refund storage refund = addressToV1Refund[v1RefundAddresses[nextV1RefundAddressesIndex]];

      if(refund.toRefund > v1RefundCut) {
        refund.toRefund -= v1RefundCut;
      } else {
        refund.toRefund = 0;
      }

      refund.allowance += v1RefundCut;
      refund.timestamp = block.timestamp;
      emit V1AllowanceUpdate(v1RefundAddresses[nextV1RefundAddressesIndex], 0);

      for(uint i = 0; i < v1RefundAddresses.length; i++) {
        // we start the loop with curr+1 element, end with curr element
        ++nextV1RefundAddressesIndex;

        if(nextV1RefundAddressesIndex == v1RefundAddresses.length) {
          nextV1RefundAddressesIndex = 0;
        }

        refund = addressToV1Refund[v1RefundAddresses[nextV1RefundAddressesIndex]];

        if(refund.toRefund == 0 && i == v1RefundAddresses.length - 1) {
          shouldV1Refund = false;
          v1RefundCut = 0;
        }

        if(refund.toRefund > 0) {
          break;
        }
      }

    }

    emit PersonUpdate(_personId);
    emit Purchase(msg.sender, msg.value, _personId);
  }

  function adminBuy(uint _personId, string memory _punchline) public onlyOwnerOrBot {
    Person storage person = personIdToPerson[_personId];

    // update leaderboard
    if(person.owner != owner() && person.owner != bot) {
      uint score = block.timestamp - person.timestamp;
      increaseScore(person.owner, score);
      emit History(
        person.id,
        person.owner,
        person.punchline,
        score
      );
    }

    // transfer the person
    person.owner = msg.sender;
    person.punchline = _punchline;
    person.timestamp = block.timestamp;

    emit PersonUpdate(_personId);
  }

  function retake() external onlyOwnerOrBot whenPaused {
    require(state == State.paused, "state should be paused");
    Person storage person;

    for(uint i = 0; i < noOfPersons; i++) {
      person = personIdToPerson[i];
      // add score
      if(person.owner != owner()) {
        uint score = block.timestamp - person.timestamp;
        increaseScore(person.owner, score);
        emit History(
          person.id,
          person.owner,
          person.punchline,
          score
        );
      }
      // update timestamp
      person.timestamp = block.timestamp;
    }
    state = State.retaken;
  }

  function distributePrizePool() external onlyOwnerOrBot whenPaused {
    require(state == State.retaken, "state should be retaken");
    address[] memory winners = getTop(noOfWinners);

    uint[] memory prizes = new uint[](noOfWinners);

    prizes[0] = prizePool * 21 / 50; // 42%
    prizes[1] = prizePool * 11 / 50; // 22%
    prizes[2] = prizes[1] / 2; // 11%
    prizes[3] = prizePool * 7 / 100; // 7%
    prizes[4] = prizePool / 20;
    prizes[5] = prizePool / 25;
    prizes[6] = prizePool * 3 / 100;
    prizes[7] = prizePool / 40;
    prizes[8] = prizePool / 50;
    prizes[9] = prizePool - prizes[0] - prizes[1]
      - prizes[2] - prizes[3] - prizes[4] - prizes[5] - prizes[6] - prizes[7] - prizes[8];

    for(uint i = 0; i < noOfWinners; i++) {
      address winner = winners[i];

      addressToAllowance[winner].value += prizes[i];
      addressToAllowance[winner].timestamp = block.timestamp;

      if(addressToAllowance[winner].timestamp == 0) {
        allowanceAddresses.push(winner);
      }

      emit AllowanceUpdate(winner, addressToAllowance[winner].value);

      lastWinners[i] = Winner({
        winner: winner,
        prize: prizes[i],
        score: scores[winner]
      });
    }

    prizePool = 0;
    state = State.distributed;
  }

  function getLastWinners() external view returns (Winner[noOfWinners] memory) {
    return lastWinners;
  }

  // PAUSE
  /**
   * @dev Modifier to make a function callable only when the contract is not paused.
   */
  modifier whenNotPaused() {
    if(msg.sender != owner()) {
      require(!paused, "Pausable: paused");
    }
    _;
  }

  /**
   * @dev Modifier to make a function callable only when the contract is paused.
   */
  modifier whenPaused() {
    require(paused, "Pausable: not paused");
    _;
  }

  /**
   * @dev Triggers stopped state.
   */
  function pause() public whenNotPaused onlyOwnerOrBot{
    paused = true;
    emit Paused(msg.sender);
    state = State.paused;
  }

  /**
   * @dev Returns to normal state.
   */
  function unpause() public whenPaused onlyOwnerOrBot {
    paused = false;
    emit Unpaused(msg.sender);
    state = State.unpaused;
  }


  // LIST FUNCTIONS
  function wipePlayers() public whenPaused onlyOwnerOrBot {
    require(state == State.distributed, "state should be distributed");
    // reset all nextStudens to 0
    address currentAddress = GUARD;
    // add a counter to limit to 1000 just in case !!!
    while(nextPlayers[currentAddress] != GUARD) {
      scores[nextPlayers[currentAddress]] = 0;
      currentAddress = nextPlayers[currentAddress];
    }
    // wipe list of students
    nextPlayers[GUARD] = GUARD;
    state = State.wiped;
  }

  function addPlayer(address student, uint256 score) internal {
    require(nextPlayers[student] == address(0));
    address index = _findIndex(score);
    scores[student] = score;
    nextPlayers[student] = nextPlayers[index];
    nextPlayers[index] = student;
  }

  function increaseScore(address student, uint256 score) internal {
    if(nextPlayers[student] == address(0)) {
      return addPlayer(student, score);
    }
    updateScore(student, scores[student] + score);
  }

  function updateScore(address student, uint256 newScore) internal {
    require(nextPlayers[student] != address(0));
    address prevPlayer = _findPrevPlayer(student);
    address nextPlayer = nextPlayers[student];
    if(_verifyIndex(prevPlayer, newScore, nextPlayer)){
      scores[student] = newScore;
    } else {
      removePlayer(student);
      addPlayer(student, newScore);
    }
    emit ScoreUpdate(student);
  }

  function removePlayer(address student) internal {
    require(nextPlayers[student] != address(0));
    address prevPlayer = _findPrevPlayer(student);
    nextPlayers[prevPlayer] = nextPlayers[student];
    nextPlayers[student] = address(0);
    scores[student] = 0;
  }

  function getTop(uint256 k) public view returns(address[] memory) {
    address[] memory studentLists = new address[](k);
    address currentAddress = nextPlayers[GUARD];
    for(uint256 i = 0; i < k; ++i) {
      if(currentAddress == GUARD) {
        studentLists[i] = owner();
      } else {
        studentLists[i] = currentAddress;
        currentAddress = nextPlayers[currentAddress];
      }
    }
    return studentLists;
  }

  function getNoOfPlayers() public view returns(uint noOfPlayers) {
    address currentAddress = GUARD;

    while(nextPlayers[currentAddress] != GUARD) {
      ++noOfPlayers;
      currentAddress = nextPlayers[currentAddress];
    }
  }

  function getPlayers() public view returns(address[] memory) {
    return getTop(getNoOfPlayers());
  }

  function getLeaderboard() public view returns(Player[] memory) {
    uint noOfPlayers = getNoOfPlayers();

    Player[] memory leaderboard = new Player[](noOfPlayers);

    address currentAddress = nextPlayers[GUARD];
    for(uint256 i = 0; i < noOfPlayers; ++i) {
      require(currentAddress != GUARD, "Can't get top players");
      leaderboard[i] = Player({
        student: currentAddress,
        score: scores[currentAddress]
      });
      currentAddress = nextPlayers[currentAddress];
    }
    return leaderboard;
  }

  function _verifyIndex(address prevPlayer, uint256 newValue, address nextPlayer)
    internal
    view
    returns(bool)
  {
    return (prevPlayer == GUARD || scores[prevPlayer] >= newValue) &&
           (nextPlayer == GUARD || newValue > scores[nextPlayer]);
  }

  function _findIndex(uint256 newValue) internal view returns(address) {
    address candidateAddress = GUARD;
    while(true) {
      if(_verifyIndex(candidateAddress, newValue, nextPlayers[candidateAddress]))
        return candidateAddress;
      candidateAddress = nextPlayers[candidateAddress];
    }
  }

  function _isPrevPlayer(address student, address prevPlayer) internal view returns(bool) {
    return nextPlayers[prevPlayer] == student;
  }

  function _findPrevPlayer(address student) internal view returns(address) {
    address currentAddress = GUARD;
    while(nextPlayers[currentAddress] != GUARD) {
      if(_isPrevPlayer(student, currentAddress))
        return currentAddress;
      currentAddress = nextPlayers[currentAddress];
    }
    return address(0);
  }

}
