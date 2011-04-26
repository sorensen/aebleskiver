# Todo:

    * Redo authentication functions to work with the CRUD and pub/sub methods
    
    * Remove user from application view on disconnect, Can either mock a 'delete' published
      to all subscribed clients, or change status to 'offline' and run the collection's comparator
    
    * Delete anonymous user models on disconnect (optional)
    
    * Add personal messaging between users
    
    * Move the pub/sub channel and client containers to Redis for persistance (instead of memory) 
      so that multiple node instances can access the same data