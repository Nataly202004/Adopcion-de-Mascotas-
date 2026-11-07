const crypto = require('crypto');
const db = require('./db');
function getSecret() {
  const value=process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('Configura SESSION_SECRET (minimo 32 caracteres) en Render.');
  return value;
}
function sign(user) {
  const data=Buffer.from(JSON.stringify({id:user.id_usuario,exp:Date.now()+12*3600000})).toString('base64url');
  const sig=crypto.createHmac('sha256',getSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}
async function authenticate(req,res,next) {
  try {
    const bearer=req.get('authorization')||'';
    const token=bearer.startsWith('Bearer ') ? bearer.slice(7) : '';
    const parts=token.split('.');
    if(parts.length!==2) return res.status(401).json({error:'Inicia sesión para continuar.'});
    const [data,sig]=parts;
    const expected=crypto.createHmac('sha256',getSecret()).update(data).digest();
    const provided=Buffer.from(sig,'base64url');
    if(expected.length!==provided.length||!crypto.timingSafeEqual(expected,provided)) return res.status(401).json({error:'Sesión inválida.'});
    const payload=JSON.parse(Buffer.from(data,'base64url').toString('utf8'));
    if(!Number.isInteger(payload.id)||typeof payload.exp!=='number'||payload.exp<Date.now()) return res.status(401).json({error:'Sesión vencida.'});
    const user=await db.findUsuarioById(payload.id);
    if(!user) return res.status(401).json({error:'Usuario no encontrado.'});
    req.usuario=user;
    next();
  } catch(error) {console.error('Validación de sesión:',error.message);return res.status(401).json({error:'No se pudo validar la sesión.'});}
}
function adminOnly(req,res,next) {
  if(req.usuario?.rol!=='admin') return res.status(403).json({error:'Solo los administradores pueden realizar esta acción.'});
  return next();
}
module.exports={sign,authenticate,adminOnly};
