var WebTorrent = require('webtorrent-hybrid')
var FS = require("fs")

let CLIENT = new WebTorrent();



let FILE_NAME = 'seeded_list.txt'
let songList = ['Come Together_The Beatles_Abbey Road.mp3', 
                'Help!_The Beatles_Help!.mp3', 
                'Feel Good Inc._Gorillaz_Demon Days.mp3',
                'Hooked on a Feeling_Blue Swede_Hooked on a Feeling.mp3',
                'Lucky You_Eminem_Kamikaze.mp3',
                'Pumped Up Kicks_Foster the People_Pumped Up Kicks.mp3',
                'September_Earth, Wind & Fire_September.mp3'
                ]

let printList = []

async function seedSongs(){
   
    /*let data = await FS.readFile('Lucky You_Eminem_Kamikaze.mp3', function(err,data){
        if (err) throw err;
        return data
    })

    let torrent = await CLIENT.seed(data)
    console.log("Client: ", CLIENT.nodeId, " Added seeded torrent: ", torrent.infoHash, " Data: ", data.length);
    */
   songList.forEach(async function(value){
        await FS.readFile( "Mp3_Dump/" + value, async function(err,data){
            if (err) throw err;
            data = Buffer.from(data)
            data.name = value
            let torrent = await CLIENT.seed(data)
            
            torrent.on('done', function () {
                console.log('torrent download finished')
                console.log("Client: ", CLIENT.nodeId)
                console.log("Added seeded torrent: ", torrent.infoHash, " Value: ", value, " Data: ", data.length);
                let seed = value+ "|" + torrent.infoHash + "~\n"
                //Commented out since the files are on the seeded_list.txt file.
                //FS.appendFileSync(FILE_NAME, seed);
            });
            torrent.on('error', function(error){
                console.log("Error in the torrent")
            });

        })
        
    })
    
}

async function addTorrent(torrentId){
    let torrent = await CLIENT.add(torrentId);
    torrent.on('done', function () {
        console.log('torrent download finished')
        simpleSeed(torrent.torrentFile)
    })
    console.log("Client: ", CLIENT.nodeId, " Added torrent: ", torrent.infoHash)

    return torrent
}


async function simpleSeed(data){
    //et data = Buffer.from('The best torrent that has ever been made')
    //data.name = 'First Torrent'
    let torrent = await CLIENT.seed(data)
    torrent.on('done', function () {
        console.log('torrent seed finished')
    })
    torrent.on('error', function(error){
        console.log("Error in the torrent")
    })
    console.log("Client: ", CLIENT.nodeId, " Added seeded torrent: ", torrent.infoHash, " Data: ", data.length);
    
}
async function main(){
    //await addTorrent('e7cf9b81e8e9549eb696006ac984cba13617c6fa')
    //simpleSeed(torrent.torrentFile)
    await seedSongs()
    
}
main()

/*Working code But the files are not being read the samde each time.
songList.forEach(function(value){
        FS.readFile(value, async function(err,data){
            if (err) throw err;
            let torrent = await CLIENT.seed(data)
            torrent.on('done', function () {
                console.log('torrent download finished')
                console.log("Client: ", CLIENT.nodeId)
                console.log("Added seeded torrent: ", torrent.infoHash, " Value: ", value, " Data: ", data.length);
      
            })
            torrent.on('error', function(error){
                console.log("Error in the torrent")
            })
              })
    }) */