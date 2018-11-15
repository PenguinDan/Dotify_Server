# Import modules
import os
import json
import pdb

class SongObj:
    def __init__(self, title, artist, album, hash):
        self.clicks = 0
        self.song_title = title
        self.artist = artist
        self.album = album
        self.guid = hash

    def toDict(self):
        return {
            'clicks' : self.clicks,
            'song_title' : self.song_title,
            'artist' : self.artist,
            'album' : self.album,
            'guid' : self.guid
        }

# File constants
SONG_TITLE = 0
ARTIST = 1
ALBUM = 2
HASH = 3

# The file that contains all of the titles and hashed information
info_file = open('./seeded_list_dans_better_version.txt', 'r')
lines = info_file.readlines()
info_file.close()

# The dictionary mappings
song_to_hash = dict()
artist_to_hash = dict()
album_to_hash = dict()
hash_to_info = dict()

# Read each line
for curr_line in lines:
    curr_line = curr_line.strip()
    # Split the current line into 3 parts
    split_line = curr_line.split('_')
    # Retrieve the hash value
    hash_val = split_line[HASH]

    songObj = SongObj(
        split_line[SONG_TITLE],
        split_line[ARTIST],
        split_line[ALBUM],
        hash_val
    )

    # Create a mapping from the song information to the hash
    song_to_hash[split_line[SONG_TITLE]] = songObj.toDict()
    artist_to_hash[split_line[ARTIST]] = songObj.toDict()
    album_to_hash[split_line[ALBUM]] = songObj.toDict()
    hash_to_info[hash_val] = songObj.toDict()

# Create the json representations of the dictionaries
song_to_hash = json.dumps(song_to_hash)
artist_to_hash = json.dumps(artist_to_hash)
album_to_hash = json.dumps(album_to_hash)
hash_to_info = json.dumps(hash_to_info)

#with open("./Songs.json", 'w') as song_file:
#    song_file.write(song_to_hash)

#with open("./Artists.json", 'w') as artist_file:
#    artist_file.write(artist_to_hash)

#with open("./Album.json", 'w') as album_file:
#    album_file.write(album_to_hash)

with open('./Guid_To_Info.json', 'w') as hash_info_file:
    hash_info_file.write(hash_to_info)
