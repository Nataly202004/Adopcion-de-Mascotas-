const express=require('express');
const db=require('../config/db');
const {authenticate}=require('../config/session');
const router=express.Router();
router.post('/adopcion',authenticate,async(req,res)=>{
  const {mascota,nombre,celular,direccion,correo,mensaje,id_mascota}=req.body||{};
  if([mascota,nombre,celular,direccion,correo,mensaje].some(v=>typeof v!=='string'||!v.trim())) return res.status(400).json({error:'Completa todos los campos de la solicitud.'});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return res.status(400).json({error:'Correo inválido.'});
  const id=(id_mascota==null||id_mascota==='')?null:Number(id_mascota);
  if(id!==null&&(!Number.isInteger(id)||id<1)) return res.status(400).json({error:'Mascota inválida.'});
  try {
    if(id!==null){
      const mascotas=await db.listMascotas();
      if(!mascotas.some(m=>Number(m.id_mascota)===id&&String(m.estado).toLowerCase()!=='adoptada')) return res.status(400).json({error:'La mascota seleccionada no está disponible.'});
    }
    const detalle={mascota:mascota.trim(),nombre:nombre.trim(),celular:celular.trim(),direccion:direccion.trim(),correo:correo.trim(),mensaje:mensaje.trim(),tipo:id===null?'demostracion':'registro_real'};
    const row=await db.createSolicitud({id_usuario:req.usuario.id_usuario,id_mascota:id,comentario:JSON.stringify(detalle)});
    return res.status(201).json({mensaje:'Solicitud guardada correctamente.',id_solicitud:row?.id_solicitud||null});
  } catch(e){console.error('Solicitud:',e.message);return res.status(500).json({error:'No se pudo guardar la solicitud en la base de datos.'});}
});
module.exports=router;
