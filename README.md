# reentry-to-nice-list-2

This is a challenge for the Hackvent 2022.

## Description

The elves are going web3! again...

After last years failure where everybody could enter the nice list even seconds before christmas, Santa tasked his elves months before this years event to have finally a buy-in nice list that is also secure.
To get the most value out of this endavour they also created a new crypto currency with their own chain :O
The chain is called SantasShackles and the coin is called SANTA.

Try to enter the nice list and get the flag!

## Vulnerability

The contract is vulnerable to a Cross-Function Reentrancy Attack [https://www.immunebytes.com/blog/reentrancy-attack/#Types_of_Reentrancy_Attack](https://www.immunebytes.com/blog/reentrancy-attack/#Types_of_Reentrancy_Attack)

## How To Setup

Run the script `scripts/start.ts`. It will create a new ganache instance, drains the default wallets, deploys the contracts, creates a new random attacker wallet and start the webserver.

## How To Solve

You need to setup an attacker contract in order to exploit the reentrancy attack. An example can be found in `contracts/Attacker.sol`.

## Hidden Flag

The flag `HV22{__N1c3__You__ARe__Ind33d__}` (hardcoded) is exactly 32 bytes long which is the same lenght as an Ethereum private key.  
Get the public key for this private key and check the goerli testnet for the address (https://goerli.etherscan.io/address/0x65cCa9C197f6cF1e38628E4dA7305D924466e4fc).  
There you'll find a transaction with the hidden flag in the data parameter (https://goerli.etherscan.io/tx/0xb86d27740bec51d186353a5a9d472dcab6ca122becf129d8840c181f5d6de912).