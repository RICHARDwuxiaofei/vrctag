// SPDX-License-Identifier: MIT
import {useEffect,useState} from 'react';
import {getStyle} from './styles';
type Projection={name:string;color:string;z:number;path:string};
export function StyleThumbnail({styleId,hangingLoop}:{styleId:string;hangingLoop:boolean}){
 const [parts,setParts]=useState<Projection[]>([]);const style=getStyle(styleId);
 useEffect(()=>{let active=true;const url=new URL('assets/'+getStyle(styleId).baseFile.replace('base.json','thumbnail.json'),window.location.href);fetch(url,{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Thumbnail unavailable');return r.json()}).then(value=>{if(active)setParts(value)}).catch(()=>{if(active)setParts([])});return()=>{active=false}},[styleId]);
 return <svg className="style-thumbnail" viewBox="-72 -34 146 66" role="img" aria-label={style.name}><g transform="scale(1,-1)">{parts.filter(p=>hangingLoop||p.name!=='Hanging_Loop').map(p=><path key={p.name} d={p.path} fill={p.color} fillRule="nonzero"/>)}</g></svg>;
}
