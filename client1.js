const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const moment = require('moment');
const json = require('json-update');

const prefix = "b!";
const serverData = JSON.parse(fs.readFileSync('./serverData.json', 'utf8'));
const channelIDs = JSOn.parse(fs.readFileSync('./channelID.json', 'utf8'));

client.on('ready', () => {
    console.log('> BlurpleBot On!');
})

client.on('message', message => {

    console.log("> A message has been received. Checking for validity...");

    //Vars
    let msg = message.content.toUpperCase(); //now the message isn't case sensitive. Yay! And I don't have to type it out everytime. yeet
	let sender = message.author; //now i don't have to call this command ever again, and all I have to do is say 'sender'
    let args = message.content.trim(prefix.length).split(" "); //slices off the prefix, then puts the rest in an easily accessible array
    
    //For messages under "server-submissions"
    if (message.channel.id === channelIDs.line24) {

        console.log('> Message Received');

        client.fetchInvite(message).then(invite => {

            //Store Properties
            let server = invite.guild;
            let serverName = server.name;
            let serverLogo = "https://cdn.discordapp.com/icons/" + invite.guild.id + "/" + invite.guild.icon + ".png";
            let serverCount = invite.memberCount;
            let serverID = invite.guild.id;
            let inviteTimestamp = invite.createdTimestamp;
            let serverSubmitter = message.author;

            fs.exists(`/ServerInfo/${serverID}.json`, (exists) => {
                if (exists) {
                    console.log('> The server has already been submitted');
                    message.delete();o
                    return message.channel.send('This server has already been submitted. It is currently in the submission proccess.').then(msg => {msg.delete(5000)});
                } else {
                    
                    console.log('> Generating Embed...');

                    //Embed
                    const embed = new Discord.RichEmbed()
                        .setTitle(serverName)
                        .setDescription(`Submitted by ${serverSubmitter}`)
                        .setURL("https://discord.gg/" + invite.code)
                        .setThumbnail(serverLogo)
                        .setColor(0x7289DA)
                        .addField('Server User Count', serverCount, true)
                        .addField('Server Invite', invite, true)
                        .addField('Server ID', serverID, true)

                    if (typeof invite.guild != 'undefined' && typeof invite.guild.owner != 'undefined' && typeof invite.guild.owner.username != 'undefined') {
                        let serverOwner = invite.guild.owner.username;
                        embed.setDescription('Server Owner: ' + serverOwner);
                    }

                    if (typeof invite.inviter != 'undefined' && typeof invite.inviter.username != 'undefined') {
                        let inviteCreater = invite.inviter.username + "#" + invite.inviter.discriminator;
                        embed.setFooter('Invite created by ' + inviteCreater) 
                    }

                    let approved;

                    client.channels.get(channelIDs.line72).send(embed).then(msg => {
                        
                        console.log('> Reactions Pending...');

                        let blorpletick = client.emojis.find("name", "blorpletick");
                        let blorplecross = client.emojis.find("name", "blorplecross");

                        //let crosses = 0;
                        //let ticks = 0;

                        msg.react(blorpletick).then((r) => {
                            msg.react(blorplecross);

                            //Filters = These make sure the variables are correct before running some code
                            //const backwardsFilter = (reaction, user) => reaction.emoji.name === ':blorplecross:';
                            //const forwardsFilter = (reaction, user) => reaction.emoji.name === 'blorpletick';

                            //const backwards = msg.createReactionCollector(backwardsFilter, { time: 60000 });
                            //const forwards = msg.createReactionCollector(forwardsFilter, { time: 60000 });
                            
                            //backwards.on('collect', r => {
                            //    crosses += 1;
                            //})

                            //forwards.on('collect', r => {
                            //    ticks += 1;
                            //})
                        })
                    })
                    
                    //Server Information
                    let serverInfo = {
                        Server_Name : serverName,
                        Server_Logo : serverLogo,
                        Submitter_Essentials : {
                            Submitter_ID : sender.id,
                            Submitter_Username : sender.username
                        },
                        //Server_Owner : serverOwner,
                        Server_Count : serverCount,
                        Server_ID : serverID,
                        Server_Invite : invite,
                        Server_Submitter : serverSubmitter,
                        //Invite_Timestamp : inviteTimestamp
                        Approved : "false"
                    }

                    //Construct the object to write to JSON
                    var cache = [];
                    let writeObject = JSON.stringify(serverInfo, function(key, value) {
                        if (typeof value === 'object' && value !== null) {
                            if (cache.indexOf(value) !== -1) {
                                // Circular reference found, discard key
                                return;
                            }
                            // Store value in our collection
                            cache.push(value);
                        }
                        return value;
                    }, 4);
                    cache = null;

                    fs.writeFile(`./ServerInfo/${serverID}.json`, writeObject, 'utf8', (err) => {
                        if (err) throw err;
                        console.log(`> ${serverID}.json created`)
                    })
                }
            })
            
        })

        return message.delete();

    }

    //For messages under "submission-decisions"
    if (message.channel.id === channelIDs.line148) {

        const command = message.toString().toLowerCase();

        if (command.includes(`${prefix}approve`)) {

            //Retreive UTC time for timestamp
            let momentUTC = moment.utc().format("dddd, Do MMMM YYYY, HH:mm:ss") + " UTC";

            //Retreive Server ID for lookup purposes
            let serverIDLookup = args[1];

            //Read Server's JSON for submitter's info
            const serverJSON = JSON.parse(fs.readFileSync(`./ServerInfo/${serverIDLookup}.json`));
            let serverSubmissionAuthor = serverJSON.Submitter_Essentials;

            //Check if it's already submitted
            if (serverJSON.Approved != "false") {
                return message.channel.send(`The selected server **${serverJSON.Server_Name}** has already been approved. Please check #blurple-list.`)
            } else {
            
                //Send User a DM of the approval
                client.fetchUser(serverJSON.Submitter_Essentials.Submitter_ID).then(user => {
                    user.send(`Hello! Your server submission, **${serverJSON.Server_Name}** with ID \`${serverIDLookup}\`, in Project Blurple has been **approved**!`);
                })  

                //Add Server to #blurple-list
                const embed = new Discord.RichEmbed()
                    .setTitle(serverJSON.Server_Name)
                    .setDescription(`Submitted by ${serverJSON.Submitter_Essentials.Submitter_Username}`)
                    .setURL("https://discord.gg/" + serverJSON.Server_Invite.code)
                    .setThumbnail(serverJSON.Server_Logo)
                    .setColor(0x7289DA)
                    .addField('Server User Count', serverJSON.Server_Count, true)
                    .addField('Server Invite', "https://discord.gg/" + serverJSON.Server_Invite.code, true)
                    .setFooter('Approved ' + momentUTC)

                client.channels.get(channelIDs.line185).send(embed);

                message.channel.send(`The approval of server **${serverJSON.Server_Name}** has been processed. Please check #blurple-list for confirmation.`);
                console.log(`> ${message.author.username} has approved server ${serverJSON.Server_Name}`)

                //Change approved status
                json.update(`./ServerInfo/${serverIDLookup}.json`, {Approved: "true"}).then( (e) => {console.log(`> ${serverIDLookup}.json amended`);});

                async function e() {
                    //Beautify it (messy but works)
                    await json.load(`./ServerInfo/${serverIDLookup}.json`, async function(err, obj) {
                        if (err) {console.log(err)}
                    
                        const beautify = JSON.stringify(obj, null, 4);
                        fs.writeFile(`./ServerInfo/${serverIDLookup}.json`, beautify, 'utf8');
                        console.log('> JSON beautified');
                    })
                }
                    
                setTimeout(e, 1000);
            }
        }

        if (command.includes(`${prefix}reject`)) {
            
            if (serverJSON.Approved != "false") {
                return message.channel.send(`The selected server **${serverJSON.Server_Name}** has already been processed. Please check #blurple-list.`)
            } else {

                //Retreive Server ID for lookup purposes
                let serverIDLookup = args[1];
                
                //Read Server's JSON for submitter's info
                const serverJSON = JSON.parse(fs.readFileSync(`./ServerInfo/${serverIDLookup}.json`));
                let serverSubmissionAuthor = serverJSON.Submitter_Essentials;

                args.shift();
                args.shift();
                let rejectionMessage = args.join(' ');

                //Send User a DM of the rejection
                client.fetchUser(serverJSON.Submitter_Essentials.Submitter_ID).then(user => {
                    user.send(`Hello! Unfortunately, your server submission, **${serverJSON.Server_Name}** with ID \`${serverIDLookup}\`, in Project Blurple has been **rejected**. The following reason was given:\n${rejectionMessage}`);
                })

                //Change approved status
                json.update(`./ServerInfo/${serverIDLookup}.json`, {Approved: "rejected"}).then( (e) => {console.log(`> ${serverIDLookup}.json amended`);});

                async function f() {
                    //Beautify it (messy but works)
                    await json.load(`./ServerInfo/${serverIDLookup}.json`, async function(err, obj) {
                        if (err) {console.log(err)}
                    
                        const beautify = JSON.stringify(obj, null, 4);
                        fs.writeFile(`./ServerInfo/${serverIDLookup}.json`, beautify, 'utf8');
                        console.log('> JSON beautified');
                    })
                }
                    
                setTimeout(f, 1000);
            }
        }

    }
})

client.login(channelIDs.botToken);