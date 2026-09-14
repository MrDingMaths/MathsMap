import {createDocumentHistory} from './booklet-document-controller.js';
import {changedBookletBlocks} from './booklet-content-index.js';

/** One logical document session; DOM hosts and page fragments are replaceable views.
 * Selection points are {rootId,pointer,nodeId,offset}; anchor/focus retain direction.
 * Transactions carry changedIds, layoutImpact and both selections, never page IDs.
 * Layout snapshots are bound to generation + edition, separately from save revision.
 */
export function createBookletDocumentSession({read,publish,ontransaction=()=>{}}) {
  const history=createDocumentHistory({immutable:true});
  const hosts=new Map();let generation=0,selection=null,lastTransaction=null,layout=null;
  return {
    history,hosts,
    get generation(){return generation;},get selection(){return selection;},get transaction(){return lastTransaction;},get layout(){return layout;},
    select(value){selection=value;},
    reset(){history.reset();hosts.clear();selection=null;layout=null;lastTransaction=null;generation++;},
    dispatch(next,{typingKey=null,remember=true,selectionBefore=selection,selectionAfter=selection,layoutImpact='content',changedIds}={}){
      const before=read();if(next===before)return null;
      if(remember)history.record(before,selectionBefore,typingKey);
      lastTransaction={generation:++generation,changedIds:changedIds??changedBookletBlocks(before,next),layoutImpact,selectionBefore,selectionAfter,typingKey};
      selection=selectionAfter;publish(next);ontransaction(lastTransaction);return lastTransaction;
    },
    acceptLayout(snapshot){if(snapshot.generation!==generation)return false;layout=snapshot;return true;},
    layoutReady(edition){return layout?.generation===generation&&layout.edition===edition&&layout.ready===true;},
    register(key,host){hosts.set(key,host);return()=>{if(hosts.get(key)===host)hosts.delete(key);};},
  };
}
