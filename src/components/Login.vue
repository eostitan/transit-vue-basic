<template>
  <section>
    <!-- Login dropdown (if logged out)-->
    <div v-if="!state.accountInfo && !mobileWallet">
      <el-dropdown trigger="click">
        <el-button :loading="progress">
          {{$t("Login")}} <i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item>
            <div @click="connectWallet('scatter')">
              <img style="width:24px;height:auto;margin-right:2px;" src="/images/scatter_logo.jpg"/>
              <img style="width:75px;height:auto;margin-bottom: -5px;" src="/images/scatter.png"/>
            </div>
          </el-dropdown-item>
          <el-dropdown-item>
            <div style="padding-top:15px;" @click="connectWallet('ledger')">
              <img style="" src="/images/ledger.svg"/>
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>

    <!-- Account info and actions (if logged in) -->
    <div v-else-if="state.accountInfo">
      <el-button @click="logout" style="margin-bottom:20px;" :disabled="mobileWallet">
        {{ wallet.accountInfo.account_name }} <i v-show="!mobileWallet" style="margin-left:5px;" class="el-icon-close"></i>
      </el-button><br>
      <p style="color:grey;">Balance: {{state.accountInfo.core_liquid_balance}}</p>
      <div v-if="voting && !finishedVoting">
        <div v-if="state.accountInfo.voter_info.proxy.length>0" style="color:grey;">You are currently voting for proxy: {{state.accountInfo.voter_info.proxy}}</div>
        <div v-else style="color:grey;">You are currently voting for {{state.accountInfo.voter_info.producers.length}} producers</div>
        <br>
        <el-button size="small" @click="vote">Refresh your vote</el-button>
      </div>
      <div v-if="!voting">
        <p style="color:grey;">You have never voted with this account, please vote for EOS Titan Proxy</p>
        <el-button size="small" @click="vote">Vote EOS Titan</el-button>
      </div>
      <div v-if="finishedVoting">
        <p style="color:grey;">Thank you for voting and testing Transit API !</p>
      </div>

    </div>

    <!-- Show user agent if there is an issue logging in to a mobile wallet -->
    <div v-else>{{nav}}</div>

    <!-- Choose Account Info for wallet providers supporting key discovery-->
    <transition name="el-zoom-in-center">
      <div v-show="accountsModal" style="padding-top:35px;">
        <div v-for="(a, i) in accounts" :key="i" style="margin-bottom:25px">
          <div :title="'Ledger index: ' + a.index" class="keyIndex">{{ a.index }}</div>
          <div :title="a.key" class="pubKey">{{ a.key }}</div>
          <div style="margin-top:10px;padding:0;">
            <transition-group name="el-zoom-in-center">
              <el-button v-for="(act, j) in a.accounts" :key="'index'+j" class="accountButton" small @click="accountLogin(a.index, j)">
                <span class="accountName">{{ act.account }}</span>
                <span class="accountAuth">{{ act.authorization }}</span>
              </el-button>
            </transition-group>
          </div>
        </div>
        <el-button small @click="accountsModal=false">Hide</el-button>
      </div>
    </transition>
  </section>
</template>
<script>
import { initAccessContext } from "eos-transit";
import scatter from "eos-transit-scatter-provider";
import ledger from "eos-transit-ledger-provider";
import lynx from "eos-transit-lynx-provider";
import tp from 'eos-transit-tokenpocket-provider';
import meetone from 'eos-transit-meetone-provider';
import { setTimeout } from 'timers';

export default {
  name: "Login",
  data() {
    return {
      nav: navigator.userAgent,
      mobileWallet: false,
      accountsModal: false,
      finishedVoting: false,
      message: {},
      accessContext: null,
      wallet: null,
      state:{},
      walletId: "scatter",
      discoveryData: []
    };
  },
  created() {
    //if client is using mobile wallet (Now set for Lynx)
    if (navigator.userAgent.toLowerCase().includes('eoslynx')){
      this.mobileWallet = true;
      this.walletId = 'EOS Lynx';
      //if lynxMobile is already loaded, initialize transit
      if (window.lynxMobile) this.initTransit();
      //otherwise wait for lynxMobile to load first
      else window.addEventListener("lynxMobileLoaded", ()=> this.initTransit());
    } 
    else if (navigator.userAgent.toLowerCase().includes('tokenpocket')){
      this.mobileWallet = true;
      this.walletId = 'TokenPocket';
      //if TokenPocket is already loaded, initialize transit
      if (window.scatter) this.initTransit();
      //otherwise wait for TokenPocket to load
      else window.addEventListener("scatterLoaded", ()=> this.initTransit());
    } 
    else if (navigator.userAgent.toLowerCase().includes('meet.one')){
      this.mobileWallet = true;
      this.walletId = 'meetone_provider';
      // if Meet.One is already loaded, initialize transit
      if (window.scatter) this.initTransit();
      //otherwise wait for Meet.One to load
      else setTimeout( ()=> this.initTransit(), 1000);
    } 
    //if client is not using a mobile wallet
    else this.initTransit();
  },
  computed: {
    
    //reactive accounts list of all discovered public keys
    accounts() {
      var list = [];
      if (this.discoveryData.keyToAccountMap)
        for (var key of this.discoveryData.keyToAccountMap)
          if (key.accounts && key.accounts[0]) 
            list.push(key);
      return list;
    },
    progress(){return this.state.connecting || this.state.authenticating || this.state.fetchingAccount || false},
    voting(){
      if (this.state.accountInfo.voter_info && (this.state.accountInfo.voter_info.proxy.length>0 || this.state.accountInfo.voter_info.producers.length>0 ))
        return true;
      else return false;
    }
  },
  methods: {
    initTransit(){
      var options = {
        appName: "transit-vue-test",
        network: {
          blockchain:'eos',
          protocol:'https',
          host:'public.eosinfra.io',
          port:443,
          chainId:'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906'
        }
      }
      //set desired wallet providers
      if (this.mobileWallet) options.walletProviders = [lynx(), tp(), meetone()];
      else options.walletProviders = [scatter(), ledger()];

      //initialize Transit with the options object
      this.accessContext = initAccessContext(options);
      
      //Auto connect and login if user is on a mobile wallet
      if (!this.mobileWallet) return;
      this.connectWallet(this.walletId);

    },
    async discoverMore(n) {
      for (var i=1;i<n;i++)
        this.discoveryData = await this.wallet.discover({pathIndexList: [i]});
    },
    connectWallet(walletId) {
      this.walletId = walletId;

      // initialize Transit wallet instance with your desired signature provider
      this.wallet = this.accessContext.initWallet(this.accessContext.getWalletProviders().find(r=>{return r.id==walletId;}));

      //Subscrible to Transit wallet changes and bind it to a vue variable
      this.wallet.subscribe(walletState =>this.state = walletState);

      this.startLogin(walletId);
    },
    async startLogin() {
      //Connect to wallet provider
      await this.wallet.connect();

      try{
        //start public key discovery for first index
        this.discoveryData = await this.wallet.discover({pathIndexList: [0]});

        //if wallet does not provide public keys (eg. scatter), proceed to login
        if (this.discoveryData.keyToAccountMap.length == 0) 
          await this.wallet.login();

        //if wallet provides one or more public keys (eg. ledger), allow user to choose desired account
        else {
          this.accountsModal = true;
          this.message.connecting.close();
          this.message.authenticating = this.$notify.info({
            title: "Authenticating", message: `Choose account on ${this.walletId}`,duration: 0
          });
          //start async discovery on additional indices
          this.discoverMore(10);
        }
      }catch(ex){
        this.message.connecting.close();
        if (this.walletId =='ledger')
          this.$notify.error({
            title: "Error", message: 'Cannot connect to Ledger' ,duration: 5000
          });
      }
    },
    async accountLogin(index=0, accountIndex=0) {
      var keyObj = this.discoveryData.keyToAccountMap[index];
      await this.wallet.login(keyObj.accounts[accountIndex].account, keyObj.accounts[accountIndex].authorization);
      this.message.authenticating.close();
    },
    async logout() {
      this.message.logout = this.$notify.info({title: "Logging out", duration: 0});
      await this.wallet.terminate();
      this.message.logout.close();
      this.message.logout = this.$notify.success({
        title: "You have logged out successfully", duration: 3000
      });
    },
    async vote(){
      var data;

      //show notification
      this.message.voting = this.$notify.info({title: "Confirmation", message: `Please confirm the transaction`, duration: 0});

      //if user has ever voted, refresh their last vote
      if (this.voting)
        data = {voter: this.state.auth.accountName, proxy:this.state.accountInfo.voter_info.proxy, producers:this.state.accountInfo.voter_info.producers};

      //if user has never voted, allow voting for TITAN proxy
      else data = {voter: this.state.auth.accountName, proxy:'eostitanvote', producers:[]};
      
      //create the array of actions for this tx
      var actions = [{
        account: 'eosio',
        name: 'voteproducer',
        authorization: [{
          actor: this.state.auth.accountName,
          permission: this.state.auth.permission
        }],
        data: data
      }];
      try{
        //wait for user to accept tx on their wallet
        var tx = await this.wallet.eosApi.transact({ actions: actions},{blocksBehind: 3, expireSeconds: 60});
        this.message.voting.close();

        //if transaction was successfull, show notification with transaction id link
        if (tx.transaction_id){
          this.finishedVoting = true;
          this.$notify.success({
            title: "You voted sucessfully", 
            message: `<br><button class="el-button el-button--default el-button--small" onclick="window.open('https://eosq.app/tx/${tx.transaction_id}')">View Transaction</div>`, 
            duration: 15000,
            dangerouslyUseHTMLString: true
          });

        }
      }catch(ex){
        this.message.voting.close();
        if(ex.message)
          this.$notify.error({title: "Error", message: ex.message, duration: 5000})
      }
    },
  },
  watch:{
    state(val){
      //watching state variable to provide custom notifications to user
      if(!val.connecting && this.message.connecting && this.walletId!=='ledger')  
        this.message.connecting.close();
      if(this.message.authenticating) 
        this.message.authenticating.close();
      if (val.connecting)
        this.message.connecting = this.$notify.info({title: "Connecting", message: `Connecting to ${this.walletId}`,duration: 0});
      else if (val.authenticating)
        this.message.authenticating = this.$notify.info({title: "Authenticating", message: `Logging in to ${this.walletId}`, duration: 0});
      else if (val.authenticationError)
        this.$notify.error({title: "Authentication Error", message: val.authenticationErrorMessage, duration: 5000,});
      else if (val.connectionError)
        this.$notify.error({title: "Connection Error", message: val.connectionErrorMessage, duration: 5000});
      else if(val.accountInfo){
        if( this.message.accountInfo) this.message.accountInfo.close();
        this.message.accountInfo = this.$notify.success({title: "Success", message: `Logged in successfully as ${val.accountInfo.account_name}`, duration: 3000});
        this.accountsModal = false;
      }
    }
  }
};
</script>
