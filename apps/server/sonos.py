from soco import discover

for zone in discover():
  # zone.pause()
  track = zone.get_current_track_info()
  print(track)
  # zone.play_uri('http://ia801402.us.archive.org/20/items/TenD2005-07-16.flac16/TenD2005-07-16t10Wonderboy.mp3')
  print(zone.player_name)

def get_track(zone):
  track = zone.get_current_track_info()
  return {
    "title": track["title"],
    "artist": track["artist"],
    "album": track["album"],
    "albumArt": track["album_art"],
    "duration": track["duration"],
    "position": track["position"],
  }