'use strict';
importScripts('rules.js?v=060','ai.js?v=060');
self.addEventListener('message',event=>{
  const request=event.data||{},id=request.id;
  try{
    const move=self.BoardAI.choose(request.game,request.board,request.color,request.level,request.options||{});
    self.postMessage({id,move});
  }catch(error){
    self.postMessage({id,error:String(error&&error.message||error)});
  }
});
