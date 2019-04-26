on escape_quotes(string_to_escape)
	set AppleScript's text item delimiters to the "\""
	set the item_list to every text item of string_to_escape
	set AppleScript's text item delimiters to the "\\\""
	set string_to_escape to the item_list as string
	set AppleScript's text item delimiters to ""
	return string_to_escape
end escape_quotes

on searchItunesPlaylist(playlistName)
	set myList to {}
	tell application "iTunes"
		repeat with i from 1 to count tracks of playlist playlistName
			set aTrack to track i of current playlist
			set track_name to my escape_quotes(name of aTrack)
			set track_album to my escape_quotes(album of aTrack)
			set track_artist to my escape_quotes(artist of aTrack)
			set json to {name:track_name, album:track_album, artist:track_artist}
			copy json to end of myList
		end repeat
	end tell
	return myList
end searchItunesPlaylist

on run argv
    set jsonRecord to searchItunesPlaylist(argv)
    return jsonRecord
end run