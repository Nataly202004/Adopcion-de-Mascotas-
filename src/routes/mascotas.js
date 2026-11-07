const express=require('express');
const db=require('../config/db');
const {authenticate,adminOnly}=require('../config/session');
const router=express.Router();
router.get('/',async(req,res)=>{
  try {return res.json(await db.listMascotas());}
  catch(e){console.error('Listado mascotas:',e.message);return res.status(500).json({error:'No se pudieron cargar las mascotas.'});}
});
router.post('/registro',authenticate,adminOnly,async(req,res)=>{
  const {nombre,especie,raza,edad,descripcion,foto_url}=req.body||{};
  if([nombre,especie,descripcion].some(v=>typeof v!=='string'||!v.trim())) return res.status(400).json({error:'Completa los campos requeridos.'});
  const edadNum=Number(edad);
  if(!Number.isInteger(edadNum)||edadNum<0) return res.status(400).json({error:'Edad inválida.'});
  if(foto_url && !/^https:\/\//i.test(foto_url)) return res.status(400).json({error:'La imagen debe ser una URL HTTPS.'});
  const descripcionFinal=`${raza?.trim() ? `Raza: ${raza.trim()}\n`:''}${descripcion.trim()}`;
  try {
    const m=await db.createMascota({nombre:nombre.trim(),especie:especie.toLowerCase().trim(),edad:edadNum,descripcion:descripcionFinal,foto_url:foto_url?.trim()||null,id_admin_registro:req.usuario.id_usuario});
    return res.status(201).json({mensaje:'Mascota registrada correctamente.',mascota:m});
  } catch(e){console.error('Registro mascota:',e.message);return res.status(500).json({error:'No se pudo registrar la mascota. Comprueba las columnas de Supabase.'});}
});
module.exports=router;
