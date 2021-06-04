pragma solidity ^0.5.16;

contract Adoption {
  address[16] public adopters;//存领养者的地址

  // Adopting a pet 领养宠物
  function adopt(uint petId) public returns (uint) {
    require(petId >= 0 && petId <= 15);  // 确保id在数组长度内

    adopters[petId] = msg.sender;// 保存调用这地址 

    return petId;
  }

  // Retrieving the adopters  返回领养者
  function getAdopters() public view returns (address[16] memory) {
    return adopters;
  }
}
