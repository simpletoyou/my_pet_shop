App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    // Load pets.
    $.getJSON('../pets.json', function (data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: function () {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);
    return App.initContract();
  },
  initContract: function () {
    // 加载Adoption.json，保存了Adoption的ABI（接口说明）信息及部署后的网络(地址)信息，它在编译合约的时候生成ABI，在部署的时候追加网络信息
    $.getJSON('Adoption.json', function (data) {
      console.log(data)
      // 用Adoption.json数据创建一个可交互的TruffleContract合约实例。
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets
      return App.markAdopted();
    });
    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  markAdopted: function (adopters, account) {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function (instance) {
      adoptionInstance = instance;
      // 调用合约的getAdopters(), 用call读取信息不用消耗gas
      return adoptionInstance.getAdopters.call();
    }).then(function (adopters) {
      for (i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    }).catch(function (err) {
      console.log(err.message);
    });
  },

  handleAdopt: function (event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;

    // 获取用户账号
    var web3Provider;
    if (window.ethereum) {
      web3Provider = window.ethereum;
      try {
        // 请求用户授权
        window.ethereum.enable();
      } catch (error) {
        // 用户不授权时
        console.error("User denied account access")
      }
    } else if (window.web3) {   // 老版 MetaMask Legacy dapp browsers...
      web3Provider = window.web3.currentProvider;
    } else {
      web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3js = new Web3(web3Provider);//web3js就是你需要的web3实例

    web3js.eth.getAccounts(function (error, accounts) {
      if (!error)
      console.log(accounts[0])//授权成功后result能正常获取到账号了
      var account = accounts[0];

      App.contracts.Adoption.deployed().then(function (instance) {
        adoptionInstance = instance;
        // 发送交易领养宠物
        return adoptionInstance.adopt(petId, { from: account });
      }).then(function (result) {
        return App.markAdopted();
      }).catch(function (err) {
        console.log(err.message);
      });
    });
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
