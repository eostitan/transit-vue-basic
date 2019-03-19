<template>
  <div id="app">
    <Login/>
  </div>
</template>

<script>
export default {
  name: 'app',
  components: {Login: () => import("@/components/Login")}
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 120px;
}


.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}
.close:hover,.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}
.pubKey{
  font-family:monospace;
  color:grey;
  font-size:12px;
  max-width:345px;
  margin-bottom:-3px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space: nowrap;
  padding:5px 5px 0 5px;
  display:inline-block; 
}
.keyIndex{
  font-size:12px;
  border: 1px solid grey;
  width:10px;
  /* height:20px; */
  padding:0 3px;
  display:inline-block;
  color:grey;
  /* margin-bottom:10px; */
}
.accountName{
  /* left:10px;      */
  margin-right:10px;
  color:white;
  font-size:13px;
}
.accountAuth{
  right:10px;
  top:-10px;
  color:lightgreen;
  font-size:12px;
  border:1px solid grey;
  padding:0 5px;
}
.accountButton{
  text-transform:lowercase;margin: 5px 15px;width:170px;
}
</style>
