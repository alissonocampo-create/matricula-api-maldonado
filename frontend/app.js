"use strict";
const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const icon = name => '<i data-lucide="' + name + '"></i>';
const icons = () => window.lucide?.createIcons();
const modules = {
  inicio:{title:"Inicio / Resumen",icon:"layout-dashboard"},
  carreras:{title:"Carreras",icon:"graduation-cap",schema:"CarreraEntrada",columns:["codigo","nombre","duracion_anios","activo"]},
  estudiantes:{title:"Estudiantes",icon:"users",schema:"EstudianteEntrada",columns:["cuenta","nombres","apellidos","correo","carrera_nombre","estado"]},
  docentes:{title:"Docentes",icon:"contact",schema:"DocenteEntrada",columns:["numero_empleado","nombres","apellidos","correo","especialidad","estado"]},
  asignaturas:{title:"Asignaturas",icon:"book-open",schema:"AsignaturaEntrada",columns:["codigo","nombre","unidades_valorativas","carrera_nombre","requisito_codigo","activo"]},
  periodos:{title:"Períodos",icon:"calendar-days",schema:"PeriodoEntrada",columns:["nombre","fecha_inicio","fecha_fin","activo"]},
  aulas:{title:"Aulas",icon:"building",schema:"AulaEntrada",columns:["codigo","edificio","capacidad","activo"]},
  secciones:{title:"Secciones",icon:"calendar-range",schema:"SeccionEntrada",columns:["codigo","asignatura_nombre","docente_nombre","periodo_nombre","aula_codigo","dias","hora_inicio","hora_fin","cupos_disponibles","estado"]},
  matriculas:{title:"Matrículas",icon:"clipboard-list",schema:"MatriculaEntrada",columns:["estudiante_nombre","asignatura_nombre","seccion_codigo","periodo_nombre","estado"]},
  calificaciones:{title:"Calificaciones",icon:"file-pen-line",schema:"CalificacionEntrada",columns:["estudiante_nombre","asignatura_nombre","primer_parcial","segundo_parcial","tercer_parcial","nota_final","resultado"]},
  reportes:{title:"Reportes",icon:"chart-no-axes-combined"}
};
const labels = {codigo:"Código",nombre:"Nombre",duracion_anios:"Duración (años)",activo:"Activo",cuenta:"Cuenta",nombres:"Nombres",apellidos:"Apellidos",correo:"Correo",telefono:"Teléfono",fecha_nacimiento:"Fecha de nacimiento",carrera_id:"Carrera",carrera_nombre:"Carrera",estado:"Estado",numero_empleado:"N.º empleado",especialidad:"Especialidad",unidades_valorativas:"Unidades valorativas",requisito_id:"Requisito",requisito_codigo:"Requisito",anio:"Año",numero:"Número",fecha_inicio:"Fecha de inicio",fecha_fin:"Fecha de fin",edificio:"Edificio",capacidad:"Capacidad",asignatura_id:"Asignatura",docente_id:"Docente",periodo_id:"Período",aula_id:"Aula",dias:"Días",hora_inicio:"Hora de inicio",hora_fin:"Hora de fin",cupo_maximo:"Cupo máximo",asignatura_nombre:"Asignatura",docente_nombre:"Docente",periodo_nombre:"Período",aula_codigo:"Aula",cupos_disponibles:"Cupos disponibles",estudiante_id:"Estudiante",seccion_id:"Sección",estudiante_nombre:"Estudiante",seccion_codigo:"Sección",matricula_id:"Matrícula",primer_parcial:"Primer parcial",segundo_parcial:"Segundo parcial",tercer_parcial:"Tercer parcial",nota_final:"Nota final",resultado:"Resultado",observacion:"Observación",periodo:"Período",asignatura:"Asignatura",asignatura_codigo:"Código",seccion:"Sección",estudiante:"Estudiante",estudiantes:"Estudiantes",asignaturas_cursadas:"Asignaturas cursadas",unidades_valorativas_aprobadas:"UV aprobadas",cantidad_matriculados:"Matriculados",total_secciones:"Secciones",id:"ID",fecha_matricula:"Fecha de matrícula"};
const label = key => labels[key] || key.replaceAll("_"," ");
const relations = {carrera_id:"carreras",requisito_id:"asignaturas",asignatura_id:"asignaturas",docente_id:"docentes",periodo_id:"periodos",aula_id:"aulas",estudiante_id:"estudiantes",seccion_id:"secciones",matricula_id:"matriculas"};
let user = null, current = "inicio", rows = [], schemas = {}, page = 0, requestVersion = 0, editing = null, editorVersion = 0, action = null, busy = false;
const pageSize = 15;
// Modulos habilitados en el orden del menu.
const enabledModules = ["inicio", "carreras", "estudiantes", "docentes", "asignaturas", "periodos","aulas","secciones","matriculas","calificaciones","reportes"];
async function api(path, method="GET", body) {
  const response = await fetch(path.startsWith("/openapi") ? path : "/api/v1" + path, {method,headers:body ? {"Content-Type":"application/json"} : {},body:body ? JSON.stringify(body) : undefined});
  const data = await response.json().catch(()=>null);
  if (!response.ok) {
    const detail = data?.detail;
    throw new Error(Array.isArray(detail) ? detail.map(e=>label(e.loc.at(-1))+": "+e.msg).join("\n") : detail || "No se pudo completar la operación.");
  }
  return data;
}
async function all(resource) {
  if(resource !== "estudiantes") return api("/"+resource);
  const result=[];
  for(let offset=0;;offset+=100) {
    const batch=await api("/estudiantes?limite=100&desplazamiento="+offset);
    result.push(...batch);
    if(batch.length<100) return result;
  }
}
function notice(message="", error=false){$("notice").textContent=message;$("notice").className=error?"error":"";}
function nameOf(resource,r) {
  if(resource==="estudiantes") return r.cuenta+" · "+r.nombres+" "+r.apellidos;
  if(resource==="docentes") return r.numero_empleado+" · "+r.nombres+" "+r.apellidos;
  if(resource==="secciones") return r.asignatura_nombre+" · "+r.codigo+" · "+r.periodo_nombre+" · "+r.dias+" "+r.hora_inicio+" ("+r.cupos_disponibles+" cupos)";
  if(resource==="matriculas") return r.estudiante_nombre+" · "+r.asignatura_nombre+" · "+r.seccion_codigo+" · "+r.periodo_nombre+" · "+r.estado;
  return [r.codigo,r.nombre||r.edificio].filter(Boolean).join(" · ") || String(r.id);
}
function badge(value) {
  const text = typeof value==="boolean" ? (value?"Activo":"Inactivo") : value;
  const good=["ACTIVO","ABIERTA","APROBADA","MATRICULADA","Activo"].includes(text);
  const bad=["CANCELADA","REPROBADA","INACTIVO","Inactivo"].includes(text);
  return '<span class="badge '+(good?"good":bad?"bad":"")+'">'+esc(text)+'</span>';
}
function table(data, columns, actions=false) {
  if(!data.length) return '<p class="empty">No hay registros para mostrar.</p>';
  return '<table><thead><tr>'+columns.map(k=>'<th scope="col">'+esc(label(k))+'</th>').join("")+(actions?'<th scope="col">Acciones</th>':"")+'</tr></thead><tbody>'+data.map(r=>'<tr>'+columns.map(k=>'<td>'+(["activo","estado","resultado"].includes(k)?badge(r[k]):esc(r[k]??"—"))+'</td>').join("")+(actions?'<td><div class="row-actions">'+rowActions(r)+'</div></td>':"")+'</tr>').join("")+'</tbody></table>';
}
function actionButton(r,type,title,symbol){return '<button class="icon-button" data-id="'+r.id+'" data-action="'+type+'" title="'+title+'" aria-label="'+title+'">'+icon(symbol)+'</button>';}
function rowActions(r) {
  if(current==="matriculas") return r.estado==="MATRICULADA"?actionButton(r,"cancel","Cancelar matrícula","ban"):'<span class="muted">Sin acciones</span>';
  return actionButton(r,"edit",current==="calificaciones"?"Editar notas":"Editar","pencil")+actionButton(r,"delete","Eliminar","trash-2");
}
$("navigation").innerHTML=enabledModules.map(key=>'<a href="#'+key+'">'+icon(modules[key].icon)+'<span>'+modules[key].title+'</span></a>').join("");
icons();
$("login-form").addEventListener("submit",async e=>{
  e.preventDefault();const button=e.submitter;button.disabled=true;$("login-error").textContent="";
  try{
    const form=new FormData(e.target);
    const result=await api("/auth/login","POST",{usuario:form.get("usuario").trim(),clave:form.get("clave")});
    schemas=(await api("/openapi.json")).components.schemas;
    user=result;$("user").innerHTML=esc(user.nombre_completo)+"<small>"+esc(user.rol)+"</small>";
    $("login").hidden=true;$("app").hidden=false;e.target.reset();await navigate();
  }catch(err){$("login-error").textContent=err.message||"No se pudo iniciar sesión.";}finally{button.disabled=false;}
});
$("logout").onclick=()=>{user=null;requestVersion++;editorVersion++;$("editor").close();$("confirmation").close();$("app").hidden=true;$("login").hidden=false;$("login-form").reset();location.hash="inicio";};
window.addEventListener("hashchange",()=>{if(user)navigate();});
async function navigate() {
  if(!user)return;
  const next=location.hash.slice(1);current=enabledModules.includes(next)?next:"inicio";
  const version=++requestVersion;editorVersion++;$("editor").close();$("confirmation").close();
  $("title").textContent=modules[current].title;
  document.querySelectorAll("nav a").forEach(a=>{if(a.hash==="#"+current)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
  for(const id of ["summary","records","reports"])$(id).hidden=true;
  $("search").value="";rows=[];page=0;notice("Cargando...");
  $("create").disabled=true;
  try{
    if(current==="inicio"){
      const summary=await api("/reportes/dashboard");if(version!==requestVersion)return;
      const names={estudiantes_activos:"Estudiantes activos",docentes_activos:"Docentes activos",carreras_activas:"Carreras activas",asignaturas_activas:"Asignaturas activas",secciones_abiertas:"Secciones abiertas",matriculas_activas:"Matrículas activas"};
      $("summary").innerHTML='<p class="muted">Período activo: <strong>'+esc(summary.periodo_activo||"Ninguno")+'</strong></p><div class="stats">'+Object.entries(names).map(([k,v])=>'<article class="stat"><strong>'+esc(summary[k])+'</strong><span>'+v+'</span></article>').join("")+'</div><h2>Acceso directo</h2><div class="quick-links"><a href="#carreras">Carreras</a><a href="#estudiantes">Estudiantes</a></div>';
      $("summary").hidden=false;
    }else if(current==="reportes"){
      $("reports").hidden=false;$("report-result").innerHTML="";await reportOptions();if(version!==requestVersion)return;
    }else{
      const resource=current;let data=await all(resource);
      if(resource==="calificaciones"){
        const enrolled=await all("matriculas");const byId=new Map(enrolled.map(r=>[r.id,r]));
        data=data.map(r=>({...r,estudiante_nombre:byId.get(r.matricula_id)?.estudiante_nombre,asignatura_nombre:byId.get(r.matricula_id)?.asignatura_nombre}));
      }
      if(version!==requestVersion)return;
      rows=data;$("records").hidden=false;$("create").disabled=false;renderRows();
    }
    notice();icons();
  }catch(err){if(version===requestVersion)notice(err.message||"No se pudo conectar con el servidor.",true);}
}
function renderRows(){
  const query=$("search").value.toLocaleLowerCase();
  const filtered=rows.filter(r=>modules[current].columns.some(k=>String(r[k]??"").toLocaleLowerCase().includes(query)));
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.min(page,pages-1);
  $("count").textContent=filtered.length+" registros";
  $("data-table").innerHTML=table(filtered.slice(page*pageSize,(page+1)*pageSize),modules[current].columns,true);
  $("page-label").textContent=(page+1)+" / "+pages;$("previous").disabled=page===0;$("next").disabled=page>=pages-1;icons();
}
$("search").oninput=()=>{page=0;renderRows();};
$("previous").onclick=()=>{page--;renderRows();};$("next").onclick=()=>{page++;renderRows();};
$("refresh").onclick=()=>navigate();
function resolve(def){return def.$ref?schemas[def.$ref.split("/").at(-1)]:def.anyOf?resolve(def.anyOf.find(d=>d.type!=="null")):def;}
function field(name,raw,required,value,options){
  const def=resolve(raw), caption=label(name);
  required = required || !(raw.anyOf || []).some(item => item.type === "null");
  const v=value??raw.default??def.default??"";
  if(def.type==="boolean")return '<label class="check"><input name="'+name+'" type="checkbox" '+(v?"checked":"")+'>'+caption+'</label>';
  let control;
  if(options||def.enum){
    const choices=options||def.enum.map(v=>({id:v,text:v}));
    control='<select name="'+name+'" '+(required?"required":"")+'><option value="">'+(required?"Seleccionar":"Ninguno")+'</option>'+choices.map(o=>'<option value="'+esc(o.id)+'" '+(String(v)===String(o.id)?"selected":"")+'>'+esc(o.text)+'</option>').join("")+'</select>';
  }else{
    const numeric=["number","integer"].includes(def.type);
    const type=numeric?"number":def.format==="date"?"date":def.format==="email"?"email":name.startsWith("hora_")?"time":"text";
    const attrs=[required?"required":"",def.minLength!==undefined?'minlength="'+def.minLength+'"':"",def.maxLength!==undefined?'maxlength="'+def.maxLength+'"':"",def.minimum!==undefined?'min="'+def.minimum+'"':"",def.maximum!==undefined?'max="'+def.maximum+'"':"",numeric?'step="'+(def.type==="integer"?"1":"any")+'"':""].join(" ");
    control='<input name="'+name+'" type="'+type+'" value="'+esc(v)+'" '+attrs+(name==="dias"?' placeholder="LU-MI"':"")+'>';
  }
  return '<label>'+caption+(required?"":" (opcional)")+control+'</label>';
}
async function openEditor(row=null) {
  const resource=current,version=++editorVersion;editing={resource,row};
  $("editor-title").textContent=(row?"Editar":"Agregar")+" · "+modules[resource].title;
  $("editor-error").textContent="";$("fields").innerHTML='<p class="muted">Cargando...</p>';$("save").disabled=true;$("editor").showModal();
  try{
    const schema=schemas[modules[resource].schema];
    const properties={...(resource==="calificaciones"?{matricula_id:{type:"integer"}}:{}),...schema.properties};
    const values={...(row||{})},required=new Set(schema.required||[]);
    if(resource==="calificaciones")required.add("matricula_id");
    const options={};
    await Promise.all(Object.keys(properties).filter(k=>relations[k]).map(async k=>{
      let data=await all(relations[k]);
      if(k==="requisito_id")data=data.filter(r=>r.id!==row?.id);
      if(k==="matricula_id")data=data.filter(r=>r.estado!=="CANCELADA"||r.id===row?.matricula_id);
      options[k]=data.map(r=>({id:r.id,text:nameOf(relations[k],r)}));
    }));
    if(version!==editorVersion||!$("editor").open)return;
    $("fields").innerHTML=Object.entries(properties).map(([k,d])=>field(k,d,required.has(k),values[k],options[k])).join("");
    if(resource==="calificaciones"){
      if(row)$("editor-form").elements.matricula_id.disabled=true;
      $("fields").insertAdjacentHTML("beforeend",'<output id="grade-preview" class="grade-preview wide"></output>');gradePreview();
    }
    $("save").disabled=false;icons();$("fields").querySelector("input,select")?.focus();
  }catch(err){if(version===editorVersion)$("editor-error").textContent=err.message;}
}
function gradePreview(){
  const form=$("editor-form");const names=["primer_parcial","segundo_parcial","tercer_parcial"];
  const ready=names.every(n=>form.elements[n].value!==""&&form.elements[n].validity.valid);
  $("grade-preview").textContent=ready?"Promedio: "+(names.reduce((sum,n)=>sum+Number(form.elements[n].value),0)/3).toFixed(2):"Promedio: —";
}
$("editor-form").oninput=()=>{if(editing?.resource==="calificaciones")gradePreview();};
$("create").onclick=()=>openEditor();
function closeEditor(){if(!busy){editorVersion++;$("editor").close();}}
$("close-editor").onclick=closeEditor;$("cancel-editor").onclick=closeEditor;
$("editor").addEventListener("cancel",e=>{if(busy)e.preventDefault();else editorVersion++;});
$("editor-form").onsubmit=async e=>{
  e.preventDefault();if(busy)return;
  const {resource,row}=editing, schema=schemas[modules[resource].schema],form=e.target,body={};
  for(const [k,raw]of Object.entries(schema.properties)){
    const def=resolve(raw),input=form.elements[k];
    body[k]=def.type==="boolean"?input.checked:input.value===""?null:["number","integer"].includes(def.type)?Number(input.value):input.value.trim();
  }
  let path="/"+resource+(row?"/"+row.id:""),method=row?"PUT":"POST";
  if(resource==="calificaciones"){path="/calificaciones/matricula/"+form.elements.matricula_id.value;method="PUT";}
  busy=true;$("save").disabled=true;$("editor-error").textContent="";
  try{await api(path,method,body);$("editor").close();await navigate();notice("Registro guardado correctamente.");}
  catch(err){$("editor-error").textContent=err.message||"No se pudo guardar.";}
  finally{busy=false;$("save").disabled=false;}
};
$("data-table").onclick=e=>{
  const button=e.target.closest("button[data-action]");if(!button)return;
  const row=rows.find(r=>r.id===Number(button.dataset.id));if(!row)return;
  if(button.dataset.action==="edit"){openEditor(row);return;}
  action={resource:current,row,type:button.dataset.action};
  $("confirmation-error").textContent="";
  $("confirmation-text").textContent=action.type==="cancel"?"¿Cancelar la matrícula de "+row.estudiante_nombre+" en "+row.asignatura_nombre+"? Se conservará el historial.":"¿Eliminar "+(row.nombre||row.nombres||row.codigo||"el registro #"+row.id)+"? Esta operación no se puede deshacer.";
  $("confirmation").showModal();
};
$("cancel-confirmation").onclick=()=>{if(!busy)$("confirmation").close();};
$("confirmation").addEventListener("cancel",e=>{if(busy)e.preventDefault();});
$("confirmation-form").onsubmit=async e=>{
  e.preventDefault();if(busy)return;busy=true;$("confirm").disabled=true;
  const {resource,row,type}=action;
  const path=resource==="calificaciones"?"/calificaciones/matricula/"+row.matricula_id:"/"+resource+"/"+row.id+(type==="cancel"?"/cancelar":"");
  try{await api(path,type==="cancel"?"PATCH":"DELETE");$("confirmation").close();await navigate();notice(type==="cancel"?"Matrícula cancelada.":"Registro eliminado.");}
  catch(err){$("confirmation-error").textContent=err.message;}
  finally{busy=false;$("confirm").disabled=false;}
};
let reportVersion=0;
async function reportOptions(){
  const version=++reportVersion;$("report-target").innerHTML='<option value="">Cargando...</option>';$("report-result").innerHTML="";
  const resource={"historial-estudiante":"estudiantes","lista-seccion":"secciones","carga-docente":"docentes"}[$("report-type").value];
  const data=await all(resource);if(version!==reportVersion)return;
  $("report-target").innerHTML='<option value="">Seleccionar</option>'+data.map(r=>'<option value="'+r.id+'">'+esc(nameOf(resource,r))+'</option>').join("");
}
$("report-type").onchange=()=>reportOptions().catch(err=>notice(err.message,true));
$("report-target").onchange=()=>{reportVersion++;$("report-result").innerHTML="";};
$("report-form").onsubmit=async e=>{
  e.preventDefault();const version=++reportVersion,viewVersion=requestVersion,type=$("report-type").value,button=e.submitter;button.disabled=true;notice("Cargando reporte...");$("report-result").innerHTML="";
  try{
    const data=await api("/reportes/"+type+"/"+$("report-target").value);if(version!==reportVersion||viewVersion!==requestVersion)return;
    const subject=data.estudiante||data.seccion||data.docente;
    const title=subject.nombre||[subject.nombres,subject.apellidos].filter(Boolean).join(" ")||[subject.asignatura,subject.seccion].join(" · ");
    const list=data.historial||data.estudiantes||data.secciones;
    const summary=data.resumen||Object.fromEntries(Object.entries(data).filter(([k,v])=>typeof v==="number"));
    $("report-result").innerHTML='<h2 class="report-heading">'+esc(title)+'</h2><div class="report-summary">'+Object.entries(summary).map(([k,v])=>'<p>'+esc(label(k))+': <strong>'+esc(v)+'</strong></p>').join("")+'</div><div class="table-scroll">'+table(list,list.length?Object.keys(list[0]):[])+'</div>';notice();
  }catch(err){if(version===reportVersion)notice(err.message,true);}finally{button.disabled=false;}
};
