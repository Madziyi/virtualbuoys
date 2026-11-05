const base = 'https://dbsuryesimzatxhznurh.supabase.co/functions/v1/public-api/v1'
const get = async p => { const r=await fetch(base+p); const body=await r.json(); return {status:r.status,body,headers:r.headers} }
const assert=(x,m)=>{if(!x) throw Error(m)}
const health=await get('/health'); assert(health.status===200,'health')
const list=await get('/buoys'); assert(list.body.buoys.length===3,'buoys')
const params=await get('/parameters'); assert(params.body.parameters.length===16,'parameters'); assert(params.body.parameters.find(p=>p.key==='cdom').description.includes('not an absolute'),'cdom')
for (const slug of ['west','central','east']) { const b=await get('/buoys/'+slug); const l=await get('/buoys/'+slug+'/latest'); assert(b.status===200 && l.body.observations.length===23,slug+' latest'); assert(l.body.observations.find(x=>x.parameter.key==='wind_direction').direction_convention==='from','wind'); assert(l.body.observations.find(x=>x.parameter.key==='current_direction').direction_convention==='to','current') }
for (const h of [24,72,168]) { const r=await get('/buoys/central/observations?parameter=water_temperature&hours='+h); assert(r.status===200 && r.body.observations.length>0 && new Set(r.body.observations.map(x=>x.depth_m)).size===3,'history '+h); assert(r.body.observations.every((x,i,a)=>!i || x.observed_at>=a[i-1].observed_at),'order'); console.log(h+'h: '+r.body.observations.length+' observations') }
for(const p of ['/buoys/nope','/buoys/central/observations?parameter=nope','/buoys/central/observations?parameter=water_temperature&depth_m=99','/buoys/central/observations?parameter=water_temperature&hours=169']) { const r=await get(p); assert(r.status>=400 && r.body.error?.code,p) }
const method=await fetch(base+'/buoys',{method:'POST'}); assert(method.status===405,'method')
const options=await fetch(base+'/buoys',{method:'OPTIONS',headers:{Origin:'https://example.com','Access-Control-Request-Method':'GET'}}); assert(options.status===204 && options.headers.get('access-control-allow-origin')==='*','cors')
console.log('health, three buoys/latest, 16 parameters, directions, CDOM, errors, methods and CORS passed')
