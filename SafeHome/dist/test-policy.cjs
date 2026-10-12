const assert=require('node:assert/strict');const {devices,evaluate,createEngine}=require('./dist/policy.js');
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}function ctx(){return {devices:devices(),role:'owner',water:true,interlock:true,now:100000,sensorAt:100000};}
test('valid cooling',()=>assert.equal(evaluate({device:'ac',op:'temperature',value:24},ctx()).decision,'ALLOW'));
test('temperature bounds',()=>assert.equal(evaluate({device:'ac',op:'temperature',value:10},ctx()).reason,'TARGET_OUT_OF_RANGE'));
test('guest denied',()=>assert.equal(evaluate({device:'ac',op:'power',value:true},{...ctx(),role:'guest'}).decision,'DENY'));
test('fridge protected',()=>assert.equal(evaluate({device:'fridge',op:'power',value:false},ctx()).reason,'ESSENTIAL_DEVICE_PROTECTED'));
test('empty heater denied',()=>assert.equal(evaluate({device:'heater',op:'power',value:true},{...ctx(),water:false}).reason,'WATER_NOT_PRESENT'));
test('stale heater denied',()=>assert.equal(evaluate({device:'heater',op:'power',value:true},{...ctx(),sensorAt:0}).reason,'SAFETY_EVIDENCE_STALE'));
test('interlock required',()=>assert.equal(evaluate({device:'heater',op:'power',value:true},{...ctx(),interlock:false}).reason,'LOCAL_INTERLOCK_REQUIRED'));
test('stranger unlock denied',()=>assert.equal(evaluate({device:'door',op:'unlock',recipient:'stranger'},ctx()).decision,'DENY'));
test('fan cannot set temperature',()=>assert.equal(evaluate({device:'fan',op:'temperature',value:24},ctx()).reason,'UNSUPPORTED_CAPABILITY'));
test('confirmation required for away',()=>{let c=ctx(),e=createEngine(c),p=e.propose([{device:'light',op:'power',value:false}],true);assert.equal(e.execute(p.id).reason,'CONFIRMATION_REQUIRED');assert.equal(c.devices[2].on,true);});
test('approval is plan bound',()=>{let c=ctx(),e=createEngine(c),p=e.propose([{device:'light',op:'power',value:false}],true);assert.equal(e.execute(p.id,'other-plan').ok,false);});
test('state rechecked after approval',()=>{let c=ctx(),e=createEngine(c),p=e.propose([{device:'heater',op:'power',value:true}]);c.water=false;assert.equal(e.execute(p.id,p.id).reason,'WATER_NOT_PRESENT');assert.equal(c.devices[4].on,false);});
test('caller cannot mutate stored proposal',()=>{let c=ctx(),e=createEngine(c),p=e.propose([{device:'light',op:'power',value:false}],true);p.actions[0].device='fridge';assert.equal(e.execute(p.id,p.id).ok,true);assert.equal(c.devices[3].on,true);});
test('duplicate execution blocked',()=>{let c=ctx(),e=createEngine(c),p=e.propose([{device:'light',op:'power',value:false}]);assert.equal(e.execute(p.id).ok,true);assert.equal(e.execute(p.id).reason,'PLAN_ALREADY_USED');});
test('expired plan blocked',()=>{let c=ctx(),e=createEngine(c),p=e.propose([{device:'light',op:'power',value:false}],true);c.now+=120001;assert.equal(e.execute(p.id,p.id).reason,'PLAN_EXPIRED');});
test('unsafe batch makes no changes',()=>{let c=ctx(),e=createEngine(c),p=e.propose([{device:'light',op:'power',value:false},{device:'fridge',op:'power',value:false}],true);assert.equal(e.execute(p.id,p.id).ok,false);assert.equal(c.devices[2].on,true);});
console.log(count+' tests passed');
