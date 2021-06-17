

App = {

  web3Provider: null,
  contracts: {},

  web3Modal: null,
  // Chosen wallet provider given by the dialog window
  provide: null,
  // web3
  web3: null,

  dataList: [],
  EvmChains: null,
  Web3Modal: null,



  init: async function () {
    // Load pets. 读取pet.json，将各个宠物信息渲染到页面
    $.getJSON('../pets.json', function (data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');
      for (i = 0; i < data.length; i++) {
        // 遍历渲染
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
        // 将petTemplate追到到页面进行显示
        petsRow.append(petTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  // 创建web3实例用来调用合约访问账户等
  initWeb3: function () {
    App.EvmChains = window.evmChains,

    console.log('EvmChains', App.EvmChains)
    App.Web3Modal = window.Web3Modal.default;
    App.WalletConnectProvider = window.WalletConnectProvider.default;

    const providerOptions = {
      walletconnect: {
        package: App.WalletConnectProvider, // required
        options: {
          infuraId: "9321e08afdc04e2c81cabc499dc5d569" // required
        }
      }
    };

    App.web3Modal = new App.Web3Modal({
      network: "mainnet", // optional
      cacheProvider: false, // optional
      disableInjectedProvider: false,
      providerOptions // required
    });


    // 先检查 web3 实例是否已存在，Mist浏览器或安装了MetaMak的浏览器会提供Provider，已保证已有provider不会被覆盖
    if (typeof web3 !== 'undefined') {
      // 已存在web3，直接使用
      App.web3Provider = web3.currentProvider;
    } else {
      // 搭建ganache节点与以太坊网络进行交互
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    // 未安装小狐狸，报错：web3 is not defined
    web3 = new Web3(App.web3Provider);
    console.log('web3', web3)
    if (!web3) {
      return
    }
    return App.initContract();
  },


  // 初始化合约
  initContract: function () {
    // 加载Adoption.json，保存了Adoption的ABI（接口说明）信息及部署后的网络(地址)信息，它在编译合约的时候生成ABI，在部署的时候追加网络信息
    $.getJSON('Adoption.json', function (data) {
      // 用Adoption.json数据创建一个可交互的TruffleContract合约实例。
      // data 返回合约名称、abi
      var AdoptionArtifact = data;
      // 项目已安装并导入truffle-contract，可用TruffleContract全局变量
      // TruffleContract合约实例可进行JSON-RPC调用
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);
      // 设置provider与节点通信
      App.contracts.Adoption.setProvider(App.web3Provider);
      // Use our contract to retrieve and mark the adopted pets
      // 使用合约----标记被领养宠物
      return App.markAdopted();
    });
    // 绑定事件---页面Adopt按钮点击--触发宠物领养事件
    return App.bindEvents();
  },

  // 页面Adopt按钮点击
  bindEvents: function () {
    // 触发宠物领养事件
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  // 标记被领养宠物
  markAdopted: function (adopters, account) {
    var adoptionInstance;
    // 调用合约方法
    App.contracts.Adoption.deployed().then(function (instance) {
      adoptionInstance = instance;
      // 调用合约的 getAdopters(), 用call读取信息不用消耗gas
      return adoptionInstance.getAdopters.call();
    }).then(function (adopters) {
      // 遍历被领养宠物数组adopters，更改宠物领养按钮为success，状态不可点击（宠物已被领养，不能再触发领养事件）
      for (i = 0; i < adopters.length; i++) {
        // 宠物未被领养地址默认"0x0000000000000000000000000000000000000000"，非默认地址则宠物被领养，改变按钮
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    }).catch(function (err) {
      console.log(err.message);
    });
  },

  // 领养宠物
  handleAdopt: function (event) {
    // 阻止事件的默认动作
    event.preventDefault();
    var petId = parseInt($(event.target).data('id'));
    var adoptionInstance;
    web3js = new Web3(App.web3Provider);//web3js就是你需要的web3实例
    // 获取用户账号
    console.log('web3js', web3js)
    web3js.eth.getAccounts(function (error, accounts) {
      if (error) return
      var account = accounts[0]; //获取当前登录账号
      //调用合约方法
      App.contracts.Adoption.deployed().then(function (instance) {
        adoptionInstance = instance;
        // 发送交易领养宠物
        return adoptionInstance.adopt(petId, { from: account });
      }).then(function (result) {
        return App.markAdopted();
      }).catch(function (err) {
        // 如果没有安装小狐狸
        // 报错：Failed to load resource: the server responded with a status of 404 (Not Found)
        console.log(err.message);
      });
    });
  },

  onConnect: async function () {
    try {
      if (App.provider == null) {
        App.provider = await App.web3Modal.connect();
        App.web3 = new Web3(App.provider);
      }
      console.log("provider=====", "connect");
    } catch (e) {
      console.log("Could not get a wallet connection", e);
      return;
    }

    App.provider.on("accountsChanged", (accounts) => {
      console.log("accountsChanged=====", "changed");
      App.web3Modal.clearCachedProvider()
      App.fetchAccountData();
    });

    App.provider.on("chainChanged", (chainId) => {
      console.log("===========", "chainChanged");
      App.fetchAccountData();
    });

    App.provider.on("connect", (info) => {
      console.log("===========", "connect");
      console.log(info);
    });

    App.provider.on("disconnect", (error) => {
      console.log("===========", "disconnect");
    });

    await App.refreshAccountData();
  },

  refreshAccountData: async function () {
    await App.fetchAccountData(App.provider);
  },

  fetchAccountData: async function () {
    console.log('this is fetchAccountData')
    document.getElementById('dataList').textContent = ''
    const chainId = await App.web3.eth.getChainId();
    console.log('chainId', chainId)
    const chainData = await App.EvmChains.getChain(chainId);
    console.log('chainData', chainData)
    // 给networkName赋值
    document.getElementById('network-name').textContent = chainData.name;
    // this.networkName = chainData.name;
    const accounts = await web3.eth.getAccounts();
    document.getElementById('selected-account').textContent = accounts[0];

    console.log("accounts-----------", accounts);
    const rowResolvers = accounts.map(async (address) => {
      const balance = await App.web3.eth.getBalance(address);
      const ethBalance = App.web3.utils.fromWei(balance, "ether");
      const humanFriendlyBalance = parseFloat(ethBalance).toFixed(4);
      App.dataList.length = 0;
      App.dataList.push({
        address: address,
        balance: humanFriendlyBalance
      });
      for (let i of App.dataList) {
        document.getElementById('dataList').append(`地址：${i.address},余额：${i.balance}.`)
      }
      document.getElementById('toConnect').style.display = "none"
      document.getElementById('disConnect').style.display = "block"
    });
    await Promise.all(rowResolvers);
  },

  disConnect: async function () {
    console.log('this is on disConnect')
    if (App.provider != null) {
      document.getElementById('toConnect').style.display = "block"
      document.getElementById('disConnect').style.display = "none"
      console.log("Killing the provider connection", "provider off");
      // If the cached provider is not cleared,
      // WalletConnect will default to the existing session
      // and does not allow to re-scan the QR code with a new wallet.
      // Depending on your use case you may want or want not his behavir.
      await App.web3Modal.clearCachedProvider();
      App.provider = null;
      App.web3 = null;
      // 数据清空
      document.getElementById('dataList').textContent = ''
      document.getElementById('network-name').textContent = ''
      document.getElementById('selected-account').textContent = ''
      // 清空数据
      App.dataList.length = 0;
    }
  }
};

$(function () {
  $(window).load(function () {
    // 初始化---页面加载后执行init方法


    App.init();
    document.getElementById("toConnect").addEventListener("click", App.onConnect);
    document.getElementById("disConnect").addEventListener("click", App.disConnect);



  });

});
