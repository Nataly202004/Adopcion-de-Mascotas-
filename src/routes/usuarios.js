const express=require('express');
const bcrypt=require('bcrypt');
const db=require('../config/db');
const {sign}=require('../config/session');
const router=express.Router();
router.post('/registro',async(req,res)=>{
  const {nombre_completo,correo,contrasena}=req.body||{};
  if([nombre_completo,correo,contrasena].some(v=>typeof v!=='string'||!v.trim())) return res.status(400).json({error:'Completa todos los campos.'});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) return res.status(400).json({error:'Correo inválido.'});
  if(contrasena.length<8) return res.status(400).json({error:'La contraseña debe contener al menos 8 caracteres.'});
  try {
    if(await db.findUsuarioByCorreo(correo.trim().toLowerCase())) return res.status(409).json({error:'Ya existe una cuenta con ese correo.'});
    const hash=await bcrypt.hash(contrasena,10);
    const u=await db.createUsuario({nombre_completo:nombre_completo.trim(),correo:correo.trim().toLowerCase(),contrasena:hash,rol:'usuario'});
    return res.status(201).json(u);
  } catch(e){ console.error('Registro:',e.message);return res.status(500).json({error:'No se pudo crear la cuenta.'}); }
});
router.post('/login',async(req,res)=>{
  const {correo,contrasena}=req.body||{};
  if(typeof correo!=='string'||typeof contrasena!=='string'||!correo.trim()||!contrasena) return res.status(400).json({error:'Ingresa el correo y la contraseña.'});
  try {
    const u=await db.findUsuarioByCorreo(correo.trim().toLowerCase());
    if(!u||!(await bcrypt.compare(contrasena,u.contrasena))) return res.status(400).json({error:'Credenciales incorrectas'});
    return res.json({mensaje:'Inicio de sesión exitoso',token:sign(u),usuario:{id_usuario:u.id_usuario,nombre_completo:u.nombre_completo,correo:u.correo,rol:u.rol}});
  } catch(e){console.error('Login:',e.message);return res.status(500).json({error:'No se pudo iniciar sesión.'});}
});
module.exports=router;
