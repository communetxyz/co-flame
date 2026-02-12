// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CoFlameToken.sol";
import "../src/CoFlameLighter.sol";
import "../src/CoFlameFactory.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        CoFlameToken token = new CoFlameToken(deployer);
        CoFlameLighter lighter = new CoFlameLighter(deployer);
        CoFlameFactory factory = new CoFlameFactory(address(lighter), address(token), deployer);

        lighter.setFactory(address(factory));
        // Set deployer as scanner for MVP
        lighter.setScanner(deployer, true);

        vm.stopBroadcast();

        console.log("CoFlameToken:", address(token));
        console.log("CoFlameLighter:", address(lighter));
        console.log("CoFlameFactory:", address(factory));
    }
}
