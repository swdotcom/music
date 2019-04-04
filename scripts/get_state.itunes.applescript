tell application "iTunes"
	set cstate to "{"
	set cstate to cstate & "\"id\":\"" & current track's database ID & "\""
	set cstate to cstate & ",\"name\":\"" & current track's name & "\""
	set cstate to cstate & ",\"album\":\"" & current track's album & "\""
	set cstate to cstate & ",\"artist\":\"" & current track's artist & "\""
	set cstate to cstate & ",\"genre\":\"" & current track's genre & "\""
	set cstate to cstate & ",\"duration\":" & (current track's duration as integer) * 1000
	set cstate to cstate & ",\"played_count\":" & (current track's played count as integer)
	set cstate to cstate & ",\"state\":\"" & player state & "\""
	set cstate to cstate & "}"
	
	return cstate
end tell