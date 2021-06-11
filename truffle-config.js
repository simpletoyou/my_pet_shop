/*
 * @Description: 
 * @version: 
 * @Author: chenchuhua
 * @Date: 2021-06-03 10:32:05
 * @LastEditors: chenchuhua
 * @LastEditTime: 2021-06-04 18:30:12
 */
module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    }
  },
  compilers: {
    solc: {
       version: "0.5.16",    // Fetch exact version from solc-bin (default: truffle's version)
    }
  }
};
