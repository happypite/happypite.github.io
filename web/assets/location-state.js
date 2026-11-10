import {pageFromPath} from './routes.js';

export function locationState(href){
 const url=new URL(href),value=url.searchParams.get('note');
 const note=value&&value.length<150&&!/[\u0000-\u001f\u007f]/.test(value)?value:null;
 return {page:pageFromPath(url.pathname),note};
}

// A later Back/Forward action always wins, including while a note is loading.
export function createLocationRestorer({readURL,cancelNavigation,closeReader,showPage,enter,ready,openNote}){
 let sequence=0,active=false,activeURL='';
 return {
  get active(){return active&&readURL()===activeURL;},
  cancel(){sequence++;active=false;},
  async restore(){
   const current=++sequence,href=readURL(),state=locationState(href),isCurrent=()=>current===sequence&&readURL()===href;active=true;activeURL=href;cancelNavigation();
   try{
    await closeReader();if(!isCurrent())return false;
    showPage(state.page);
    if(state.note){enter();await ready;if(!isCurrent())return false;await openNote(state.note);if(!isCurrent())return false;}
    return true;
   }finally{if(current===sequence)active=false;}
  }
 };
}
