# Todo:
    * Add personal messaging between users
    
    * Move the pub/sub channel and client containers to Redis for persistance (instead of memory) 
      so that multiple node instances can access the same data

    * Add loading notices for everything
    
    * Change title tag on new messages (Omegle)
      or allow user to play a sound (Convore)
      
    * Make all links open in a new tab / window
    
    * Don't scroll the message window if a user isn't already
      at the bottom of it, to allow reading previous
      
    * Alert the user when they are disconnected or when the 
      server is about to restart
      
    * Firefox CSS outline bug on 'rooms / users'
    
    * Add flood control to rooms, allow users to create a room without 
      flood control on, but have it set by default.  Either 10 messages
      per minute, or a 1000 char limit per minute
      
# Ideas:
    * Create 'music' channels, in which an admin of the channel can start up a 
      https://github.com/Marak/JSONloops program, and then each client can listen
      and change the music.
      
    * Integrate the program with Google / Yahoo! mail, replacing a room view 
      with an inbox