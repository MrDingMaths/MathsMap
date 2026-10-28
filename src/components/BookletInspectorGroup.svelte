<script module>
 // Open/closed state of every inspector group, remembered across sessions by group id.
 const KEY='booklet-inspector-groups';
 function read(){try{return JSON.parse(localStorage.getItem(KEY)??'{}')??{};}catch{return {};}}
 const groups=$state(read());
 function remember(id,open){groups[id]=open;try{localStorage.setItem(KEY,JSON.stringify(groups));}catch{}}
 export function openInspectorGroup(id){remember(id,true);}
</script>
<script>
 // A collapsible group in the selection inspector. Its content mounts the first time the group is open and stays mounted while collapsed.
 let {id,title,open:initial=true,children}=$props();
 const open=$derived(groups[id]??initial);
 let seen=$state(false);
 $effect(()=>{if(open)seen=true;});
</script>
<details class="inspector-group" data-inspector-group={id} {open} ontoggle={e=>{if(e.currentTarget.open!==open)remember(id,e.currentTarget.open);}}>
 <summary>{title}</summary>
 {#if open||seen}<div class="group-body">{@render children()}</div>{/if}
</details>
<style>
 .inspector-group{border-top:1px solid var(--line,#d5dde7);padding:2px 0}.inspector-group:first-of-type{border-top:0}
 summary{cursor:pointer;font:600 13px system-ui;padding:7px 2px;list-style-position:inside}summary:focus-visible{outline:2px solid #268cff}
 .group-body{padding:0 0 10px}
</style>
