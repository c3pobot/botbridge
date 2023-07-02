const { Bridge } = require('discord-cross-hosting');
const BOT_TOKEN = process.env.BOT_TOKEN
const BOT_AUTH_TOKEN = process.env.BOT_AUTH_TOKEN
const BOT_BRIDGE_PORT = process.env.BOT_BRIDGE_PORT || 4444
const BOT_TOTAL_SHARDS = process.env.BOT_TOTAL_SHARDS || 4
const BOT_TOTAL_MACHINES = process.env.BOT_TOTAL_SHARDS || 2
const BOT_SHARD_PER_CLUSTER = process.env.BOT_SHARD_PER_CLUSTER || 2
const server = new Bridge({
    port: +BOT_BRIDGE_PORT, // The Port of the Server | Proxy Connection (Replit) needs Port 443
    authToken: BOT_AUTH_TOKEN,
    totalShards: +BOT_TOTAL_SHARDS, // The Total Shards of the Bot or 'auto'
    totalMachines: +BOT_TOTAL_MACHINES, // The Total Machines, where the Clusters will run
    shardsPerCluster: +BOT_SHARD_PER_CLUSTER, // The amount of Internal Shards, which are in one Cluster
    token: BOT_TOKEN,
});

//server.on('debug', console.log);
server.start();
server.on('ready', url => {
    console.log('Server is ready' + url);
});
