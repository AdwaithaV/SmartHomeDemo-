(function(root){
'use strict';
const devices=()=>[
{id:'ac',name:'Living room AC',room:'Living room',kind:'ac',on:false,target:26,essential:false},
{id:'fan',name:'Bedroom fan',room:'Bedroom',kind:'fan',on:false,speed:'low',essential:false},
{id:'light',name:'Living room lights',room:'Living room',kind:'light',on:true,essential:false},
{id:'fridge',name:'Kitchen refrigerator',room:'Kitchen',kind:'fridge',on:true,essential:true},
{id:'heater',name:'Bathroom water heater',room:'Bathroom',kind:'heater',on:false,essential:false},
{id:'door',name:'Front door',room:'Entrance',kind:'lock',locked:true,essential:true}];
function evaluate(a,c){
const d=c.devices.find(x=>x.id===a.device);
if(!d)return {decision:'DENY',reason:'UNKNOWN_DEVICE'};
if(c.role!=='owner')return {decision:'DENY',reason:'USER_NOT_AUTHORIZED'};
if(a.op==='unlock')return {decision:'DENY',reason:a.recipient==='stranger'?'UNAUTHORIZED_RECIPIENT':'UNLOCK_UNSUPPORTED_IN_DEMO'};
if(d.essential)return {decision:'DENY',reason:'ESSENTIAL_DEVICE_PROTECTED'};
if(a.op==='temperature'){
if(d.kind!=='ac')return {decision:'DENY',reason:'UNSUPPORTED_CAPABILITY'};
if(!Number.isFinite(a.value)||a.value<18||a.value>28)return {decision:'DENY',reason:'TARGET_OUT_OF_RANGE'};
return {decision:'ALLOW',reason:'VALID_COOLING_ADJUSTMENT'};}
if(a.op==='speed')return d.kind==='fan'&&['low','medium','high'].includes(a.value)?{decision:'ALLOW',reason:'VALID_AIRFLOW_ADJUSTMENT'}:{decision:'DENY',reason:'UNSUPPORTED_CAPABILITY'};
if(a.op!=='power'||typeof a.value!=='boolean')return {decision:'DENY',reason:'UNSUPPORTED_ACTION'};
if(d.kind==='heater'&&a.value){
if(!c.interlock)return {decision:'DENY',reason:'LOCAL_INTERLOCK_REQUIRED'};
if(!Number.isFinite(c.sensorAt)||c.now-c.sensorAt>30000||c.sensorAt>c.now)return {decision:'DENY',reason:'SAFETY_EVIDENCE_STALE'};
if(c.water!==true)return {decision:'DENY',reason:'WATER_NOT_PRESENT'};
return {decision:'REQUIRE_CONFIRMATION',reason:'HEATER_CONFIRMATION_REQUIRED'};}
return {decision:'ALLOW',reason:'VALID_POWER_CHANGE'};
}
function createEngine(context){let plans=new Map(),seq=0;return {
propose(actions,sensitive=false){const p={id:'plan-'+(++seq),actions:JSON.parse(JSON.stringify(actions)),sensitive,expires:context.now+120000,used:false};plans.set(p.id,p);return {id:p.id,actions:JSON.parse(JSON.stringify(p.actions)),expires:p.expires};},
execute(id,approval){const p=plans.get(id);if(!p)return {ok:false,reason:'UNKNOWN_PLAN'};if(p.used)return {ok:false,reason:'PLAN_ALREADY_USED'};if(context.now>p.expires)return {ok:false,reason:'PLAN_EXPIRED'};
const checks=p.actions.map(a=>evaluate(a,context));const denied=checks.find(x=>x.decision==='DENY');if(denied)return {ok:false,reason:denied.reason};
if((p.sensitive||checks.some(x=>x.decision==='REQUIRE_CONFIRMATION'))&&approval!==id)return {ok:false,reason:'CONFIRMATION_REQUIRED'};
p.used=true;for(const a of p.actions){const d=context.devices.find(x=>x.id===a.device);if(a.op==='power')d.on=a.value;if(a.op==='temperature'){d.target=a.value;d.on=true;}if(a.op==='speed'){d.speed=a.value;d.on=true;}}
return {ok:true,reason:'SIMULATED_STATE_VERIFIED',actions:p.actions};},
};}
const api={devices,evaluate,createEngine};if(typeof module!=='undefined')module.exports=api;else root.SafePolicy=api;
})(typeof globalThis!=='undefined'?globalThis:this);
