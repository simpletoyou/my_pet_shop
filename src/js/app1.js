App = {

  web3Provider: null,
  contracts: {},
  modal: null,
  provider: null,

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

    // 初始化 web3
    const WM = window.Web3Modal.default;
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: "8043bb2cf99347b1bfadfb233c5325c0",
        }
      },

      fortmatic: {
        package: Fortmatic,
        options: {
          key: "pk_test_391E26A3B43A3350"
        }
      }
    };
    App.modal = new WM({
      cacheProvider: false, // optional
      providerOptions, // required
    });


    // 先检查 web3 实例是否已存在，Mist浏览器或安装了MetaMak的浏览器会提供Provider，已保证已有provider不会被覆盖
    // if (typeof web3 !== 'undefined') {
    //   // 已存在web3，直接使用
    //   App.web3Provider = web3.currentProvider;
    //   console.log('has web3')
    // } else {
      // 搭建ganache节点与以太坊网络进行交互
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      console.log('7545 web3')
    // }
    web3 = new Web3(App.web3Provider);
    return App.initContract();
  },



  // 初始化合约
  initContract: function () {
    // 加载Adoption.json，保存了Adoption的ABI（接口说明）信息及部署后的网络(地址)信息，它在编译合约的时候生成ABI，在部署的时候追加网络信息
    $.getJSON('Adoption.json', function (data) {
      // 用Adoption.json数据创建一个可交互的TruffleContract合约实例。
      // data 返回合约名称、abi等相关信息
      var AdoptionArtifact = data;
      // 项目已安装并导入truffle-contract，可用TruffleContract全局变量
      // TruffleContract合约实例可进行JSON-RPC调用
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);
      console.log(' App.contracts.Adoption', App.contracts.Adoption)
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
      console.log('instance',instance)
      adoptionInstance = instance;
      // 调用合约的 getAdopters(), 用call读取信息不用消耗gas
      return adoptionInstance.getAdopters.call();
    }).then(function (adopters) {
      console.log('adopters',adopters)
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

    event.preventDefault();

    // 获取被点击宠物id
    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;

    web3js = new Web3(App.web3Provider);//web3js就是你需要的web3实例
    
    // 获取用户账号
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
        console.log(err.message);
      });
    });
  },

  fetchAccountData: async function ()  {
    const web3 = new Web3(App.provider);
    const chainId = await web3.eth.getChainId();
    const accounts = await web3.eth.getAccounts();
    console.log("Got accounts", accounts);
    const template = document.querySelector("#template-balance");
    const accountContainer = document.querySelector("#accounts");
    accountContainer.innerHTML = '';
    const rowResolvers = accounts.map(async (address) => {
      const balance = await web3.eth.getBalance(address);
      const ethBalance = web3.utils.fromWei(balance, "ether");
      const humanFriendlyBalance = parseFloat(ethBalance).toFixed(4);
      // Fill in the templated row and put in the document
      const clone = template.content.cloneNode(true);
      accountContainer.appendChild(clone);
    });
    await Promise.all(rowResolvers);
    document.querySelector("#prepare").style.display = "none";
    document.querySelector("#connected").style.display = "block";
  },
  // refreshAccountData: async function () {
  //   document.querySelector("#connected").style.display = "none";
  //   document.querySelector("#prepare").style.display = "block";
  //   document.querySelector("#btn-connect").setAttribute("disabled", "disabled")
  //   await fetchAccountData(App.provider);
  //   document.querySelector("#btn-connect").removeAttribute("disabled")
  // },

  // 连接钱包
  onConnect: async function () {
    console.log("this is onConnect",App.modal);
    try {
      App.provider = await App.modal.connect();
      console.log('App.provider', App.provider)
    } catch (e) {
      console.log("Could not get a wallet connection", e);
      return;
    }
    // Subscribe to accounts change
    App.provider.on("accountsChanged", (accounts) => {
      fetchAccountData();
    });
    // Subscribe to chainId change
    App.provider.on("chainChanged", (chainId) => {
      fetchAccountData();
    });
    // Subscribe to networkId change
    App.provider.on("networkChanged", (networkId) => {
      fetchAccountData();
    });
    // await refreshAccountData();
  },
  onDisconnect: async function () {
    console.log("this is onDisconnect");
    if (App.provider.close) {
      await App.provider.close();
      await App.modal.clearCachedProvider();
      App.provider = null;
    }
    // Set the UI back to the initial state
    document.querySelector("#prepare").style.display = "block";
    document.querySelector("#connected").style.display = "none";
  },
};

$(function () {
  $(window).load(function () {
    // 初始化---页面加载后执行init方法
    App.init();
    // 为页面按钮绑定点击事件
    document.querySelector("#btn-connect").addEventListener("click", App.onConnect);
    document.querySelector("#btn-disconnect").addEventListener("click", App.onDisconnect);
  });
});
