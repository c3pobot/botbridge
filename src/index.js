const { Bridge } = require('discord-cross-hosting');
const BOT_TOKEN = process.env.BOT_TOKEN
const BOT_AUTH_TOKEN = process.env.BOT_AUTH_TOKEN
const server = new Bridge({
    port: 4444, // The Port of the Server | Proxy Connection (Replit) needs Port 443
    authToken: BOT_AUTH_TOKEN,
    totalShards: 4, // The Total Shards of the Bot or 'auto'
    totalMachines: 2, // The Total Machines, where the Clusters will run
    shardsPerCluster: 10, // The amount of Internal Shards, which are in one Cluster
    token: BOT_TOKEN,
});

server.on('debug', console.log);
server.start();
server.on('ready', url => {
    console.log('Server is ready' + url);
    setInterval(() => {
        server.broadcastEval('this.guilds.cache.size').then(console.log).catch(console.log);
    }, 10000);
});
